"""R-018: fixed all-feature fine-tune; no production imports or network calls."""
import argparse, hashlib, json, random, time, sys
from experiment_budget import check_budget
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
 ap=argparse.ArgumentParser();ap.add_argument('--inputs-root',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--arm',choices=['baseline','treatment'],required=True);a=ap.parse_args()
 a.output.mkdir(parents=True,exist_ok=False)
 started=time.monotonic();seed=20260923
 random.seed(seed);np.random.seed(seed);torch.manual_seed(seed);torch.set_num_threads(2)
 manifest_path=a.inputs_root/'evidence/appearance-mobilenet-inputs-frozen.json'
 m=json.loads(manifest_path.read_text());rows=m['rows'];arrays=[];families={};pixels={}
 for r in rows:
  for registry,key in [(families,r['family'].lower()),(pixels,r['pixelSha256'])]:
   if key in registry and registry[key]!=r['split']:raise ValueError('Split leakage')
   registry[key]=r['split']
  check_budget(started,time.monotonic(),600)
  p=a.inputs_root/r['input'];assert sha(p)==r['inputSha256']
  rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255
  tensor=np.ascontiguousarray(((rgb-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1))
  assert hashlib.sha256(tensor.tobytes()).hexdigest()==r['tensorSha256']
  arrays.append(tensor)
 original_count=len(rows)
 qroot=Path(__file__).resolve().parents[2]/'evidence/render-diagnostic-r016-corrected'
 qm=json.loads((qroot/'manifest.json').read_text())
 additions=[r for r in qm['rows'] if r['family'] in ['Superclarendon','TI-Nspire'] and r['renderer']=='pillow' and r['targetHeight']==24]
 additions=sorted(additions,key=lambda r:(r['expected']=='BOLD',r['id']))
 assert len(additions)==4 and sum(r['expected']=='BOLD' for r in additions)==2
 excluded={r['tensorSha256'] for r in additions}
 from coverage_slots import slots
 originals=[r for r in rows if r['split']=='train'];control_ids=slots(originals)
 original_byid={r['id']:(i,r) for i,r in enumerate(rows)}
 for j,r in enumerate(additions):
  check_budget(started,time.monotonic(),600)
  if a.arm=='treatment':
   tensor=np.load(qroot/(r['id']+'.npy'));assert hashlib.sha256(tensor.tobytes()).hexdigest()==r['tensorSha256']
   new=dict(id='added-'+r['id'],family=r['family'],expected=r['expected'],split='train',category='added',tensorSha256=r['tensorSha256'])
  else:
   index,source=original_byid[control_ids[j]];tensor=arrays[index];new={**source,'id':'duplicate-'+source['id']}
  arrays.append(tensor);rows.append(new)
  check_budget(started,time.monotonic(),600)
 # Both arms exclude the same exact treatment tensors from transfer evaluation.
 for r in rows[:original_count]:
  if r['split']=='challenge' and r['tensorSha256'] in excluded:r['split']='exposed-training-overlap'
 for r in qm['rows']:
  check_budget(started,time.monotonic(),600)
  if r['tensorSha256'] in excluded:continue
  tensor=np.load(qroot/(r['id']+'.npy'));assert hashlib.sha256(tensor.tobytes()).hexdigest()==r['tensorSha256']
  rows.append(dict(id='r016-'+r['id'],family=r['family'],expected=r['expected'],split='challenge',category='r016-transfer',tensorSha256=r['tensorSha256']));arrays.append(tensor)
 check_budget(started,time.monotonic(),600)
 assert sum(r['split']=='train' for r in rows)==1028
 assert sum(r['split']=='train' and r['expected']=='BOLD' for r in rows)==514
 assert not any(r['split']=='challenge' and r['tensorSha256'] in excluded for r in rows)
 assert sha(m['assets']['model'])==m['assets']['modelSha256']
 device='mps' if torch.backends.mps.is_available() else 'cpu'
 write(a.output/'protocol.json',{'experiment':'R-018','arm':a.arm,'controlIds':control_ids,'treatmentIds':[r['id'] for r in additions],'excludedTensorHashes':sorted(excluded),'queryManifestSha256':sha(qroot/'manifest.json'),'seed':seed,'device':device,'torch':torch.__version__,'timm':timm.__version__,'manifestSha256':sha(manifest_path),'checkpointSha256':m['assets']['modelSha256'],'codeSha256':sha(__file__),'epochs':12,'batchSize':32,'learningRate':.0001,'weightDecay':.01,'selection':'last epoch only','data':'exposed development only','maxSeconds':600})
 check_budget(started,time.monotonic(),600)
 model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False)
 model.load_state_dict(load_file(m['assets']['model']));model.reset_classifier(1);model.to(device)
 check_budget(started,time.monotonic(),600)
 x=torch.from_numpy(np.stack(arrays));labels=torch.tensor([r['expected']=='BOLD' for r in rows],dtype=torch.float32)
 train=[i for i,r in enumerate(rows) if r['split']=='train']
 loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[train],labels[train]),batch_size=32,shuffle=True,generator=torch.Generator().manual_seed(seed))
 optimizer=torch.optim.AdamW(model.parameters(),lr=.0001,weight_decay=.01);loss_fn=torch.nn.BCEWithLogitsLoss();losses=[]
 check_budget(started,time.monotonic(),600)
 for epoch in range(12):
  model.train();loss_sum=0
  for bx,by in loader:
   if time.monotonic()-started>600:
    write(a.output/'result.json',{'decision':'STOP','reason':'resource limit','epochs':epoch});return
   check_budget(started,time.monotonic(),600)
   optimizer.zero_grad();logits=model(bx.to(device)).flatten();loss=loss_fn(logits,by.to(device));loss.backward();optimizer.step();loss_sum+=loss.item()*len(bx)
   check_budget(started,time.monotonic(),600)
  losses.append(loss_sum/len(train));print(json.dumps({'epoch':epoch+1,'trainingLoss':losses[-1],'seconds':time.monotonic()-started}),flush=True)
 model.eval();scores=[]
 with torch.inference_mode():
  for i in range(0,len(x),32):
   check_budget(started,time.monotonic(),600)
   scores.extend(model(x[i:i+32].to(device)).flatten().sigmoid().cpu().tolist())
   check_budget(started,time.monotonic(),600)
 cal=[i for i,r in enumerate(rows) if r['split']=='calibration'];y=labels.int().tolist();cut=cutoff_for([scores[i] for i in cal],[y[i] for i in cal])
 summaries={}
 for category in ['calibration']+sorted({r['category'] for r in rows if r['split']=='challenge'}):
  indices=cal if category=='calibration' else [i for i,r in enumerate(rows) if r['split']=='challenge' and r['category']==category]
  summaries[category]=summarize([scores[i] for i in indices],[y[i] for i in indices],cut)
 output=[dict(id=r['id'],family=r['family'],split=r['split'],category=r['category'],expected=r['expected'],score=s,verdict='MATCH' if s>=cut else 'REVIEW') for r,s in zip(rows,scores)]
 byid={r['id']:r for r in output};invariants=[]
 for pair in m['bodyInvariants']:
  first,second=[byid[k] for k in pair['ids']];invariants.append(dict(ids=pair['ids'],same=abs(first['score']-second['score'])<1e-6 and first['verdict']==second['verdict']))
 check_budget(started,time.monotonic(),600)
 model.cpu();torch.save(model.state_dict(),a.output/'model.pt')
 result={'decision':'ADVANCE' if all(s['pass'] for s in summaries.values()) and all(v['same'] for v in invariants) else 'STOP','summaries':summaries,'cutoff':cut,'bodyInvariants':invariants,'trainingLosses':losses,'wallSeconds':time.monotonic()-started,'checkpointSha256':sha(a.output/'model.pt'),'rows':output,'limitations':['Exposed synthetic development only','No independent real-label qualification','No browser latency qualification']}
 check_budget(started,time.monotonic(),600)
 write(a.output/'result.json',result);print(json.dumps({k:result[k] for k in ['decision','summaries','cutoff','wallSeconds']},indent=2),flush=True)
if __name__=='__main__':
 try:main()
 except TimeoutError:
  output=Path(sys.argv[sys.argv.index('--output')+1])
  write(output/'result.json',{'decision':'STOP','reason':'resource limit'})
  print('STOP: resource limit',flush=True)
