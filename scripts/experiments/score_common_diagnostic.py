"""One frozen CPU inference pass over the validated R-016 inputs."""
import hashlib,json
from pathlib import Path
import numpy as np
import torch,timm
from render_controls import write_new
root=Path(__file__).resolve().parents[2];out=root/'evidence/render-diagnostic-r016-corrected'
assert not (out/'scores.json').exists()
p=out/'manifest.json';manifest=json.loads(p.read_text());assert len(manifest['rows'])==32
modelpath=root.parent/'treasury-label-review-r012-artifacts/model.pt'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(modelpath)=='62044f837c91a6cd55d223a9f85f540cdac3fe1ceab9ddb1906761a750e2a831'
torch.set_num_threads(2);model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1);model.load_state_dict(torch.load(modelpath,map_location='cpu',weights_only=True));model.eval();rows=[]
for r in manifest['rows']:
 x=np.load(out/(r['id']+'.npy'));assert hashlib.sha256(x.tobytes()).hexdigest()==r['tensorSha256']
 with torch.inference_mode():score=model(torch.from_numpy(x).unsqueeze(0)).flatten().sigmoid().item()
 rows.append({**r,'score':score,'verdict':'MATCH' if score>=0.5397067666053773 else 'REVIEW'})
write_new(out/'scores.json',json.dumps(dict(manifestSha256=sha(p),modelSha256=sha(modelpath),cutoff=.5397067666053773,rows=rows),indent=2)+'\n')
for r in rows:print(r['id'],r['height'],round(r['score'],6),r['verdict'])
