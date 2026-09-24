"""Freeze adapted FontDNA ONNX weights and the predeclared cohort margin."""
import argparse,hashlib,json
from pathlib import Path
import onnx,torch,numpy as np
from onnx import numpy_helper
from cohort_margin import calibrate

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
 source=json.loads((a.source/'result.json').read_text());rows=[r for r in source['rows'] if r['split']!='train'];margin=calibrate(rows)
 head=torch.load(a.source/'head.pt',map_location='cpu',weights_only=True)
 original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)=='5f1feeb2f48346a08d0d7a0f26dbc4658347f6f5efe28fa21fb2200c361cc174'
 model=onnx.load(original)
 for i,tensor in enumerate(model.graph.initializer):
  values=numpy_helper.to_array(tensor).copy()
  if tensor.name=='m.head_style.0.weight':values=head['0.weight'].numpy()
  elif tensor.name=='m.head_style.0.bias':values=head['0.bias'].numpy()
  elif tensor.name=='m.head_style.2.weight':values[0]=head['2.weight'].numpy()[0]
  elif tensor.name=='m.head_style.2.bias':values[0]=head['2.bias'].numpy()[0]
  else:continue
  model.graph.initializer[i].CopyFrom(numpy_helper.from_array(values,tensor.name))
 onnx.checker.check_model(model);a.output.mkdir(exist_ok=False);onnx.save(model,a.output/'model.onnx')
 result=dict(experiment='R-027',decision='ADVANCE',scope='Exposed calibration only',modelFile='model.onnx',modelSha256=sha(a.output/'model.onnx'),sourceResultSha256=sha(a.source/'result.json'),sourceHeadSha256=sha(a.source/'head.pt'),canonicalPolarity=True,polarityCodeSha256=sha(Path(__file__).with_name('polarity.py')),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),runnerCodeSha256=sha(__file__),**margin)
 (a.output/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
