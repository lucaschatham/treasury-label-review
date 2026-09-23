"""R-012: fixed all-feature fine-tune; no production imports or network calls."""
import argparse, hashlib, json, random, time
from pathlib import Path
import numpy as np
from PIL import Image
import torch, timm
from safetensors.torch import load_file
from finetune_contract import cutoff_for, summarize

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def write(path,obj):
 with open(path,'x') as f:json.dump(obj,f,indent=2,allow_nan=False)
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--inputs-root',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
 a.output.mkdir(parents=True,exist_ok=False)
 started=time.monotonic();seed=20260923
 random.seed(seed);np.random.seed(seed);torch.manual_seed(seed);torch.set_num_threads(2)
 manifest_path=a.inputs_root/'evidence/appearance-mobilenet-inputs-frozen.json'
 m=json.loads(manifest_path.read_text());rows=m['rows'];arrays=[];families={};pixels={}
 for r in rows:
  for registry,key in [(families,r['family'].lower()),(pixels,r['pixelSha256'])]:
   if key in registry and registry[key]!=r['split']:raise ValueError('Split leakage')
   registry[key]=r['split']
  p=a.inputs_root/r['input'];assert sha(p)==r['inputSha256']
  rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255
  tensor=np.ascontiguousarray(((rgb-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1))
  assert hashlib.sha256(tensor.tobytes()).hexdigest()==r['tensorSha256']
  arrays.append(tensor)
 assert sha(m['assets']['model'])==m['assets']['modelSha256']
 device='mps' if torch.backends.mps.is_available() else 'cpu'
 write(a.output/'protocol.json',{'experiment':'R-012','seed':seed,'device':device,'torch':torch.__version__,'timm':timm.__version__,'manifestSha256':sha(manifest_path),'checkpointSha256':m['assets']['modelSha256'],'codeSha256':sha(__file__),'epochs':12,'batchSize':32,'learningRate':.0001,'weightDecay':.01,'selection':'last epoch only','data':'exposed development only','maxSeconds':600})
 model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False)
 model.load_state_dict(load_file(m['assets']['model']));model.reset_classifier(1);model.to(device)
 x=torch.from_numpy(np.stack(arrays));labels=torch.tensor([r['expected']=='BOLD' for r in rows],dtype=torch.float32)
 train=[i for i,r in enumerate(rows) if r['split']=='train']
 loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[train],labels[train]),batch_size=32,shuffle=True,generator=torch.Generator().manual_seed(seed))
 optimizer=torch.optim.AdamW(model.parameters(),lr=.0001,weight_decay=.01);loss_fn=torch.nn.BCEWithLogitsLoss();losses=[]
 for epoch in range(12):
  model.train();loss_sum=0
  for bx,by in loader:
   if time.monotonic()-started>600:
    write(a.output/'result.json',{'decision':'STOP','reason':'resource limit','epochs':epoch});return
   optimizer.zero_grad();logits=model(bx.to(device)).flatten();loss=loss_fn(logits,by.to(device));loss.backward();optimizer.step();loss_sum+=loss.item()*len(bx)
  losses.append(loss_sum/len(train));print(json.dumps({'epoch':epoch+1,'trainingLoss':losses[-1],'seconds':time.monotonic()-started}),flush=True)
 model.eval();scores=[]
 with torch.inference_mode():
  for i in range(0,len(x),32):scores.extend(model(x[i:i+32].to(device)).flatten().sigmoid().cpu().tolist())
 cal=[i for i,r in enumerate(rows) if r['split']=='calibration'];y=labels.int().tolist();cut=cutoff_for([scores[i] for i in cal],[y[i] for i in cal])
 summaries={}
 for category in ['calibration']+sorted({r['category'] for r in rows if r['split']=='challenge'}):
  indices=cal if category=='calibration' else [i for i,r in enumerate(rows) if r['split']=='challenge' and r['category']==category]
  summaries[category]=summarize([scores[i] for i in indices],[y[i] for i in indices],cut)
 output=[dict(id=r['id'],family=r['family'],split=r['split'],category=r['category'],expected=r['expected'],score=s,verdict='MATCH' if s>=cut else 'REVIEW') for r,s in zip(rows,scores)]
 byid={r['id']:r for r in output};invariants=[]
 for pair in m['bodyInvariants']:
  first,second=[byid[k] for k in pair['ids']];invariants.append(dict(ids=pair['ids'],same=abs(first['score']-second['score'])<1e-6 and first['verdict']==second['verdict']))
 model.cpu();torch.save(model.state_dict(),a.output/'model.pt')
 result={'decision':'ADVANCE' if all(s['pass'] for s in summaries.values()) and all(v['same'] for v in invariants) else 'STOP','summaries':summaries,'cutoff':cut,'bodyInvariants':invariants,'trainingLosses':losses,'wallSeconds':time.monotonic()-started,'checkpointSha256':sha(a.output/'model.pt'),'rows':output,'limitations':['Exposed synthetic development only','No independent real-label qualification','No browser latency qualification']}
 write(a.output/'result.json',result);print(json.dumps({k:result[k] for k in ['decision','summaries','cutoff','wallSeconds']},indent=2),flush=True)
if __name__=='__main__':main()
