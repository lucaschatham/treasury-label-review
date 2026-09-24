import unittest
import torch
from anchored_head import penalty
class Contract(unittest.TestCase):
 def test_penalty_restores_drift_without_mutating_reference(self):
  model=torch.nn.Linear(2,1);reference={k:p.detach().clone() for k,p in model.named_parameters()}
  self.assertEqual(penalty(model,reference).item(),0)
  with torch.no_grad():
   for p in model.parameters():p.add_(.5)
  before=penalty(model,reference).item();self.assertGreater(before,0)
  optimizer=torch.optim.SGD(model.parameters(),lr=.1);optimizer.zero_grad();penalty(model,reference).backward();optimizer.step()
  self.assertLess(penalty(model,reference).item(),before)
  for k,p in model.named_parameters():torch.testing.assert_close(p-reference[k],torch.full_like(p,.4))
if __name__=='__main__':unittest.main()
