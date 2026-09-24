"""R-022: source-verified targeted families across retained rendering conditions."""
import hashlib,json,sys,time
from pathlib import Path
from fontTools.ttLib import TTFont
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT.parent/'treasury-label-review-mobilenet/scripts/experiments'))
from prepare_mobilenet import render_words,packed_rgb,HEIGHTS
from heading_classifier import prepare_words,sha256
from experiment_budget import check_budget

def main():
 started=time.monotonic();out=ROOT.parent/'treasury-label-review-r022-assets';out.mkdir(exist_ok=False)
 original=ROOT.parent/'treasury-label-review/evidence/appearance-stroke-inputs-frozen.json'
 source=json.loads(original.read_text());faces={}
 for row in source['rows']:
  face=row.get('headingFont')
  if face and row['family'] in ['Superclarendon','Georgia','TI-Nspire']:
   faces.setdefault((row['family'],face['weight']),face)
 assert len(faces)==6
 rows=[];fonts=[]
 for (family,weight),info in sorted(faces.items()):
  check_budget(started,time.monotonic(),900)
  assert sha256(info['file'])==info['sha256']
  font=TTFont(info['file'],fontNumber=info['index']);assert font['OS/2'].usWeightClass==weight
  target=out/f'{family}-{weight}.ttf';font.save(target)
  fonts.append(dict(family=family,weight=weight,source=info,fontSha256=sha256(target)))
  for height in HEIGHTS:
   for inverted in [False,True]:
    for jpeg in [False,True]:
     check_budget(started,time.monotonic(),900)
     image,boxes,render=render_words(target,height,inverted,jpeg);tensor=prepare_words(image,boxes);rgb=packed_rgb(tensor)
     id=f'{family}-{weight}-{height}-{int(inverted)}-{int(jpeg)}';path=out/(id+'.png');Image.fromarray(rgb).save(path)
     rows.append(dict(id=id,family=family,split='train',category='targeted',expected='BOLD' if weight==700 else 'REGULAR',input=str(path),inputSha256=sha256(path),pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest(),**render))
 check_budget(started,time.monotonic(),900)
 (out/'manifest.json').write_text(json.dumps(dict(experiment='R-022',sourceManifestSha256=sha256(original),codeSha256=sha256(__file__),fonts=fonts,rows=rows,seconds=time.monotonic()-started),indent=2))
 print('Prepared',len(rows),'targeted images')
if __name__=='__main__':main()
