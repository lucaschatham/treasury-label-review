"""R-029 fixed-model nine-phase logit pooling on exposed development."""
import json,time
from pathlib import Path
import numpy as np,onnxruntime as ort
from PIL import Image
from adapt_fontdna import ROOT,sha
from fontdna_input import words
from spatial_views import views
from cohort_margin import calibrate
from experiment_budget import check_budget
from experiment_failure import preserve_failure

def main():
 out=ROOT.parent/'treasury-label-review-r029';out.mkdir(exist_ok=False);started=time.monotonic();progress={'images':0}
 with preserve_failure(out,'R-029',started,progress,time.monotonic):
  rows=[r for r in json.loads((ROOT.parent/'treasury-label-review-r028/inputs.json').read_text()) if r['split']!='train']
  candidate=ROOT.parent/'treasury-label-review-r027-frozen';frozen=json.loads((candidate/'result.json').read_text());assert sha(candidate/'model.onnx')==frozen['modelSha256'];assert sha(Path(__file__).with_name('fontdna_input.py'))==frozen['inputCodeSha256']
  options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(candidate/'model.onnx'),options,providers=['CPUExecutionProvider']);output=[]
  for row in rows:
   check_budget(started,time.monotonic(),600);assert sha(row['input'])==row['inputSha256'];inputs=words(np.asarray(Image.open(row['input']).convert('RGB')))
   batch=[];cols=[]
   for x,c in inputs:
    for view in views(x):batch.append(np.pad(view,((0,0),(0,0),(0,320-view.shape[2])),constant_values=float(x[0,0,0])));cols.append(c)
   logits=session.run(['style'],{'img':np.stack(batch),'cols':np.asarray(cols,dtype=np.int64)})[0][:,0].reshape(2,9)
   score=float(np.min(1/(1+np.exp(-np.clip(logits.mean(axis=1),-60,60)))))
   output.append({k:row[k] for k in ['id','family','split','category','expected']}|dict(score=score,wordLogits=logits.tolist()));progress['images']+=1
  try:margin=calibrate(output);decision='ADVANCE'
  except ValueError:margin={};decision='STOP'
  result=dict(experiment='R-029',decision=decision,modelSha256=frozen['modelSha256'],codeSha256=sha(__file__),viewsCodeSha256=sha(Path(__file__).with_name('spatial_views.py')),inputCodeSha256=frozen['inputCodeSha256'],seconds=time.monotonic()-started,rows=output,**margin)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
if __name__=='__main__':main()
