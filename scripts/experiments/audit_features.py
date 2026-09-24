import argparse,hashlib,json,sys
from pathlib import Path
import torch,timm,numpy as np
from PIL import Image,ImageDraw
from feature_neighbors import rank
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True,help='Fresh output directory; existing paths are refused');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];prior=root.parent/'treasury-label-review-mobilenet';out=args.output;out.mkdir(parents=True,exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mp=prior/'evidence/appearance-mobilenet-inputs-frozen.json';m=json.loads(mp.read_text());qp=root/'evidence/render-diagnostic-r016-corrected/manifest.json';queries=[r for r in json.loads(qp.read_text())['rows'] if r['family'] in ['Arial','Superclarendon']];gallery=[r for r in m['rows'] if r['split']=='train']
modelpath=root.parent/'treasury-label-review-r012-artifacts/model.pt';assert sha(modelpath)=='62044f837c91a6cd55d223a9f85f540cdac3fe1ceab9ddb1906761a750e2a831'
torch.set_num_threads(2);model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1);model.load_state_dict(torch.load(modelpath,map_location='cpu',weights_only=True));model.eval();captured=[]
handle=model.classifier.register_forward_pre_hook(lambda mod,args:captured.append(args[0].detach().cpu().numpy()))
arrays=[]
for r in gallery:
 p=prior/r['input'];assert sha(p)==r['inputSha256'];a=np.asarray(Image.open(p).convert('RGB'),dtype=np.float32)/255
 x=np.ascontiguousarray(((a-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)).transpose(2,0,1));assert hashlib.sha256(x.tobytes()).hexdigest()==r['tensorSha256'];arrays.append(x)
for r in queries:
 x=np.load(qp.parent/(r['id']+'.npy'));assert hashlib.sha256(x.tobytes()).hexdigest()==r['tensorSha256'];arrays.append(x)
scores=[]
with torch.inference_mode():
 for i in range(0,len(arrays),32):scores.extend(model(torch.from_numpy(np.stack(arrays[i:i+32]))).flatten().sigmoid().tolist())
handle.remove();features=np.concatenate(captured);assert len(features)==len(arrays)
results=[];byid={r['id']:r for r in gallery}
for j,q in enumerate(queries):
 neighbors={}
 for label in ['REGULAR','BOLD']:
  candidates=[dict(id=r['id'],tensor=r['tensorSha256'],vector=features[i]) for i,r in enumerate(gallery) if r['expected']==label]
  neighbors[label]=rank(features[len(gallery)+j],candidates)[:5]
 results.append(dict(id=q['id'],expected=q['expected'],score=scores[len(gallery)+j],neighbors=neighbors,nearestClass=min(neighbors,key=lambda k:neighbors[k][0]['distance'])))
 sheet=Image.new('RGB',(6*224,2*250),'white');d=ImageDraw.Draw(sheet)
 for y,label in enumerate(['REGULAR','BOLD']):
  sheet.paste(Image.open(qp.parent/(q['id']+'.png')),(0,y*250));d.text((0,y*250+224),q['id'],fill='black')
  for k,n in enumerate(neighbors[label],1):
   sheet.paste(Image.open(prior/byid[n['id']]['input']),(k*224,y*250));d.text((k*224,y*250+224),n['id'],fill='black')
 sheet.save(out/(q['id']+'.png'))
np.save(out/'features.npy',features)
(out/'results.json').write_text(json.dumps(dict(modelSha256=sha(modelpath),inputManifestSha256=sha(mp),queryManifestSha256=sha(qp),codeSha256=sha(Path(__file__)),featuresSha256=sha(out/'features.npy'),layer='classifier input in eval mode',gallery=len(gallery),queries=results),indent=2)+'\n')
for r in results:print(r['id'],r['nearestClass'],{k:round(v[0]['distance'],5) for k,v in r['neighbors'].items()})
