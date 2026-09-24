"""R-035 reserve fixed before training, rendered only after candidate freeze."""
import argparse,hashlib,json,sys,time
from pathlib import Path
from PIL import Image
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT.parent/'treasury-label-review-mobilenet/scripts/experiments'))
from prepare_mobilenet import render_words,packed_rgb
from heading_classifier import prepare_words
from corpus_selection import related

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--candidate',type=Path,required=True);a=ap.parse_args();started=time.monotonic()
 source=ROOT.parent/'treasury-label-review-r035';result=json.loads((source/'result.json').read_text());candidate=json.loads((a.candidate/'result.json').read_text());assets=ROOT.parent/'treasury-label-review-r035-assets';selection=json.loads((assets/'selection.json').read_text())
 assert result['decision']=='ADVANCE' and candidate['decision']=='ADVANCE';assert candidate['sourceResultSha256']==sha(source/'result.json');assert sha(a.candidate/'model.onnx')==candidate['modelSha256'];assert result['selectionSha256']==sha(assets/'selection.json')
 for field,file in [('inputCodeSha256','fontdna_input.py'),('polarityCodeSha256','polarity.py')]:assert candidate[field]==sha(Path(__file__).with_name(file))
 training=json.loads((source/'inputs.json').read_text());reserved=selection['reserved'];assert len(reserved)==8 and not any(related(r['family'],f['family']) for r in training for f in reserved)
 root=ROOT.parent/'treasury-label-review-independent-qualification-4';root.mkdir(exist_ok=False);rows=[];fonts=[]
 for family in reserved:
  folder=root/family['family'];folder.mkdir()
  for face in family['faces']:
   file=Path(face['file']);assert sha(file)==face['fontSha256'];assert TTFont(file)['OS/2'].usWeightClass==face['weight'];fonts.append(face)
   for height,inverted,jpeg in [(12,False,False),(16,False,False),(24,False,False),(24,True,False),(24,False,True)]:
    image,boxes,render=render_words(file,height,inverted,jpeg);rgb=packed_rgb(prepare_words(image,boxes));id=f"{face['family']}-{face['weight']}-{height}-{int(inverted)}-{int(jpeg)}";path=folder/(id+'.png');Image.fromarray(rgb).save(path)
    rows.append(dict(id=id,family=face['family'],split='qualification',category='independent-family',expected='BOLD' if face['weight']==700 else 'REGULAR',input=str(path),inputSha256=sha(path),pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest(),fontSha256=face['fontSha256'],**render))
 assert len(rows)==80;assert not {r['pixelSha256'] for r in rows}.intersection(r['pixelSha256'] for r in training)
 manifest=dict(experiment='R-035-independent-qualification',candidateSha256=candidate['modelSha256'],modelFile='model.onnx',inputCodeSha256=candidate['inputCodeSha256'],polarityCodeSha256=candidate['polarityCodeSha256'],canonicalPolarity=True,cutoff=candidate['cutoff'],selectionSha256=sha(assets/'selection.json'),codeSha256=sha(__file__),fonts=fonts,rows=rows,seconds=time.monotonic()-started)
 (root/'manifest.json').write_text(json.dumps(manifest,indent=2));print('FROZEN',len(rows),'images from pre-reserved families')
if __name__=='__main__':main()
