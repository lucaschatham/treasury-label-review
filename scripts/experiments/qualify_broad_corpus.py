"""Preserve and quarantine demonstrably contradictory source-weight labels."""
import hashlib,json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from corpus_labels import qualify
from family_coverage import validate_pixels
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 assets=ROOT.parent/'treasury-label-review-r035-assets';source=assets/'manifest.json';manifest=json.loads(source.read_text());original_path=ROOT.parent/'treasury-label-review-r034/inputs.json';assert sha(original_path)=='b6cbeffda874901ed049184390ff9da7f5d4de9d209976efea3c59c6a30f2d53';original=[r for r in json.loads(original_path.read_text()) if r['split']=='train']
 for r in manifest['rows']:assert sha(r['input'])==r['inputSha256']
 kept,quarantined=qualify(original,manifest['rows']);validate_pixels(original+kept);assert len(kept)==16832 and len(quarantined)==64
 outline_evidence=[]
 for family in sorted({r['family'] for r in quarantined}):
  faces=[]
  for weight in [400,700]:
   file=assets/family/f'{weight}.ttf';font=TTFont(file);glyphs=font.getGlyphSet();hashes={}
   for letter in sorted(set('GOVERNMENTWARNING:')):
    pen=DecomposingRecordingPen(glyphs);glyphs[font.getBestCmap()[ord(letter)]].draw(pen);hashes[letter]=hashlib.sha256(repr(pen.value).encode()).hexdigest()
   faces.append(dict(weight=font['OS/2'].usWeightClass,fontSha256=sha(file),glyphOutlineHashes=hashes))
  outline_evidence.append(dict(family=family,faces=faces,allHeadingOutlinesIdentical=faces[0]['glyphOutlineHashes']==faces[1]['glyphOutlineHashes']))
 report=dict(experiment='R-035-input-quality',sourceManifestSha256=sha(source),codeSha256=sha(__file__),originalTrainingPreserved=True,removedPredictions=False,keptAdditionalImages=len(kept),quarantinedImages=len(quarantined),quarantinedPixelPairs=len({r['pixelSha256'] for r in quarantined}),outlineEvidence=outline_evidence,rows=quarantined)
 with (assets/'label-conflicts.json').open('x') as f:json.dump(report,f,indent=2)
 qualified={**manifest,'sourceManifestSha256':sha(source),'labelConflictReportSha256':sha(assets/'label-conflicts.json'),'rows':kept,'qualificationCodeSha256':sha(__file__)}
 with (assets/'qualified-manifest.json').open('x') as f:json.dump(qualified,f,indent=2)
 print('Qualified',len(kept),'additional images; quarantined',len(quarantined),'contradictory inputs')
if __name__=='__main__':main()
