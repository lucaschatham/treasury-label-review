"""R-032 variable-width versus padded-width contract diagnostic."""
import json,time
from pathlib import Path
import numpy as np,onnxruntime as ort
from PIL import Image
from adapt_fontdna import ROOT,sha
from fontdna_input import words

def main():
 out=ROOT.parent/'treasury-label-review-r032';out.mkdir(exist_ok=False);started=time.monotonic()
 candidate=ROOT.parent/'treasury-label-review-r027-frozen';c=json.loads((candidate/'result.json').read_text());assert sha(candidate/'model.onnx')==c['modelSha256'];assert sha(Path(__file__).with_name('fontdna_input.py'))==c['inputCodeSha256']
 options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(candidate/'model.onnx'),options,providers=['CPUExecutionProvider']);rows=[]
 for r in json.loads((ROOT.parent/'treasury-label-review-independent-qualification-2/manifest.json').read_text())['rows']:
  assert sha(r['input'])==r['inputSha256'];scores=[]
  for x,col in words(np.asarray(Image.open(r['input']).convert('RGB'))):
   padded=np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0]))
   a=float(session.run(['style'],{'img':x[None],'cols':np.asarray([col],dtype=np.int64)})[0][0,0]);b=float(session.run(['style'],{'img':padded[None],'cols':np.asarray([col],dtype=np.int64)})[0][0,0])
   scores.append(dict(width=x.shape[2],naturalLogit=a,paddedLogit=b,difference=a-b))
  natural=float(1/(1+np.exp(-min(s['naturalLogit'] for s in scores))));padded=float(1/(1+np.exp(-min(s['paddedLogit'] for s in scores))))
  rows.append(dict(id=r['id'],expected=r['expected'],words=scores,naturalScore=natural,paddedScore=padded,changedDecision=(natural>=c['cutoff'])!=(padded>=c['cutoff'])))
 result=dict(experiment='R-032',modelSha256=c['modelSha256'],codeSha256=sha(__file__),cutoff=c['cutoff'],maximumLogitDifference=max(abs(w['difference']) for r in rows for w in r['words']),changedDecisions=sum(r['changedDecision'] for r in rows),seconds=time.monotonic()-started,rows=rows)
 (out/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
if __name__=='__main__':main()
