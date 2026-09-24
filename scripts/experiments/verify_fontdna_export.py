"""Verify every retained evaluation score after ONNX export, before release."""
import argparse,hashlib,json,time
from pathlib import Path
import numpy as np,onnxruntime as ort
from PIL import Image
from fontdna_input import words

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,required=True);ap.add_argument('--candidate',type=Path,required=True);a=ap.parse_args();started=time.monotonic()
 source=json.loads((a.source/'result.json').read_text());candidate=json.loads((a.candidate/'result.json').read_text());assert sha(a.source/'result.json')==candidate['sourceResultSha256'];assert sha(a.source/'head.pt')==candidate['sourceHeadSha256'];assert sha(a.candidate/'model.onnx')==candidate['modelSha256'];assert sha(Path(__file__).with_name('fontdna_input.py'))==candidate['inputCodeSha256']
 metadata=json.loads((a.source/'inputs.json').read_text());assert len(metadata)==len(source['rows']);options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(a.candidate/'model.onnx'),options,providers=['CPUExecutionProvider']);errors=[];flips=[]
 for row,expected in zip(metadata,source['rows']):
  assert row['id']==expected['id'] and row['split']==expected['split']
  if row['split']=='train':continue
  assert sha(row['input'])==row['inputSha256'];inputs=words(np.asarray(Image.open(row['input']).convert('RGB')))
  batch=np.stack([np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0])) for x,c in inputs]);cols=np.asarray([c for x,c in inputs],dtype=np.int64)
  logits=session.run(['style'],{'img':batch,'cols':cols})[0][:,0];score=float(np.min(1/(1+np.exp(-np.clip(logits,-60,60)))));errors.append(abs(score-expected['score']))
  if (score>=candidate['cutoff'])!=(expected['score']>=candidate['cutoff']):flips.append(row['id'])
 result=dict(images=len(errors),maximumScoreError=max(errors),changedDecisions=flips,candidateSha256=candidate['modelSha256'],sourceResultSha256=candidate['sourceResultSha256'],codeSha256=sha(__file__),seconds=time.monotonic()-started)
 with (a.candidate/'export-parity.json').open('x') as f:json.dump(result,f,indent=2)
 print(json.dumps(result,indent=2));assert max(errors)<1e-4 and not flips
if __name__=='__main__':main()
