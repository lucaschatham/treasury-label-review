"""R-030 fixed-rule evaluation; no calibration or model updates."""
import json,time
import torch,timm,numpy as np
from adapt_fontdna import ROOT,sha
from train_family_coverage import Inputs
from ensemble_rule import accepts,MOBILE_CUTOFF,FONT_CUTOFF
from finetune_contract import summarize

def main():
 out=ROOT.parent/'treasury-label-review-r030';out.mkdir(exist_ok=False);started=time.monotonic();torch.set_num_threads(2)
 rows=[r for r in json.loads((ROOT.parent/'treasury-label-review-r028/inputs.json').read_text()) if r['split']!='train']
 old=json.loads((ROOT.parent/'treasury-label-review-r026-corrected/result.json').read_text())
 font={r['id']:r['score'] for r in old['rows']}
 font.update({r['id']:r['score'] for r in json.loads((ROOT.parent/'treasury-label-review-independent-qualification-2/result.json').read_text())['rows']})
 mobile=ROOT.parent/'treasury-label-review-r025-frozen';assert sha(mobile/'model.pt')=='979bd481bcf6f0fc267a992d2010f211285bf11ebedde8604791756718498b2c'
 model=timm.create_model('mobilenetv3_small_100.lamb_in1k',pretrained=False,num_classes=1);model.load_state_dict(torch.load(mobile/'model.pt',map_location='cpu',weights_only=True));model.eval();scores=[]
 for row in rows:assert sha(row['input'])==row['inputSha256']
 with torch.inference_mode():
  for bx,_ in torch.utils.data.DataLoader(Inputs(rows,canonical=True),batch_size=16):scores.extend(model(bx).flatten().sigmoid().tolist())
 output=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(mobileScore=s,fontScore=font[r['id']],score=float(accepts(s,font[r['id']]))) for r,s in zip(rows,scores)]
 summaries={}
 for category in sorted({r['category'] for r in output}):
  group=[r for r in output if r['category']==category];summaries[category]=summarize([r['score'] for r in group],[int(r['expected']=='BOLD') for r in group],.5)
 result=dict(experiment='R-030',decision='ADVANCE' if all(s['pass'] for s in summaries.values()) else 'STOP',mobileCutoff=MOBILE_CUTOFF,fontCutoff=FONT_CUTOFF,codeSha256=sha(__file__),seconds=time.monotonic()-started,summaries=summaries,rows=output)
 (out/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
if __name__=='__main__':main()
