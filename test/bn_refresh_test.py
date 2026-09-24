import sys,unittest
from pathlib import Path
import torch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from bn_refresh import refresh
class Refresh(unittest.TestCase):
 def test_buffers_only_and_dropout_disabled(self):
  m=torch.nn.Sequential(torch.nn.BatchNorm1d(1),torch.nn.Dropout(.9));before={n:p.clone() for n,p in m.named_parameters()};seen=[]
  h=m[1].register_forward_pre_hook(lambda mod,args:seen.append(mod.training))
  refresh(m,[torch.tensor([[1.],[3.]]),torch.tensor([[5.],[7.]])]);h.remove()
  self.assertAlmostEqual(m[0].running_mean.item(),4.)
  self.assertTrue(all(torch.equal(before[n],p) for n,p in m.named_parameters()))
  self.assertEqual(seen,[False,False]);self.assertFalse(m.training)
 def test_empty_rejected(self):
  with self.assertRaises(ValueError):refresh(torch.nn.BatchNorm1d(1),[])
unittest.main()
