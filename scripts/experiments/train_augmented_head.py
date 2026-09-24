"""R-031: matched-update head adaptation with fixed nine-phase augmentation."""
import json,time
from pathlib import Path
import numpy as np,torch,onnx,onnxruntime as ort
from onnx import numpy_helper
from PIL import Image
from adapt_fontdna import ROOT,sha
from fontdna_input import words
from spatial_views import views
from augmented_features import select
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure

def main():
 out=ROOT.parent/'treasury-label-review-r031';out.mkdir(exist_ok=False);started=time.monotonic();progress={'images':0,'steps':0}
 with preserve_failure(out,'R-031',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923);np.random.seed(20260923)
  cache=ROOT.parent/'treasury-label-review-r028';rows=json.loads((cache/'inputs.json').read_text());single=torch.from_numpy(np.load(cache/'features.npy'))
  source=ROOT.parent/'treasury-label-review-r026-corrected';p=json.loads((source/'protocol.json').read_text());assert p['inputCodeSha256']==sha(Path(__file__).with_name('fontdna_input.py'))
  train=[r for r in rows if r['split']=='train'];assert len(train)==4288
  options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(source/'features.onnx'),options,providers=['CPUExecutionProvider'])
  augmented=[]
  for i,row in enumerate(train):
   check_budget(started,time.monotonic(),900);assert sha(row['input'])==row['inputSha256'];batch=[];cols=[]
   for x,c in words(np.asarray(Image.open(row['input']).convert('RGB'))):
    for view in views(x):batch.append(np.pad(view,((0,0),(0,0),(0,320-view.shape[2])),constant_values=float(x[0,0,0])));cols.append(c)
   output=session.run(['/m/If_1_output_0'],{'img':np.stack(batch),'cols':np.asarray(cols,dtype=np.int64)})[0]
   augmented.extend(output.reshape(2,9,320));progress['images']=i+1
   if (i+1)%300==0:print('features',i+1,'/',len(train),'seconds',round(time.monotonic()-started,1),flush=True)
  x=torch.from_numpy(np.asarray(augmented));np.save(out/'features.npy',x.numpy());(out/'inputs.json').write_text(json.dumps(train,indent=2));extraction=time.monotonic()-started
  original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)==p['sourceSha256'];weights={t.name:numpy_helper.to_array(t).copy() for t in onnx.load(original).graph.initializer}
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  with torch.no_grad():
   for suffix in ['weight','bias']:
    getattr(head[0],suffix).copy_(torch.from_numpy(weights['m.head_style.0.'+suffix]));getattr(head[2],suffix).copy_(torch.from_numpy(weights['m.head_style.2.'+suffix][0:1]))
  labels=torch.tensor([float(r['expected']=='BOLD') for r in train for _ in range(2)])
  loader=torch.utils.data.DataLoader(torch.arange(len(labels)),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923));rng=torch.Generator().manual_seed(20260923)
  optimizer=torch.optim.AdamW(head.parameters(),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[];trainstarted=time.monotonic()
  for epoch in range(50):
   total=0
   for indices in loader:
    check_budget(trainstarted,time.monotonic(),600);view=torch.randint(9,(len(indices),),generator=rng);bx=select(x,indices,view)
    optimizer.zero_grad();loss=lossfn(head(bx).flatten(),labels[indices]);loss.backward();optimizer.step();total+=loss.item()*len(indices);progress['steps']+=1
   losses.append(total/len(labels))
  assert progress['steps']==3350
  with torch.inference_mode():scores=head(single).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  output=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(score=s) for r,s in zip(rows,scores)]
  try:margin=calibrate([r for r in output if r['split']!='train']);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  torch.save(head.state_dict(),out/'head.pt')
  result=dict(experiment='R-031',decision=decision,headSha256=sha(out/'head.pt'),sourceSha256=sha(original),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),viewsCodeSha256=sha(Path(__file__).with_name('spatial_views.py')),codeSha256=sha(__file__),epochs=50,seed=20260923,steps=progress['steps'],extractionSeconds=extraction,wallSeconds=time.monotonic()-started,losses=losses,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k not in ['rows','losses']},indent=2))
if __name__=='__main__':main()
