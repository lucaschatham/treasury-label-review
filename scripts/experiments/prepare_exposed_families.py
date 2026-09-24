"""R-034 full-condition source-weight coverage for exposed counterexample families."""
import json,time,hashlib,sys
from pathlib import Path
from PIL import Image
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[2]
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
from experiment_budget import check_budget
sys.path.insert(0,str(ROOT.parent/'treasury-label-review-mobilenet/scripts/experiments'))
from prepare_mobilenet import render_words,packed_rgb,HEIGHTS
from heading_classifier import prepare_words

def main():
 started=time.monotonic();out=ROOT.parent/'treasury-label-review-r034-assets-verified';out.mkdir(exist_ok=False);rows=[];fonts=[]
 for directory in ['treasury-label-review-independent-qualification','treasury-label-review-independent-qualification-2']:
  root=ROOT.parent/directory;m=json.loads((root/'manifest.json').read_text())
  for face in m['fonts']:
   file=root/face['family']/f"{face['weight']}.ttf";assert sha(file)==face['fontSha256'];assert TTFont(file)['OS/2'].usWeightClass==face['weight'];fonts.append(face|dict(file=str(file)))
   for height in HEIGHTS:
    for inverted in [False,True]:
     for jpeg in [False,True]:
      check_budget(started,time.monotonic(),300);image,boxes,render=render_words(file,height,inverted,jpeg);rgb=packed_rgb(prepare_words(image,boxes));id=f"{face['family']}-{face['weight']}-{height}-{int(inverted)}-{int(jpeg)}";path=out/(id+'.png');Image.fromarray(rgb).save(path)
      rows.append(dict(id=id,family=face['family'],split='train',category='exposed-family-training',expected='BOLD' if face['weight']==700 else 'REGULAR',input=str(path),inputSha256=sha(path),pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest(),fontSha256=face['fontSha256'],**render))
 assert len(rows)==1024 and len({r['family'] for r in rows})==16
 previous=json.loads((ROOT.parent/'treasury-label-review-r028/inputs.json').read_text());pixels={r['pixelSha256'] for r in rows};overlap=[r['id'] for r in previous if r['split']!='train' and r['pixelSha256'] in pixels]
 result=dict(experiment='R-034',codeSha256=sha(__file__),fonts=fonts,rows=rows,trainedRegressionOverlapIds=overlap,seconds=time.monotonic()-started)
 (out/'manifest.json').write_text(json.dumps(result,indent=2));print('Prepared',len(rows),'images; exact old evaluation overlap',len(overlap))
if __name__=='__main__':main()
