import argparse,hashlib,json,time
from pathlib import Path
import numpy as np
from PIL import Image
import torch,timm
from bn_refresh import refresh
from experiment_budget import check_budget
from finetune_contract import cutoff_for,summarize
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();args.output.mkdir(exist_ok=False,parents=True)
root=Path(__file__).resolve().parents[2];prior=root.parent/'treasury-label-review-mobilenet';started=time.monotonic()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mfile=prior/'evidence/appearance-mobilenet-inputs-frozen.json';m=json.loads(mfile.read_text());rows=m['rows'];arrays=[]
for r in rows:
 check_budget(started,time.monotonic(),600);p=prior/r['input'];assert sha(p)==r['inputSha256']
 a=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255;x=np.ascontiguousarray(((a-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1));assert hashlib.sha256(x.tobytes()).hexdigest()==r['tensorSha256'];arrays.append(x)
path=root.parent/'treasury-label-review-r012-artifacts/model.pt';assert sha(path)=='62044f837c91a6cd55d223a9f85f540cdac3fe1ceab9ddb1906761a750e2a831'
torch.set_num_threads(2);model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1);model.load_state_dict(torch.load(path,map_location='cpu',weights_only=True));model.eval()
def digest(items):
 h=hashlib.sha256()
 for name,value in items:h.update(name.encode());h.update(value.detach().numpy().tobytes())
 return h.hexdigest()
before=digest(model.named_parameters());buffers_before=digest(model.named_buffers());train=[i for i,r in enumerate(rows) if r['split']=='train'];assert len(train)==1024
protocol=dict(experiment='R-020',sourceCheckpointSha256=sha(path),manifestSha256=sha(mfile),codeSha256=sha(Path(__file__)),refreshCodeSha256=sha(Path(__file__).with_name('bn_refresh.py')),parameterSha256=before,bufferSha256Before=buffers_before,trainCount=len(train),batch=32,device='cpu',budgetSeconds=600)
(args.output/'protocol.json').write_text(json.dumps(protocol,indent=2)+'\n')
def batches():
 for j in range(0,len(train),32):
  check_budget(started,time.monotonic(),600)
  yield torch.from_numpy(np.stack([arrays[i] for i in train[j:j+32]]))
refresh(model,batches());assert before==digest(model.named_parameters());scores=[]
with torch.inference_mode():
 for j in range(0,len(rows),32):
  check_budget(started,time.monotonic(),600);scores.extend(model(torch.from_numpy(np.stack(arrays[j:j+32]))).flatten().sigmoid().tolist())
cal=[i for i,r in enumerate(rows) if r['split']=='calibration'];cut=cutoff_for([scores[i] for i in cal],[rows[i]['expected']=='BOLD' for i in cal]);summaries={}
for c in ['calibration']+sorted({r['category'] for r in rows if r['split']=='challenge'}):
 ix=cal if c=='calibration' else [i for i,r in enumerate(rows) if r['split']=='challenge' and r['category']==c]
 summaries[c]=summarize([scores[i] for i in ix],[rows[i]['expected']=='BOLD' for i in ix],cut)
output=[dict(id=r['id'],expected=r['expected'],split=r['split'],category=r['category'],score=s,verdict='MATCH' if s>=cut else 'REVIEW') for r,s in zip(rows,scores)];byid={r['id']:r for r in output};inv=[abs(byid[p['ids'][0]]['score']-byid[p['ids'][1]]['score'])<1e-6 for p in m['bodyInvariants']]
check_budget(started,time.monotonic(),600);torch.save(model.state_dict(),args.output/'model.pt');check_budget(started,time.monotonic(),600)
result=dict(decision='ADVANCE' if all(s['pass'] for s in summaries.values()) and all(inv) else 'STOP',summaries=summaries,cutoff=cut,bodyInvariants=inv,parametersUnchanged=before==digest(model.named_parameters()),buffersChanged=buffers_before!=digest(model.named_buffers()),wallSeconds=time.monotonic()-started,rows=output)
(args.output/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
