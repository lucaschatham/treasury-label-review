"""R-028: fixed pretrained nonlinear representation, final projection only."""
import json,time
from pathlib import Path
import numpy as np,torch,onnx,onnxruntime as ort
from onnx import numpy_helper
from PIL import Image
from adapt_fontdna import ROOT,sha
from fontdna_input import words
from constrained_head import constrain
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure

def main():
 out=ROOT.parent/'treasury-label-review-r028';out.mkdir(exist_ok=False);started=time.monotonic();progress={'steps':0}
 with preserve_failure(out,'R-028',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923);np.random.seed(20260923)
  cache=ROOT.parent/'treasury-label-review-r026-corrected'
  protocol=json.loads((cache/'protocol.json').read_text());assert protocol['inputCodeSha256']==sha(Path(__file__).with_name('fontdna_input.py'))
  rows=json.loads((cache/'inputs.json').read_text());features=np.load(cache/'features.npy');assert features.shape==(len(rows)*2,320)
  added=json.loads((ROOT.parent/'treasury-label-review-independent-qualification-2/manifest.json').read_text())['rows']
  options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(cache/'features.onnx'),options,providers=['CPUExecutionProvider']);extra=[]
  for row in added:
   assert sha(row['input'])==row['inputSha256'];batch=words(np.asarray(Image.open(row['input']).convert('RGB')))
   images=np.stack([np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0])) for x,c in batch])
   extra.extend(session.run(['/m/If_1_output_0'],{'img':images,'cols':np.asarray([c for x,c in batch],dtype=np.int64)})[0])
  # Keep each independent round a separate cohort so one cannot hide the other.
  rows=[dict(r,category='qualification-1') if r['category']=='independent-family' else r for r in rows]
  rows += [dict(r,category='qualification-2') for r in added]
  x=torch.from_numpy(np.concatenate([features,np.asarray(extra)]));np.save(out/'features.npy',x.numpy());(out/'inputs.json').write_text(json.dumps(rows,indent=2))
  original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)==protocol['sourceSha256'];weights={t.name:numpy_helper.to_array(t).copy() for t in onnx.load(original).graph.initializer}
  head=constrain(torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1)))
  with torch.no_grad():
   for suffix in ['weight','bias']:
    getattr(head[0],suffix).copy_(torch.from_numpy(weights['m.head_style.0.'+suffix]))
    getattr(head[2],suffix).copy_(torch.from_numpy(weights['m.head_style.2.'+suffix][0:1]))
  frozen={k:v.clone() for k,v in head[0].state_dict().items()}
  labels=torch.tensor([float(r['expected']=='BOLD') for r in rows for _ in range(2)])
  indices=[2*i+j for i,r in enumerate(rows) if r['split']=='train' for j in [0,1]];assert len(indices)==8576
  loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[indices],labels[indices]),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923))
  optimizer=torch.optim.AdamW((p for p in head.parameters() if p.requires_grad),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[]
  for epoch in range(50):
   total=0
   for bx,by in loader:
    check_budget(started,time.monotonic(),600);optimizer.zero_grad();loss=lossfn(head(bx).flatten(),by);loss.backward();optimizer.step();total+=loss.item()*len(bx);progress['steps']+=1
   losses.append(total/len(indices))
  assert all(torch.equal(v,head[0].state_dict()[k]) for k,v in frozen.items())
  with torch.inference_mode():scores=head(x).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  output=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(score=s) for r,s in zip(rows,scores)]
  try:margin=calibrate([r for r in output if r['split']!='train']);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  torch.save(head.state_dict(),out/'head.pt')
  result=dict(experiment='R-028',decision=decision,headSha256=sha(out/'head.pt'),sourceSha256=sha(original),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),codeSha256=sha(__file__),featureCacheSha256=sha(cache/'features.npy'),epochs=50,seed=20260923,losses=losses,wallSeconds=time.monotonic()-started,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k not in ['rows','losses']},indent=2))
if __name__=='__main__':main()
