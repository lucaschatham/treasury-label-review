import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from render_controls import common_height
class Heights(unittest.TestCase):
 def test_intersection_and_tie(self):self.assertEqual(common_height([{11,12,13},{11,13},{11,13},{11,13}],12),11)
 def test_nearest(self):self.assertEqual(common_height([{12,13}]*4,12),12)
 def test_empty(self):
  with self.assertRaises(ValueError):common_height([{9},{9},{9},{9}],12)
unittest.main()
