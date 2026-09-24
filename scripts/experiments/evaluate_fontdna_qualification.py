"""One-shot evaluation of a frozen adapted FontDNA candidate."""
import argparse,hashlib,json,time
from pathlib import Path
import numpy as np
from PIL import Image
import onnxruntime as ort
from fontdna_input import words
from finetune_contract import summarize
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--candidate',type=Path,required=True);a=ap.parse_args()
 root=ROOT.parent/'treasury-label-review-independent-qualification-2';output=root/'result.json'
 if output.exists():raise ValueError('Qualification already evaluated')
 m=json.loads((root/'manifest.json').read_text());candidate=json.loads((a.candidate/'result.json').read_text())
 assert candidate['decision']=='ADVANCE' and m['modelFile']=='model.onnx'
 assert m['candidateSha256']==candidate['modelSha256']==sha(a.candidate/'model.onnx')
 assert m['cutoff']==candidate['cutoff'] and m['canonicalPolarity'] is True
 for field,file in [('inputCodeSha256','fontdna_input.py'),('polarityCodeSha256','polarity.py')]:assert m[field]==candidate[field]==sha(Path(__file__).with_name(file))
 rows=m['rows'];assert len(rows)==80 and all(r['split']=='qualification' for r in rows)
 started=time.monotonic();options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(a.candidate/'model.onnx'),options,providers=['CPUExecutionProvider']);scores=[]
 for row in rows:
  assert sha(row['input'])==row['inputSha256']
  inputs=words(np.asarray(Image.open(row['input']).convert('RGB')))
  batch=np.stack([np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0])) for x,c in inputs])
  style=session.run(['style'],{'img':batch,'cols':np.array([c for x,c in inputs],dtype=np.int64)})[0]
  scores.append(float(np.min(1/(1+np.exp(-np.clip(style[:,0],-60,60))))))
 summary=summarize(scores,[int(r['expected']=='BOLD') for r in rows],m['cutoff'])
 result=dict(decision='PASS' if summary['pass'] else 'STOP',summary=summary,cutoff=m['cutoff'],candidateSha256=m['candidateSha256'],manifestSha256=sha(root/'manifest.json'),codeSha256=sha(__file__),seconds=time.monotonic()-started,rows=[dict(id=r['id'],family=r['family'],expected=r['expected'],score=s,verdict='MATCH' if s>=m['cutoff'] else 'REVIEW') for r,s in zip(rows,scores)],scope='Independent rendered images and supervised-head families; foundation pretraining corpus undisclosed')
 with output.open('x') as f:json.dump(result,f,indent=2,allow_nan=False)
 print(json.dumps({k:result[k] for k in ['decision','summary','seconds']},indent=2))
if __name__=='__main__':main()
