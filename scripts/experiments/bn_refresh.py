import torch

def refresh(model,batches):
 layers=[m for m in model.modules() if isinstance(m,torch.nn.modules.batchnorm._BatchNorm)]
 momenta={m:m.momentum for m in layers};seen=0;model.eval()
 try:
  for m in layers:m.reset_running_stats();m.train()
  with torch.no_grad():
   for batch in batches:
    n=len(batch)
    if n==0:continue
    for m in layers:m.momentum=n/(seen+n)
    model(batch);seen+=n
  if seen==0:raise ValueError('No training inputs')
 finally:
  for m in layers:m.momentum=momenta[m]
  model.eval()
