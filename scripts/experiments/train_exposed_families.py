"""R-034 balanced counterexample-family training; all earlier evaluations retained."""
import json,time
from pathlib import Path
import numpy as np,torch,onnx,onnxruntime as ort
from onnx import numpy_helper
from PIL import Image
from adapt_fontdna import ROOT,sha
from fontdna_input import words
from regression_roles import annotate
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure

def main():
 out=ROOT.parent/'treasury-label-review-r034';out.mkdir(exist_ok=False);started=time.monotonic();progress={'images':0,'steps':0}
 with preserve_failure(out,'R-034',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923)
  cache=ROOT.parent/'treasury-label-review-r028';assert sha(cache/'inputs.json')=='a16b99d506b0cbddd1f1be45e16f1d963519087f2bd3ad6f712e9140cd29ee48';assert sha(cache/'features.npy')=='71024e92aced6fd0a7a932d02fd893f11b7c19a233cf32fb9e51f488501ccf66'
  rows=json.loads((cache/'inputs.json').read_text());features=np.load(cache/'features.npy')
  assets=ROOT.parent/'treasury-label-review-r034-assets-verified/manifest.json';extra=json.loads(assets.read_text())['rows'];assert len(extra)==1024
  source=ROOT.parent/'treasury-label-review-r026-corrected';protocol=json.loads((source/'protocol.json').read_text());assert protocol['inputCodeSha256']==sha(Path(__file__).with_name('fontdna_input.py'))
  options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(source/'features.onnx'),options,providers=['CPUExecutionProvider']);new=[]
  for i,r in enumerate(extra):
   check_budget(started,time.monotonic(),300);assert sha(r['input'])==r['inputSha256'];inputs=words(np.asarray(Image.open(r['input']).convert('RGB')))
   batch=np.stack([np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0])) for x,c in inputs]);cols=np.asarray([c for x,c in inputs],dtype=np.int64)
   new.extend(session.run(['/m/If_1_output_0'],{'img':batch,'cols':cols})[0]);progress['images']=i+1
  x=torch.from_numpy(np.concatenate([features,np.asarray(new)]));rows+=extra;train=[r for r in rows if r['split']=='train'];assert len(train)==5312
  annotations={id(r):a for r,a in zip(rows,annotate(rows,train))};rows=[annotations[id(r)] for r in rows]
  for r in rows:
   if r['category'].startswith('qualification-'):r['category']='trained-regression-'+r['category'].split('-')[-1]
  np.save(out/'features.npy',x.numpy());(out/'inputs.json').write_text(json.dumps(rows,indent=2));extraction=time.monotonic()-started
  original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)==protocol['sourceSha256'];weights={t.name:numpy_helper.to_array(t).copy() for t in onnx.load(original).graph.initializer}
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  with torch.no_grad():
   for suffix in ['weight','bias']:
    getattr(head[0],suffix).copy_(torch.from_numpy(weights['m.head_style.0.'+suffix]));getattr(head[2],suffix).copy_(torch.from_numpy(weights['m.head_style.2.'+suffix][0:1]))
  labels=torch.tensor([float(r['expected']=='BOLD') for r in rows for _ in range(2)]);indices=[2*i+j for i,r in enumerate(rows) if r['split']=='train' for j in [0,1]]
  loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[indices],labels[indices]),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923));optimizer=torch.optim.AdamW(head.parameters(),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[];training=time.monotonic()
  while progress['steps']<3350:
   total=0;count=0
   for bx,by in loader:
    check_budget(training,time.monotonic(),120);optimizer.zero_grad();loss=lossfn(head(bx).flatten(),by);loss.backward();optimizer.step();total+=loss.item()*len(bx);count+=len(bx);progress['steps']+=1
    if progress['steps']==3350:break
   losses.append(total/count)
  with torch.inference_mode():scores=head(x).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  output=[{k:r[k] for k in ['id','family','split','category','expected','trainedFamily','trainedPixel']}|dict(score=s) for r,s in zip(rows,scores)]
  try:margin=calibrate([r for r in output if r['split']!='train']);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  torch.save(head.state_dict(),out/'head.pt');result=dict(experiment='R-034',decision=decision,scope='Exposed development and trained-family regression, not independent qualification',headSha256=sha(out/'head.pt'),sourceSha256=sha(original),codeSha256=sha(__file__),sourceInputSha256=sha(cache/'inputs.json'),sourceFeatureSha256=sha(cache/'features.npy'),extraManifestSha256=sha(assets),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),seed=20260923,steps=3350,extractionSeconds=extraction,wallSeconds=time.monotonic()-started,losses=losses,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k not in ['rows','losses']},indent=2))
if __name__=='__main__':main()
