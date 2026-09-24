"""One-shot frozen-cutoff independent-family evaluation; never recalibrates."""
import argparse,hashlib,json,time
from pathlib import Path
import torch,timm
from train_family_coverage import Inputs
from finetune_contract import summarize
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--candidate',type=Path,required=True);a=ap.parse_args()
 root=ROOT.parent/'treasury-label-review-independent-qualification';output=root/'result.json'
 if output.exists():raise ValueError('Qualification already evaluated; preserve prior result')
 manifest=root/'manifest.json';m=json.loads(manifest.read_text());candidate=json.loads((a.candidate/'result.json').read_text())
 assert candidate['decision']=='ADVANCE' and candidate['modelSha256']==m['candidateSha256']==sha(a.candidate/'model.pt')
 assert candidate['canonicalPolarity']==m['canonicalPolarity']
 assert sha(Path(__file__).with_name('polarity.py'))==m['polarityCodeSha256']
 assert candidate['cutoff']==m['cutoff'];rows=m['rows'];assert len(rows)==80 and all(r['split']=='qualification' for r in rows)
 for r in rows:assert sha(r['input'])==r['inputSha256']
 torch.set_num_threads(2);started=time.monotonic()
 model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1);model.load_state_dict(torch.load(a.candidate/'model.pt',map_location='cpu',weights_only=True));model.eval();scores=[]
 with torch.inference_mode():
  for bx,_ in torch.utils.data.DataLoader(Inputs(rows,canonical=m['canonicalPolarity']),batch_size=16):scores.extend(model(bx).flatten().sigmoid().tolist())
 summary=summarize(scores,[int(r['expected']=='BOLD') for r in rows],m['cutoff'])
 result=dict(decision='PASS' if summary['pass'] else 'STOP',summary=summary,cutoff=m['cutoff'],candidateSha256=m['candidateSha256'],manifestSha256=sha(manifest),codeSha256=sha(__file__),seconds=time.monotonic()-started,rows=[dict(id=r['id'],family=r['family'],expected=r['expected'],score=s,verdict='MATCH' if s>=m['cutoff'] else 'REVIEW') for r,s in zip(rows,scores)],scope='Independent synthetic font families; not all real-world image conditions')
 with output.open('x') as f:json.dump(result,f,indent=2,allow_nan=False)
 print(json.dumps({k:result[k] for k in ['decision','summary','seconds']},indent=2))
if __name__=='__main__':main()
