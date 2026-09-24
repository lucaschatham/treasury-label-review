"""R-026 frozen typography backbone plus supervised style-head adaptation."""
import hashlib,json,time,random
from pathlib import Path
import numpy as np
from PIL import Image
import onnx,onnxruntime as ort,torch
from onnx import numpy_helper
from fontdna_input import words
from experiment_budget import check_budget
from experiment_failure import preserve_failure
from margin_calibration import calibrate
from finetune_contract import summarize
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 out=ROOT.parent/'treasury-label-review-r026-corrected';out.mkdir(exist_ok=False)
 started=time.monotonic();progress={'steps':0}
 with preserve_failure(out,'fontdna',started,progress,time.monotonic):
  torch.set_num_threads(2);torch.manual_seed(20260923);np.random.seed(20260923);random.seed(20260923)
  original=Path('/private/tmp/treasury-fontdna-v2.onnx');assert sha(original)=='5f1feeb2f48346a08d0d7a0f26dbc4658347f6f5efe28fa21fb2200c361cc174'
  graph=onnx.load(original);weights={x.name:numpy_helper.to_array(x).copy() for x in graph.graph.initializer}
  graph.graph.output.append(onnx.helper.make_tensor_value_info('/m/If_1_output_0',onnx.TensorProto.FLOAT,['batch',320]));onnx.save(graph,out/'features.onnx')
  options=ort.SessionOptions();options.intra_op_num_threads=2;session=ort.InferenceSession(str(out/'features.onnx'),options,providers=['CPUExecutionProvider'])
  research=ROOT.parent/'treasury-label-review-mobilenet';m=json.loads((research/'evidence/appearance-mobilenet-inputs-frozen.json').read_text())
  rows=[{**r,'input':str(research/r['input'])} for r in m['rows']]
  for path in ['treasury-label-review-r021-assets','treasury-label-review-r022-assets','treasury-label-review-independent-qualification']:
   rows+=json.loads((ROOT.parent/path/'manifest.json').read_text())['rows']
  assert sum(r['split']=='train' for r in rows)==4288
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  with torch.no_grad():
   head[0].weight.copy_(torch.from_numpy(weights['m.head_style.0.weight']));head[0].bias.copy_(torch.from_numpy(weights['m.head_style.0.bias']))
   head[2].weight.copy_(torch.from_numpy(weights['m.head_style.2.weight'][0:1]));head[2].bias.copy_(torch.from_numpy(weights['m.head_style.2.bias'][0:1]))
  features=[];native=[];batch=[];cols=[]
  def flush():
   if not batch:return
   padded=np.stack([np.pad(x,((0,0),(0,0),(0,320-x.shape[2])),constant_values=float(x[0,0,0])) for x in batch])
   outputs=session.run(['style','/m/If_1_output_0'],{'img':padded,'cols':np.asarray(cols,dtype=np.int64)})
   with torch.inference_mode():reference=head(torch.from_numpy(outputs[1])).flatten().numpy()
   assert np.max(np.abs(reference-outputs[0][:,0]))<1e-4,'Head parity failed'
   features.extend(outputs[1]);native.extend(outputs[0][:,0]);batch.clear();cols.clear()
  for i,row in enumerate(rows):
   check_budget(started,time.monotonic(),900);assert sha(row['input'])==row['inputSha256']
   for x,c in words(np.asarray(Image.open(row['input']).convert('RGB'))):batch.append(x);cols.append(c)
   if len(batch)>=32:flush()
   if i%500==0:print('features',i,'/',len(rows),flush=True)
  flush();check_budget(started,time.monotonic(),900)
  x=torch.from_numpy(np.asarray(features));np.save(out/'features.npy',x.numpy());np.save(out/'native-logits.npy',np.asarray(native))
  (out/'inputs.json').write_text(json.dumps(rows,indent=2));(out/'protocol.json').write_text(json.dumps(dict(experiment='R-026-corrected',sourceSha256=sha(original),inputCodeSha256=sha(Path(__file__).with_name('fontdna_input.py')),codeSha256=sha(__file__),images=len(rows),featureSeconds=time.monotonic()-started,headParityTolerance=1e-4,epochs=50,seed=20260923,batch=128,learningRate=.001,weightDecay=.01),indent=2))
  labels=torch.tensor([float(r['expected']=='BOLD') for r in rows for _ in range(2)])
  indices=[2*i+j for i,r in enumerate(rows) if r['split']=='train' for j in [0,1]]
  loader=torch.utils.data.DataLoader(torch.utils.data.TensorDataset(x[indices],labels[indices]),batch_size=128,shuffle=True,generator=torch.Generator().manual_seed(20260923))
  trainstarted=time.monotonic();optimizer=torch.optim.AdamW(head.parameters(),lr=.001,weight_decay=.01);lossfn=torch.nn.BCEWithLogitsLoss();losses=[]
  for epoch in range(50):
   head.train();total=0
   for bx,by in loader:
    check_budget(trainstarted,time.monotonic(),600);optimizer.zero_grad();loss=lossfn(head(bx).flatten(),by);loss.backward();optimizer.step();total+=loss.item()*len(bx);progress['steps']+=1
   losses.append(total/len(indices))
   if epoch%10==9:print('epoch',epoch+1,'loss',losses[-1],flush=True)
  head.eval()
  with torch.inference_mode():scores=head(x).flatten().sigmoid().reshape(-1,2).min(dim=1).values.tolist()
  evaluation=[i for i,r in enumerate(rows) if r['split']!='train'];ey=[int(rows[i]['expected']=='BOLD') for i in evaluation];es=[scores[i] for i in evaluation]
  try:cut=calibrate(es,ey);decision='ADVANCE'
  except ValueError:cut=None;decision='STOP'
  torch.save(head.state_dict(),out/'head.pt')
  output=[{k:r[k] for k in ['id','family','split','category','expected']}|dict(score=s) for r,s in zip(rows,scores)]
  result=dict(decision=decision,cutoff=cut,regularMaximum=max(s for s,y in zip(es,ey) if y==0),boldMinimum=min(s for s,y in zip(es,ey) if y==1),headSha256=sha(out/'head.pt'),trainingSeconds=time.monotonic()-trainstarted,wallSeconds=time.monotonic()-started,losses=losses,rows=output)
  (out/'result.json').write_text(json.dumps(result,indent=2,allow_nan=False));print(json.dumps({k:result[k] for k in ['decision','cutoff','regularMaximum','boldMinimum','wallSeconds']},indent=2))
if __name__=='__main__':main()
