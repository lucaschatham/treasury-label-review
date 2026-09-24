import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from feature_neighbors import rank
class Neighbors(unittest.TestCase):
 def test_order(self):self.assertEqual([r['id'] for r in rank([1,0],[dict(id='a',tensor='a',vector=[0,1]),dict(id='b',tensor='b',vector=[1,0])])],['b','a'])
 def test_zero(self):
  with self.assertRaises(ValueError):rank([0,0],[])
 def test_dedup_and_tie(self):self.assertEqual([r['id'] for r in rank([1,0],[dict(id=i,tensor=t,vector=[1,0]) for i,t in [('z','x'),('b','y'),('a','x')]])],['a','b'])
unittest.main()
