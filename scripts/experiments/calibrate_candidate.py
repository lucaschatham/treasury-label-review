"""Produce a reproducible frozen candidate from all exposed development scores."""
import argparse,hashlib,json,shutil
from pathlib import Path
from margin_calibration import calibrate

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
 original=json.loads((a.source/'result.json').read_text());protocol=json.loads((a.source/'protocol.json').read_text())
 assert sha(a.source/'model.pt')==original['modelSha256']
 assert protocol['canonicalPolarity'] is True
 rows=original['rows'];assert rows and all(r['split'] in ['calibration','challenge'] for r in rows)
 scores=[r['score'] for r in rows];labels=[int(r['expected']=='BOLD') for r in rows]
 assert all(r['expected'] in ['BOLD','REGULAR'] for r in rows)
 cut=calibrate(scores,labels)
 a.output.mkdir(exist_ok=False);shutil.copyfile(a.source/'model.pt',a.output/'model.pt')
 result=dict(experiment='R-025',decision='ADVANCE',scope='Full exposed development calibration; not independent accuracy',modelSha256=original['modelSha256'],cutoff=cut,canonicalPolarity=True,polarityCodeSha256=protocol['polarityCodeSha256'],sourceResultSha256=sha(a.source/'result.json'),sourceProtocolSha256=sha(a.source/'protocol.json'),calibrationCodeSha256=sha(Path(__file__).with_name('margin_calibration.py')),runnerCodeSha256=sha(Path(__file__)),regularMaximum=max(s for s,y in zip(scores,labels) if y==0),boldMinimum=min(s for s,y in zip(scores,labels) if y==1),rows=[{**r,'sourceVerdict':r['verdict'],'verdict':'MATCH' if r['score']>=cut else 'REVIEW'} for r in rows])
 (a.output/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
 print(json.dumps({k:result[k] for k in ['cutoff','modelSha256','regularMaximum','boldMinimum']}))
if __name__=='__main__':main()
