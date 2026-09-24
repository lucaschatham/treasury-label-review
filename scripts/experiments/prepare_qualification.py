"""Frozen independent qualification; refuses to run before development passes."""
import argparse, hashlib, json, re, sys, time
from pathlib import Path
from urllib.parse import quote
from bounded_download import download
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image
import numpy as np
from family_coverage import validate_families
from experiment_budget import check_budget

ROOT=Path(__file__).resolve().parents[2]
RESEARCH=ROOT.parent/'treasury-label-review-mobilenet'
sys.path.insert(0,str(RESEARCH/'scripts/experiments'))
from prepare_mobilenet import render_words, packed_rgb, HEIGHTS
from heading_classifier import prepare_words, sha256

NAMES='domine exo2 karla lora mulish worksans sora trirong'.split()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--candidate',type=Path,required=True);args=ap.parse_args()
 result=json.loads((args.candidate/'result.json').read_text())
 if result['decision']!='ADVANCE':raise ValueError('Candidate has not passed development')
 if sha256(args.candidate/'model.pt')!=result['modelSha256']:raise ValueError('Changed candidate')
 if sha256(Path(__file__).with_name('polarity.py'))!=result['polarityCodeSha256']:raise ValueError('Changed candidate preprocessing')
 started=time.monotonic()
 root=ROOT.parent/'treasury-label-review-independent-qualification';root.mkdir(exist_ok=True)
 manifest=root/'manifest.json'
 if manifest.exists():raise ValueError('Manifest already frozen')
 original=json.loads((RESEARCH/'evidence/appearance-mobilenet-inputs-frozen.json').read_text())
 trained=json.loads((ROOT.parent/'treasury-label-review-r021-assets/manifest.json').read_text())
 blocked=original['historicallyExposedFamilyKeys']+[r['family'] for r in original['rows']+trained['rows']]
 blocked+=['Superclarendon','Georgia','TI-Nspire']
 validate_families(NAMES,blocked,8)
 def bounded_fetch(url,path):
  check_budget(started,time.monotonic(),900)
  if path.exists():
   result=path.read_bytes()
  else:
   remaining=900-(time.monotonic()-started)
   result=download(url,remaining)
   check_budget(started,time.monotonic(),900)
   with path.open('xb') as file:file.write(result)
  check_budget(started,time.monotonic(),900)
  return result
 revision=original['assets']['googleFontsRevision'];rows=[];fonts=[]
 for family in NAMES:
  if time.monotonic()-started>900:raise TimeoutError('Asset preparation budget')
  folder=root/family;folder.mkdir(exist_ok=True)
  base=f'https://raw.githubusercontent.com/google/fonts/{revision}/ofl/{family}/'
  metadata=bounded_fetch(base+'METADATA.pb',folder/'METADATA.pb').decode()
  license=bounded_fetch(base+'OFL.txt',folder/'OFL.txt').decode()
  if 'SIL OPEN FONT LICENSE' not in license.upper():raise ValueError('Missing OFL')
  blocks=[b for b in re.findall(r'fonts\s*\{(.*?)\n\}',metadata,re.S) if 'style: "normal"' in b]
  for weight in [400,700]:
   choices=[b for b in blocks if re.search(rf'weight: {weight}\b',b)] or [b for b in blocks if '[' in re.search(r'filename: "(.+)"',b)[1]]
   if not choices:raise ValueError(f'No weight {family} {weight}')
   filename=re.search(r'filename: "(.+)"',choices[0])[1]
   source=folder/filename;bounded_fetch(base+quote(filename),source)
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
   for height,inverted,jpeg in [(12,False,False),(16,False,False),(24,False,False),(24,True,False),(24,False,True)]:
    check_budget(started,time.monotonic(),900)
    image,boxes,render=render_words(target,height,inverted,jpeg)
    tensor=prepare_words(image,boxes);rgb=packed_rgb(tensor)
    id=f'{family}-{weight}-{height}-{int(inverted)}-{int(jpeg)}';out=folder/(id+'.png');Image.fromarray(rgb).save(out)
    rows.append(dict(id=id,family=family,split='qualification',category='independent-family',expected='BOLD' if weight==700 else 'REGULAR',input=str(out),inputSha256=sha256(out),pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest(),fontSha256=sha256(target),**render))
  print('prepared',family,flush=True)
 if len(rows)!=80:raise ValueError('Incorrect image count')
 targeted=json.loads((ROOT.parent/'treasury-label-review-r022-assets/manifest.json').read_text())
 evalpixels={r['pixelSha256'] for r in original['rows']+trained['rows']+targeted['rows']}
 if evalpixels.intersection(r['pixelSha256'] for r in rows):raise ValueError('Evaluation pixel overlap')
 check_budget(started,time.monotonic(),900)
 manifest.write_text(json.dumps(dict(experiment='independent-qualification',candidateSha256=result['modelSha256'],canonicalPolarity=result['canonicalPolarity'],polarityCodeSha256=result['polarityCodeSha256'],cutoff=result['cutoff'],revision=revision,codeSha256=sha256(__file__),fonts=fonts,rows=rows,seconds=time.monotonic()-started),indent=2))
 print('FROZEN',len(rows),'qualification inputs',flush=True)
if __name__=='__main__':main()
