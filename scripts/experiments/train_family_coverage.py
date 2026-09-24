"""R-021: equal optimizer-step baseline and expanded-family arms."""
import argparse, hashlib, json, random, time
from pathlib import Path
import numpy as np
from PIL import Image
import torch, timm
from safetensors.torch import load_file
from finetune_contract import cutoff_for, summarize
from experiment_budget import check_budget
from family_coverage import validate_pixels

ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write(p,obj):
 with p.open('x') as f:json.dump(obj,f,indent=2,allow_nan=False)
class Inputs(torch.utils.data.Dataset):
 def __init__(self,rows):self.rows=rows
 def __len__(self):return len(self.rows)
 def __getitem__(self,i):
  row=self.rows[i];rgb=np.asarray(Image.open(row['input']).convert('RGB'),dtype=np.float32)/255
  tensor=np.ascontiguousarray(((rgb-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1))
  return torch.from_numpy(tensor),torch.tensor(float(row['expected']=='BOLD'))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--arm',choices=['baseline','expanded'],required=True);a=ap.parse_args()
 out=ROOT.parent/f'treasury-label-review-r021-{a.arm}';out.mkdir(exist_ok=False)
 started=time.monotonic();seed=20260923;random.seed(seed);np.random.seed(seed);torch.manual_seed(seed);torch.set_num_threads(2)
 research=ROOT.parent/'treasury-label-review-mobilenet'
 source=research/'evidence/appearance-mobilenet-inputs-frozen.json';m=json.loads(source.read_text())
 rows=[{**r,'input':str(research/r['input'])} for r in m['rows']]
 expanded=ROOT.parent/'treasury-label-review-r021-assets/manifest.json';extra=json.loads(expanded.read_text())
 validate_pixels(rows+extra['rows'])
 train=[r for r in rows if r['split']=='train']+(extra['rows'] if a.arm=='expanded' else [])
 assert len(train)==(1024 if a.arm=='baseline' else 4096)
 assert len({r['family'] for r in train})==(16 if a.arm=='baseline' else 64)
 assert sum(r['expected']=='BOLD' for r in train)==len(train)//2
 for r in rows+extra['rows']:
  check_budget(started,time.monotonic(),900)
  assert sha(r['input'])==r['inputSha256']
 assert sha(m['assets']['model'])==m['assets']['modelSha256']
 device='mps' if torch.backends.mps.is_available() else 'cpu'
 protocol=dict(experiment='R-021',arm=a.arm,sourceManifestSha256=sha(source),expandedManifestSha256=sha(expanded),sourceCheckpointSha256=m['assets']['modelSha256'],codeSha256=sha(__file__),seed=seed,steps=1536,batchSize=32,learningRate=.0001,weightDecay=.01,trainImages=len(train),trainFamilies=len({r['family'] for r in train}),maxSeconds=900,device=device,torch=torch.__version__,timm=timm.__version__)
 write(out/'protocol.json',protocol)
 model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False);model.load_state_dict(load_file(m['assets']['model']));model.reset_classifier(1);model.to(device)
 loader=torch.utils.data.DataLoader(Inputs(train),batch_size=32,shuffle=True,generator=torch.Generator().manual_seed(seed))
 optimizer=torch.optim.AdamW(model.parameters(),lr=.0001,weight_decay=.01);loss_fn=torch.nn.BCEWithLogitsLoss();steps=0;losses=[]
 while steps<1536:
  model.train();total=0;count=0
  for bx,by in loader:
   check_budget(started,time.monotonic(),900)
   optimizer.zero_grad();loss=loss_fn(model(bx.to(device)).flatten(),by.to(device));loss.backward();optimizer.step()
   total+=loss.item()*len(bx);count+=len(bx);steps+=1
   check_budget(started,time.monotonic(),900)
   if steps==1536:break
  losses.append(total/count);print(json.dumps(dict(arm=a.arm,steps=steps,loss=losses[-1],seconds=time.monotonic()-started)),flush=True)
 model.eval();evaluation=[r for r in rows if r['split']!='train'];scores=[]
 with torch.inference_mode():
  for bx,_ in torch.utils.data.DataLoader(Inputs(evaluation),batch_size=32):
   check_budget(started,time.monotonic(),900);scores.extend(model(bx.to(device)).flatten().sigmoid().cpu().tolist())
 labels=[int(r['expected']=='BOLD') for r in evaluation]
 cal=[i for i,r in enumerate(evaluation) if r['split']=='calibration'];cut=cutoff_for([scores[i] for i in cal],[labels[i] for i in cal])
 summaries={}
 for category in ['calibration']+sorted({r['category'] for r in evaluation if r['split']=='challenge'}):
  indices=cal if category=='calibration' else [i for i,r in enumerate(evaluation) if r['category']==category and r['split']=='challenge']
  summaries[category]=summarize([scores[i] for i in indices],[labels[i] for i in indices],cut)
 output=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(score=s,verdict='MATCH' if s>=cut else 'REVIEW') for r,s in zip(evaluation,scores)]
 byid={r['id']:r for r in output};invariants=[]
 for pair in m['bodyInvariants']:
  first,second=[byid[k] for k in pair['ids']];invariants.append(dict(ids=pair['ids'],same=abs(first['score']-second['score'])<1e-6 and first['verdict']==second['verdict']))
 model.cpu();torch.save(model.state_dict(),out/'model.pt');check_budget(started,time.monotonic(),900)
 result=dict(decision='ADVANCE' if all(s['pass'] for s in summaries.values()) and all(v['same'] for v in invariants) else 'STOP',summaries=summaries,cutoff=cut,bodyInvariants=invariants,rows=output,trainingLosses=losses,wallSeconds=time.monotonic()-started,modelSha256=sha(out/'model.pt'))
 write(out/'result.json',result);print(json.dumps({k:result[k] for k in ['decision','summaries','cutoff','wallSeconds']},indent=2),flush=True)
if __name__=='__main__':main()
