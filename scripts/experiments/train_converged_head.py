"""R-036 identical broad corpus and update count, cosine decay only."""
import hashlib,json,time
from pathlib import Path
import numpy as np,torch,onnx
from onnx import numpy_helper
from manifest_links import verify
from learning_rate import rate
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 out=ROOT.parent/'treasury-label-review-r036';out.mkdir(exist_ok=False);started=time.monotonic();progress={'steps':0}
 with preserve_failure(out,'R-036',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923);cache=ROOT.parent/'treasury-label-review-r035';assert sha(cache/'inputs.json')=='ef32fea48feac68b084d6173d3edc303428197acb6b8909cdb5359e343324d69';assert sha(cache/'features.npy')=='b4014a427b24296235e816e52077a314108d804595a15d498dc9232aac996ca5';verify(ROOT.parent/'treasury-label-review-r035-assets')
  rows=json.loads((cache/'inputs.json').read_text());x=torch.from_numpy(np.load(cache/'features.npy'));original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)=='5f1feeb2f48346a08d0d7a0f26dbc4658347f6f5efe28fa21fb2200c361cc174';weights={t.name:numpy_helper.to_array(t).copy() for t in onnx.load(original).graph.initializer}
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  with torch.no_grad():
   for suffix in ['weight','bias']:
    getattr(head[0],suffix).copy_(torch.from_numpy(weights['m.head_style.0.'+suffix]));getattr(head[2],suffix).copy_(torch.from_numpy(weights['m.head_style.2.'+suffix][0:1]))
  labels=torch.tensor([float(r['expected']=='BOLD') for r in rows for _ in range(2)]);indices=[2*i+j for i,r in enumerate(rows) if r['split']=='train' for j in [0,1]];assert len(indices)==44288
  loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[indices],labels[indices]),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923));optimizer=torch.optim.AdamW(head.parameters(),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[]
  for epoch in range(50):
   total=0
   for bx,by in loader:
    check_budget(started,time.monotonic(),120)
    for group in optimizer.param_groups:group['lr']=rate(progress['steps'],17300)
    optimizer.zero_grad();loss=lossfn(head(bx).flatten(),by);loss.backward();optimizer.step();total+=loss.item()*len(bx);progress['steps']+=1
   losses.append(total/len(indices))
  assert progress['steps']==17300
  with torch.inference_mode():scores=head(x).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  output=[{k:r[k] for k in ['id','family','split','category','expected','trainedFamily','trainedPixel']}|dict(score=s) for r,s in zip(rows,scores)]
  try:margin=calibrate([r for r in output if r['split']!='train']);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  torch.save(head.state_dict(),out/'head.pt');(out/'inputs.json').write_bytes((cache/'inputs.json').read_bytes())
  result=dict(experiment='R-036',decision=decision,scope='Exposed development and trained-family regression, not independent qualification',headSha256=sha(out/'head.pt'),sourceSha256=sha(original),codeSha256=sha(__file__),sourceInputSha256=sha(cache/'inputs.json'),sourceFeatureSha256=sha(cache/'features.npy'),selectionSha256=sha(ROOT.parent/'treasury-label-review-r035-assets/selection.json'),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),seed=20260923,epochs=50,steps=progress['steps'],firstLearningRate=rate(0,17300),lastLearningRate=rate(17299,17300),wallSeconds=time.monotonic()-started,losses=losses,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k not in ['rows','losses']},indent=2))
if __name__=='__main__':main()
