"""R-015 preparation only. No inference. Refuses existing output."""
import sys,json,hashlib,subprocess,io
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from fontTools.ttLib import TTFont
from render_controls import validate_pair,validate_matrix,write_new
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT.parent/'treasury-label-review-mobilenet/scripts/experiments'))
from heading_classifier import prepare_words
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
out=ROOT/'evidence/render-diagnostic-v2';out.mkdir(exist_ok=False)
source=ROOT.parent/'treasury-label-review/evidence/appearance-stroke-inputs-frozen.json'
rows=json.loads(source.read_text())['rows'];families=['Arial','Georgia','Superclarendon','TI-Nspire'];result=[]
def render(path,size,word,renderer):
 if renderer=='pillow':
  im=Image.new('RGB',(1200,160),'white');ImageDraw.Draw(im).text((20,100),word,font=ImageFont.truetype(str(path),size),anchor='ls',fill='black');return im
 data=subprocess.check_output(['magick','-size','1200x160','xc:white','-fill','black','-font',str(path),'-pointsize',str(size),'-annotate','+20+100',word,'png:-']);return Image.open(io.BytesIO(data)).convert('RGB')
def box(im,threshold):
 y,x=np.where(np.asarray(im).min(axis=2)<threshold)
 if not len(x):raise ValueError('blank')
 return (int(x.min()),int(y.min()),int(x.max())+1,int(y.max())+1)
for family in families:
 for weight in ['REGULAR','BOLD']:
  meta=next(r['headingFont'] for r in rows if r['family']==family and r['expected']==weight)
  original=Path(meta['file']);assert sha(original)==meta['sha256']
  font=TTFont(original,fontNumber=meta.get('index',0));assert font['OS/2'].usWeightClass==meta['weight']
  path=out/f'{family}-{weight}.ttf';font.save(path);font.close()
  for target in [12,24]:
   pair=[]
   for renderer in ['pillow','magick']:
    size=next((s for s in ([*range(7,65)] if renderer=='pillow' else [n/10 for n in range(70,650)]) if (lambda b:b[3]-b[1])(box(render(path,s,'H',renderer),128))==target),None)
    if size is None:raise ValueError(f'No exact height {family} {weight} {renderer} {target}')
    packed=Image.new('RGB',(1200,320),'white');boxes=[];clipped=False
    key=f'{family}-{weight}-{target}-{renderer}'
    for j,word in enumerate(['GOVERNMENT','WARNING:']):
     im=render(path,size,word,renderer);im.save(out/f'{key}-{j}.png');b=box(im,250)
     clipped |= b[0]<2 or b[1]<2 or b[2]>1198 or b[3]>158
     packed.paste(im,(0,j*160));boxes.append([b[0]-2,b[1]-2+j*160,b[2]+2,b[3]+2+j*160])
    tensor=prepare_words(packed,boxes);np.save(out/f'{key}.npy',tensor)
    rgb=np.rint((tensor.transpose(1,2,0)*np.array([.229,.224,.225])+np.array([.485,.456,.406]))*255).clip(0,255).astype('uint8');Image.fromarray(rgb).save(out/f'{key}.png')
    r=dict(id=key,family=family,expected=weight,renderer=renderer,height=target,size=size,font=sha(path),originalFont=meta,clipped=bool(clipped),boxes=boxes,tensorSha256=hashlib.sha256(tensor.tobytes()).hexdigest());pair.append(r);result.append(r)
   validate_pair(*pair)
expected={f'{f}-{w}-{h}-{r}' for f in families for w in ['REGULAR','BOLD'] for h in [12,24] for r in ['pillow','magick']};validate_matrix([r['id'] for r in result],expected)
sheet=Image.new('RGB',(1120,8*260),'white');draw=ImageDraw.Draw(sheet)
for i,r in enumerate(result):
 x=(i%4)*280;y=(i//4)*260;sheet.paste(Image.open(out/f"{r['id']}.png"),(x,y));draw.text((x,y+226),r['id'],fill='black')
sheet.save(out/'contact.png')
write_new(out/'manifest.json',json.dumps(dict(rows=result,sourceManifestSha256=sha(source),magick=subprocess.check_output(['magick','-version']).decode(),scope='Exposed controlled diagnostic; no inference yet'),indent=2)+'\n')
print('Validated 32 inputs:',out)
