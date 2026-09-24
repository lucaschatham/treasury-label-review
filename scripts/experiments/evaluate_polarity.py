"""R-023 frozen-weight canonical polarity evaluation on exposed data only."""
import hashlib,json,time
from pathlib import Path
import numpy as np
from PIL import Image
import torch,timm
from polarity import canonical_pixels
from finetune_contract import cutoff_for,summarize
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 started=time.monotonic();torch.set_num_threads(2)
 output=ROOT.parent/'treasury-label-review-r023-polarity';output.mkdir(exist_ok=False)
 source=ROOT.parent/'treasury-label-review-r022-targeted';old=json.loads((source/'result.json').read_text());assert sha(source/'model.pt')==old['modelSha256']
 inputs=ROOT.parent/'treasury-label-review-mobilenet';manifest=inputs/'evidence/appearance-mobilenet-inputs-frozen.json';m=json.loads(manifest.read_text());rows=[r for r in m['rows'] if r['split']!='train'];tensors=[]
 for r in rows:
  p=inputs/r['input'];assert sha(p)==r['inputSha256']
  rgb=canonical_pixels(np.asarray(Image.open(p).convert('RGB'))).astype(np.float32)/255
  tensors.append(np.ascontiguousarray(((rgb-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1)))
 model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1);model.load_state_dict(torch.load(source/'model.pt',map_location='cpu',weights_only=True));model.eval();scores=[]
 with torch.inference_mode():
  for i in range(0,len(rows),32):scores.extend(model(torch.from_numpy(np.stack(tensors[i:i+32]))).flatten().sigmoid().tolist())
 cal=[i for i,r in enumerate(rows) if r['split']=='calibration'];labels=[int(r['expected']=='BOLD') for r in rows];cut=cutoff_for([scores[i] for i in cal],[labels[i] for i in cal]);summaries={}
 for category in ['calibration']+sorted({r['category'] for r in rows if r['split']=='challenge'}):
  ix=cal if category=='calibration' else [i for i,r in enumerate(rows) if r['category']==category and r['split']=='challenge']
  summaries[category]=summarize([scores[i] for i in ix],[labels[i] for i in ix],cut)
 resultrows=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(score=s,verdict='MATCH' if s>=cut else 'REVIEW') for r,s in zip(rows,scores)]
 byid={r['id']:r for r in resultrows};invariants=[dict(ids=p['ids'],same=abs(byid[p['ids'][0]]['score']-byid[p['ids'][1]]['score'])<1e-6) for p in m['bodyInvariants']]
 result=dict(decision='ADVANCE' if all(s['pass'] for s in summaries.values()) and all(r['same'] for r in invariants) else 'STOP',modelSha256=old['modelSha256'],sourceManifestSha256=sha(manifest),codeSha256=sha(__file__),polarityCodeSha256=sha(Path(__file__).parent/'polarity.py'),cutoff=cut,summaries=summaries,bodyInvariants=invariants,rows=resultrows,seconds=time.monotonic()-started)
 (output/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:result[k] for k in ['decision','cutoff','summaries','seconds']},indent=2))
if __name__=='__main__':main()
