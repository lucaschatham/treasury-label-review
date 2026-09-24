import sys,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from polarity import canonical_pixels
class Polarity(unittest.TestCase):
 def test_exact_inverse_pair_same_pixels(self):
  a=np.full((12,30,3),255,dtype=np.uint8);a[4:8,5:20]=37
  self.assertTrue(np.array_equal(canonical_pixels(a),canonical_pixels(255-a)))
 def test_light_background_and_source_preserved(self):
  a=np.full((12,30,3),250,dtype=np.uint8);a[4:8,5:20]=21;b=a.copy()
  self.assertTrue(np.array_equal(canonical_pixels(a),b));self.assertTrue(np.array_equal(a,b))
if __name__=='__main__':unittest.main()
