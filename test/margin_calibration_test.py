import sys,unittest,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from margin_calibration import calibrate
class Margin(unittest.TestCase):
 def test_symmetric_separation_gives_half(self):
  self.assertAlmostEqual(calibrate([.1,.2,.8,.9],[0,0,1,1]),.5)
 def test_overlap_and_touching_rejected(self):
  for scores in [[.8,.7],[.5,.5]]:
   with self.assertRaises(ValueError):calibrate(scores,[0,1])
 def test_both_classes_and_finite_required(self):
  for scores,labels in [([.2],[0]),([.1,.8],[0]),([float('nan'),.9],[0,1])]:
   with self.assertRaises(ValueError):calibrate(scores,labels)
if __name__=='__main__':unittest.main()
