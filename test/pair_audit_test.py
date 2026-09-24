import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from pair_audit import audit
class Pairs(unittest.TestCase):
 def row(self,id,label,score):return dict(id=id,expected=label,score=score,family='A',category='test')
 def test_order_and_ties(self):
  out=audit([self.row('A-bold','BOLD',.8),self.row('A-regular','REGULAR',.8)])
  self.assertEqual(out['strictlyOrdered'],0);self.assertEqual(out['pairs'],1)
 def test_missing_rejected(self):
  with self.assertRaises(ValueError):audit([self.row('A-bold','BOLD',.8)])
 def test_label_mismatch(self):
  with self.assertRaises(ValueError):audit([self.row('A-bold','REGULAR',.8)])
 def test_duplicate_rejected(self):
  with self.assertRaises(ValueError):audit([self.row('A-bold','BOLD',.8)]*2)
unittest.main()
