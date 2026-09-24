import json,hashlib,sys
from pathlib import Path
import numpy as np
from PIL import Image
import torch,timm
root=Path(__file__).resolve().parents[2]
inputs=root.parent/'treasury-label-review-mobilenet'
saved=json.loads((root/'evidence/appearance-finetune-development.json').read_text())
manifest=json.loads((inputs/'evidence/appearance-mobilenet-inputs-frozen.json').read_text())
ids=['Superclarendon-cap-9-regular','Georgia-cap-9-regular','TI-Nspire-4-bold','Arial-same-family-bold']
byid={r['id']:r for r in saved['rows']}; meta={r['id']:r for r in manifest['rows']}
assert all(i in byid for i in ids),[i for i in ids if i not in byid]
modelpath=root.parent/'treasury-label-review-r012-artifacts/model.pt'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(modelpath)==saved['checkpointSha256']
torch.set_num_threads(2)
model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1)
model.load_state_dict(torch.load(modelpath,map_location='cpu',weights_only=True));model.eval()
results=[]
for i in ids:
 r=meta[i];p=inputs/r['input'];assert sha(p)==r['inputSha256']
 rgb=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255
 x=np.ascontiguousarray(((rgb-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1))
 assert hashlib.sha256(x.tobytes()).hexdigest()==r['tensorSha256']
 with torch.inference_mode():s=model(torch.from_numpy(x).unsqueeze(0)).flatten().sigmoid().item()
 v='MATCH' if s>=saved['cutoff'] else 'REVIEW'
 results.append(dict(id=i,expected=r['expected'],savedScore=byid[i]['score'],cpuScore=s,verdict=v,sameVerdict=v==byid[i]['verdict'],inputAndTensorHashesVerified=True))
assert all(r['sameVerdict'] for r in results)
out=dict(checkpointSha256=sha(modelpath),cutoff=saved['cutoff'],rows=results,scope='Four exposed diagnostic examples, not independent accuracy evidence')
if '--write-evidence' in sys.argv:
 (root/'evidence/appearance-systematic-replay.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
