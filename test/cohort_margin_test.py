import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from cohort_margin import calibrate
class Margin(unittest.TestCase):
 def rows(self,n):return [dict(category='one',expected='REGULAR',score=.2)]+[dict(category='one',expected='BOLD',score=s) for s in [.1]+[.8]*(n-1)]
 def test_one_miss_allowed_in_twenty(self):self.assertAlmostEqual(calibrate(self.rows(20))['cutoff'],.5)
 def test_one_miss_not_allowed_in_nineteen(self):
  with self.assertRaises(ValueError):calibrate(self.rows(19))
 def test_cohort_cannot_hide_behind_large_group(self):
  rows=self.rows(20)+[dict(category='two',expected='REGULAR',score=.1),dict(category='two',expected='BOLD',score=.15)]
  with self.assertRaises(ValueError):calibrate(rows)
if __name__=='__main__':unittest.main()
