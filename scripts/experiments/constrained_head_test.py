import unittest
import torch
from constrained_head import constrain
class Contract(unittest.TestCase):
 def test_only_final_projection_changes_after_update(self):
  torch.manual_seed(7)
  head=torch.nn.Sequential(torch.nn.Linear(320,160),torch.nn.GELU(),torch.nn.Linear(160,1))
  before={k:v.detach().clone() for k,v in head.state_dict().items()}
  constrain(head)
  optimizer=torch.optim.AdamW((p for p in head.parameters() if p.requires_grad),lr=.01)
  optimizer.zero_grad();head(torch.ones(4,320)).sum().backward();optimizer.step()
  self.assertTrue(torch.equal(before['0.weight'],head[0].weight))
  self.assertTrue(torch.equal(before['0.bias'],head[0].bias))
  self.assertFalse(torch.equal(before['2.weight'],head[2].weight))
  self.assertFalse(torch.equal(before['2.bias'],head[2].bias))
if __name__=='__main__':unittest.main()
