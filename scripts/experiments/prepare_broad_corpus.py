"""R-035 deterministic OFL corpus expansion; reserve families before rendering."""
import hashlib,json,re,sys,time,logging
from pathlib import Path
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image
from retry_download import fetch as download
from experiment_budget import check_budget
from corpus_selection import ordered,related
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT.parent/'treasury-label-review-mobilenet/scripts/experiments'))
from prepare_mobilenet import render_words,packed_rgb,HEIGHTS
from heading_classifier import prepare_words
logging.getLogger('fontTools').setLevel(logging.ERROR)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 started=time.monotonic();out=ROOT.parent/'treasury-label-review-r035-assets';out.mkdir(exist_ok=True)
 if (out/'selection.json').exists() or (out/'manifest.json').exists():raise ValueError('Frozen output already exists')
 revision='b5efa9c32e8f9b63005f5cdb1ad5527a77d2cd04';treepath=Path('/private/tmp/treasury-google-font-tree.json');tree=json.loads(treepath.read_text());assert not tree.get('truncated') and tree['sha']==revision
 files=defaultdict(dict)
 for entry in tree['tree']:
  p=entry['path'].split('/')
  if len(p)==3 and p[0]=='ofl' and p[-1].endswith('.ttf') and 'Italic' not in p[-1] and entry.get('size',0)<5000000:files[p[1]][p[-1]]=entry['size']
 license_paths={entry['path'] for entry in tree['tree']}
 missing_license=sorted(k for k in files if f'ofl/{k}/OFL.txt' not in license_paths)
 candidates=[k for k,v in files.items() if k not in missing_license and ( any('wght' in n for n in v) or (any(n.endswith('-Regular.ttf') for n in v) and any(n.endswith('-Bold.ttf') for n in v)))]
 existing=json.loads((ROOT.parent/'treasury-label-review-r034/inputs.json').read_text());thirdroot=ROOT.parent/'treasury-label-review-independent-qualification-3';third=json.loads((thirdroot/'manifest.json').read_text());original=json.loads((ROOT.parent/'treasury-label-review-mobilenet/evidence/appearance-mobilenet-inputs-frozen.json').read_text())
 excluded={r['family'] for r in existing+third['rows']}|set(original['historicallyExposedFamilyKeys']);names=ordered(candidates,excluded)
 def fetch(url,path):
  check_budget(started,time.monotonic(),1200)
  if not path.exists():path.write_bytes(download(url,min(90,1200-(time.monotonic()-started))))
  return path.read_bytes()
 def prepare(family):
  folder=out/family;folder.mkdir(exist_ok=True);base=f'https://raw.githubusercontent.com/google/fonts/{revision}/ofl/{family}/'
  try:
   metadata=fetch(base+'METADATA.pb',folder/'METADATA.pb').decode();license=fetch(base+'OFL.txt',folder/'OFL.txt').decode();assert 'SIL OPEN FONT LICENSE' in license.upper()
   blocks=[b for b in re.findall(r'fonts\s*\{(.*?)\n\}',metadata,re.S) if 'style: "normal"' in b];faces=[]
   for weight in [400,700]:
    choices=[b for b in blocks if re.search(rf'weight: {weight}\b',b)] or [b for b in blocks if '[' in re.search(r'filename: "(.+)"',b)[1]]
    if not choices:raise ValueError('Missing normal400/700 source')
    filename=re.search(r'filename: "(.+)"',choices[0])[1]
    if filename not in files[family]:raise ValueError('Source missing or over5MB')
    source=folder/filename;fetch(base+quote(filename),source);font=TTFont(source)
    if 'fvar' in font:
     axes={a.axisTag:a.defaultValue for a in font['fvar'].axes};axis=next(a for a in font['fvar'].axes if a.axisTag=='wght')
     if not axis.minValue<=weight<=axis.maxValue:raise ValueError('Weight outside source range')
     axes['wght']=weight;font=instantiateVariableFont(font,axes,inplace=False)
    if font['OS/2'].usWeightClass!=weight or not set(map(ord,'GOVERNMENTWARNING:')).issubset(font.getBestCmap()):raise ValueError('Wrong source weight or missing Latin glyph')
    target=folder/f'{weight}.ttf'
    if not target.exists():font.save(target)
    if TTFont(target)['OS/2'].usWeightClass!=weight:raise ValueError('Cached face weight mismatch')
    faces.append(dict(family=family,weight=weight,file=str(target),fontSha256=sha(target),sourceSha256=sha(source),sourceUrl=base+quote(filename),licenseSha256=sha(folder/'OFL.txt')))
   return dict(family=family,faces=faces)
  except (ValueError,AssertionError,StopIteration) as e:return dict(family=family,rejected=str(e) or type(e).__name__)
 reserved=[];training=[];rejected=[];attempted=[]
 with ThreadPoolExecutor(max_workers=4) as executor:
  for start in range(0,len(names),8):
   if len(training)==256:break
   for result in executor.map(prepare,names[start:start+8]):
    attempted.append(result['family'])
    if 'rejected' in result:rejected.append(result);continue
    # Separate held-out designs. Related variants may coexist within training.
    if any(related(result['family'],r['family']) for r in reserved):rejected.append(dict(family=result['family'],rejected='Related to reserved family'));continue
    if len(reserved)<8:reserved.append(result)
    elif len(training)<256:training.append(result)
   print('selected',len(training),'training,',len(reserved),'reserved;',round(time.monotonic()-started,1),'seconds',flush=True)
 if len(training)!=256 or len(reserved)!=8:raise ValueError('Insufficient eligible independent families')
 selection=dict(experiment='R-035',revision=revision,treeSha256=sha(treepath),selectionCodeSha256=sha(Path(__file__).with_name('corpus_selection.py')),codeSha256=sha(__file__),training=training,reserved=reserved,rejected=rejected,missingLicenseFamilies=missing_license,attempted=attempted,scope='Selected without detector inference; reserved images not yet rendered')
 (out/'selection.json').write_text(json.dumps(selection,indent=2))
 # Add the now-exposed third set, preserving its verified source weights.
 oldfaces=[]
 for f in third['fonts']:
  path=thirdroot/f['family']/f"{f['weight']}.ttf";assert sha(path)==f['fontSha256'];oldfaces.append(f|dict(file=str(path)))
 faces=[face for family in training for face in family['faces']]+oldfaces;rows=[]
 for i,face in enumerate(faces):
  folder=out/face['family'];folder.mkdir(exist_ok=True)
  for height in HEIGHTS:
   for inverted in [False,True]:
    for jpeg in [False,True]:
     check_budget(started,time.monotonic(),1200);image,boxes,render=render_words(Path(face['file']),height,inverted,jpeg);rgb=packed_rgb(prepare_words(image,boxes));id=f"{face['family']}-{face['weight']}-{height}-{int(inverted)}-{int(jpeg)}";path=folder/(id+'.png');Image.fromarray(rgb).save(path)
     rows.append(dict(id=id,family=face['family'],split='train',category='broad-source-weight',expected='BOLD' if face['weight']==700 else 'REGULAR',input=str(path),inputSha256=sha(path),pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest(),fontSha256=face['fontSha256'],**render))
  if (i+1)%32==0:print('rendered',len(rows),'images;',round(time.monotonic()-started,1),'seconds',flush=True)
 assert len(rows)==16896
 (out/'manifest.json').write_text(json.dumps(dict(experiment='R-035',selectionSha256=sha(out/'selection.json'),codeSha256=sha(__file__),fonts=faces,rows=rows,seconds=time.monotonic()-started),indent=2))
 print('Prepared',len(rows),'training images; reserved',[r['family'] for r in reserved],flush=True)
if __name__=='__main__':main()
