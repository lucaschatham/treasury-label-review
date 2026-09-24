import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from experiment_budget import check_budget
class Budget(unittest.TestCase):
 def test_before_limit(self):check_budget(0,599,600)
 def test_at_and_after_limit(self):
  for now in [600,601]:
   with self.assertRaises(TimeoutError):check_budget(0,now,600)
unittest.main()
