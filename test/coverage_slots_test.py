import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from coverage_slots import slots
class Slots(unittest.TestCase):
 def test_stable_balanced_selection(self):
  rows=[dict(id=i,expected=c) for i,c in [('z','BOLD'),('b','REGULAR'),('a','REGULAR'),('y','BOLD')]]
  self.assertEqual(slots(rows),['a','b','y','z'])
 def test_insufficient_class_rejected(self):
  with self.assertRaises(ValueError):slots([dict(id='a',expected='BOLD')]*4)
unittest.main()
