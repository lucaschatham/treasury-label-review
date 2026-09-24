"""R-021: pinned OFL assets and broader balanced development inputs."""
import hashlib, json, re, sys, time
from pathlib import Path
from urllib.parse import quote
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image
import numpy as np
from family_coverage import validate_families

ROOT=Path(__file__).resolve().parents[2]
RESEARCH=ROOT.parent/'treasury-label-review-mobilenet'
sys.path.insert(0,str(RESEARCH/'scripts/experiments'))
from mobilenet_assets import fetch
from prepare_mobilenet import render_words, packed_rgb, HEIGHTS
from heading_classifier import prepare_words, sha256

NAMES='afacad albertsans alexandria archivo assistant atkinsonhyperlegible bevietnampro bodonimoda bricolagegrotesque commissioner cormorantgaramond crimsonpro dmsans dosis ebgaramond figtree frankruhllibre fraunces gabarito gelasio heebo hind ibmplexserif inconsolata instrumentsans inter jost lexend librebaskerville librefranklin manrope newsreader notosans notoserif outfit overpass petrona playfairdisplay plusjakartasans publicsans quicksand redhatdisplay signika spectral syne urbanist yanonekaffeesatz zillaslab'.split()

def main():
 started=time.monotonic()
 root=ROOT.parent/'treasury-label-review-r021-assets';root.mkdir(exist_ok=True)
 manifest=root/'manifest.json'
 if manifest.exists():raise ValueError('Manifest already frozen')
 original=json.loads((RESEARCH/'evidence/appearance-mobilenet-inputs-frozen.json').read_text())
 blocked=original['historicallyExposedFamilyKeys']+[r['family'] for r in original['rows']]+original['assets']['reservedUnrenderedFamilies']
 validate_families(NAMES,blocked,48)
 revision=original['assets']['googleFontsRevision'];rows=[];fonts=[]
 for family in NAMES:
  if time.monotonic()-started>900:raise TimeoutError('Asset preparation budget')
  folder=root/family;folder.mkdir(exist_ok=True)
  base=f'https://raw.githubusercontent.com/google/fonts/{revision}/ofl/{family}/'
  metadata=fetch(base+'METADATA.pb',folder/'METADATA.pb').decode()
  license=fetch(base+'OFL.txt',folder/'OFL.txt').decode()
  if 'SIL OPEN FONT LICENSE' not in license.upper():raise ValueError('Missing OFL')
  blocks=[b for b in re.findall(r'fonts\s*\{(.*?)\n\}',metadata,re.S) if 'style: "normal"' in b]
  for weight in [400,700]:
   choices=[b for b in blocks if re.search(rf'weight: {weight}\b',b)] or [b for b in blocks if '[' in re.search(r'filename: "(.+)"',b)[1]]
   if not choices:raise ValueError(f'No weight {family} {weight}')
   filename=re.search(r'filename: "(.+)"',choices[0])[1]
   source=folder/filename;fetch(base+quote(filename),source)
   font=TTFont(source)
   if 'fvar' in font:
    axes={a.axisTag:a.defaultValue for a in font['fvar'].axes}
    axis=next(a for a in font['fvar'].axes if a.axisTag=='wght')
    if not axis.minValue<=weight<=axis.maxValue:raise ValueError('Weight outside source range')
    axes['wght']=weight;font=instantiateVariableFont(font,axes,inplace=False)
   if font['OS/2'].usWeightClass!=weight or not set(map(ord,'GOVERNMENTWARNING:')).issubset(font.getBestCmap()):raise ValueError('Wrong weight or missing glyph')
   target=folder/f'{weight}.ttf'
   if not target.exists():font.save(target)
   fonts.append(dict(family=family,weight=weight,sourceUrl=base+quote(filename),sourceSha256=sha256(source),fontSha256=sha256(target),licenseSha256=sha256(folder/'OFL.txt')))
   for height in HEIGHTS:
    for inverted in [False,True]:
     for jpeg in [False,True]:
      image,boxes,render=render_words(target,height,inverted,jpeg)
      tensor=prepare_words(image,boxes);rgb=packed_rgb(tensor)
      id=f'{family}-{weight}-{height}-{int(inverted)}-{int(jpeg)}';out=folder/(id+'.png');Image.fromarray(rgb).save(out)
      rows.append(dict(id=id,family=family,split='train',category='expanded',expected='BOLD' if weight==700 else 'REGULAR',input=str(out),inputSha256=sha256(out),pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest(),fontSha256=sha256(target),**render))
  print('prepared',family,flush=True)
 if len(rows)!=3072:raise ValueError('Incorrect image count')
 evalpixels={r['pixelSha256'] for r in original['rows'] if r['split']!='train'}
 if evalpixels.intersection(r['pixelSha256'] for r in rows):raise ValueError('Evaluation pixel overlap')
 manifest.write_text(json.dumps(dict(experiment='R-021',revision=revision,codeSha256=sha256(__file__),fonts=fonts,rows=rows,seconds=time.monotonic()-started),indent=2))
 print('FROZEN',len(rows),'new inputs',flush=True)
if __name__=='__main__':main()
