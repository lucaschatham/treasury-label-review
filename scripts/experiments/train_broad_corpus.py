"""R-035 broad source-weight corpus; fixed final head, no model selection."""
import hashlib,json,time
from pathlib import Path
import numpy as np,torch,onnx,onnxruntime as ort
from onnx import numpy_helper
from PIL import Image
from fontdna_input import words
from regression_roles import annotate
from family_coverage import validate_pixels
from corpus_selection import related
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 out=ROOT.parent/'treasury-label-review-r035';out.mkdir(exist_ok=False);started=time.monotonic();progress={'images':0,'steps':0}
 with preserve_failure(out,'R-035',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923)
  cache=ROOT.parent/'treasury-label-review-r034';assert sha(cache/'inputs.json')=='b6cbeffda874901ed049184390ff9da7f5d4de9d209976efea3c59c6a30f2d53';assert sha(cache/'features.npy')=='6fe3fef51b1a0afabfe557f7a4cd581752b2c67eb99c7b2e2b74c5c57b2c3779'
  rows=json.loads((cache/'inputs.json').read_text());features=np.load(cache/'features.npy')
  assets=ROOT.parent/'treasury-label-review-r035-assets';manifest=json.loads((assets/'manifest.json').read_text());selection=json.loads((assets/'selection.json').read_text());assert manifest['selectionSha256']==sha(assets/'selection.json');extra=manifest['rows'];assert len(extra)==16896
  train=[r for r in rows if r['split']=='train']+extra;assert len(train)==22208;validate_pixels(train)
  assert not any(related(r['family'],family['family']) for r in train for family in selection['reserved'])
  graph=ROOT.parent/'treasury-label-review-r026-corrected/features.onnx';assert sha(graph)=='95f898f602b2720a10569637283571103b92dd8907de8b66e6ac8ad7c8bf89ef';assert sha(Path(__file__).with_name('fontdna_input.py'))=='52515cf65c3cbed81aadb48e2ac49f8127d62a857957e70a606cba08538ccdf7'
  options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(graph),options,providers=['CPUExecutionProvider']);new=[];batch=[];cols=[]
  def flush():
   if batch:
    new.extend(session.run(['/m/If_1_output_0'],{'img':np.stack(batch),'cols':np.asarray(cols,dtype=np.int64)})[0]);batch.clear();cols.clear()
  for i,r in enumerate(extra):
   check_budget(started,time.monotonic(),1200);assert sha(r['input'])==r['inputSha256']
   for x,c in words(np.asarray(Image.open(r['input']).convert('RGB'))):batch.append(np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0])));cols.append(c)
   if len(batch)>=32:flush()
   progress['images']=i+1
   if (i+1)%1000==0:print('features',i+1,'/',len(extra),round(time.monotonic()-started,1),'seconds',flush=True)
  flush();new=np.asarray(new);assert new.shape==(len(extra)*2,320)
  # Exact third-set pixels are now supervised examples; preserve them as regression.
  third=json.loads((ROOT.parent/'treasury-label-review-independent-qualification-3/manifest.json').read_text())['rows'];by_pixel={r['pixelSha256']:i for i,r in enumerate(extra)};third_features=[]
  for r in third:
   assert sha(r['input'])==r['inputSha256'];i=by_pixel[r['pixelSha256']];assert extra[i]['expected']==r['expected'];third_features.extend(new[i*2:i*2+2])
  third=[dict(r,category='trained-regression-3') for r in third];x=torch.from_numpy(np.concatenate([features,new,np.asarray(third_features)]));rows=annotate(rows+extra+third,train)
  np.save(out/'features.npy',x.numpy());(out/'inputs.json').write_text(json.dumps(rows,indent=2));extraction=time.monotonic()-started
  original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)=='5f1feeb2f48346a08d0d7a0f26dbc4658347f6f5efe28fa21fb2200c361cc174';weights={t.name:numpy_helper.to_array(t).copy() for t in onnx.load(original).graph.initializer}
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  with torch.no_grad():
   for suffix in ['weight','bias']:
    getattr(head[0],suffix).copy_(torch.from_numpy(weights['m.head_style.0.'+suffix]));getattr(head[2],suffix).copy_(torch.from_numpy(weights['m.head_style.2.'+suffix][0:1]))
  labels=torch.tensor([float(r['expected']=='BOLD') for r in rows for _ in range(2)]);indices=[2*i+j for i,r in enumerate(rows) if r['split']=='train' for j in [0,1]];assert len(indices)==44416
  loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[indices],labels[indices]),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923));optimizer=torch.optim.AdamW(head.parameters(),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[];training=time.monotonic()
  for epoch in range(50):
   total=0
   for bx,by in loader:
    check_budget(training,time.monotonic(),300);optimizer.zero_grad();loss=lossfn(head(bx).flatten(),by);loss.backward();optimizer.step();total+=loss.item()*len(bx);progress['steps']+=1
   losses.append(total/len(indices))
   if (epoch+1)%10==0:print('epoch',epoch+1,'loss',losses[-1],flush=True)
  with torch.inference_mode():scores=head(x).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  output=[{k:r[k] for k in ['id','family','split','category','expected','trainedFamily','trainedPixel']}|dict(score=s) for r,s in zip(rows,scores)]
  try:margin=calibrate([r for r in output if r['split']!='train']);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  torch.save(head.state_dict(),out/'head.pt');result=dict(experiment='R-035',decision=decision,scope='Exposed development and trained-family regression, not independent qualification',headSha256=sha(out/'head.pt'),sourceSha256=sha(original),codeSha256=sha(__file__),sourceInputSha256=sha(cache/'inputs.json'),sourceFeatureSha256=sha(cache/'features.npy'),extraManifestSha256=sha(assets/'manifest.json'),selectionSha256=sha(assets/'selection.json'),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),seed=20260923,epochs=50,steps=progress['steps'],trainingImages=len(train),extractionSeconds=extraction,wallSeconds=time.monotonic()-started,losses=losses,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k not in ['rows','losses']},indent=2))
if __name__=='__main__':main()
