"""R-033 fixed L2-to-pretrained-head intervention with unchanged training data."""
import json,time
from pathlib import Path
import numpy as np,torch,onnx
from onnx import numpy_helper
from adapt_fontdna import ROOT,sha
from anchored_head import penalty
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure

def main():
 out=ROOT.parent/'treasury-label-review-r033';out.mkdir(exist_ok=False);started=time.monotonic();progress={'steps':0}
 with preserve_failure(out,'R-033',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923);cache=ROOT.parent/'treasury-label-review-r028';rows=json.loads((cache/'inputs.json').read_text());x=torch.from_numpy(np.load(cache/'features.npy'))
  protocol=json.loads((ROOT.parent/'treasury-label-review-r026-corrected/protocol.json').read_text());assert protocol['inputCodeSha256']==sha(Path(__file__).with_name('fontdna_input.py'))
  original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)==protocol['sourceSha256'];weights={t.name:numpy_helper.to_array(t).copy() for t in onnx.load(original).graph.initializer}
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  with torch.no_grad():
   for suffix in ['weight','bias']:
    getattr(head[0],suffix).copy_(torch.from_numpy(weights['m.head_style.0.'+suffix]));getattr(head[2],suffix).copy_(torch.from_numpy(weights['m.head_style.2.'+suffix][0:1]))
  reference={k:p.detach().clone() for k,p in head.named_parameters()}
  labels=torch.tensor([float(r['expected']=='BOLD') for r in rows for _ in range(2)]);indices=[2*i+j for i,r in enumerate(rows) if r['split']=='train' for j in [0,1]];assert len(indices)==8576
  loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[indices],labels[indices]),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923))
  optimizer=torch.optim.AdamW(head.parameters(),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[]
  for epoch in range(50):
   total=0
   for bx,by in loader:
    check_budget(started,time.monotonic(),120);optimizer.zero_grad();loss=lossfn(head(bx).flatten(),by)+.001*penalty(head,reference);loss.backward();optimizer.step();total+=loss.item()*len(bx);progress['steps']+=1
   losses.append(total/len(indices))
  assert progress['steps']==3350
  with torch.inference_mode():scores=head(x).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  output=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(score=s) for r,s in zip(rows,scores)]
  try:margin=calibrate([r for r in output if r['split']!='train']);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  torch.save(head.state_dict(),out/'head.pt')
  result=dict(experiment='R-033',decision=decision,headSha256=sha(out/'head.pt'),sourceSha256=sha(original),codeSha256=sha(__file__),featureCacheSha256=sha(cache/'features.npy'),anchorCoefficient=.001,finalSquaredDrift=penalty(head,reference).item(),epochs=50,seed=20260923,steps=progress['steps'],wallSeconds=time.monotonic()-started,losses=losses,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k not in ['rows','losses']},indent=2))
if __name__=='__main__':main()
