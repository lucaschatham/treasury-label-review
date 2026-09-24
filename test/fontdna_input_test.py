import sys,unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from fontdna_input import words
class Input(unittest.TestCase):
 def sample(self):
  a=np.full((224,224,3),255,dtype=np.uint8)
  a[45:72,15:205]=20;a[151:177,38:185]=40
  return a
 def test_inverse_preserves_both_word_inputs(self):
  a=words(self.sample());b=words(255-self.sample())
  self.assertEqual(len(a),2)
  for (x,c),(y,d) in zip(a,b):self.assertTrue(np.array_equal(x,y));self.assertEqual(c,d)
 def test_shape_and_normalization(self):
  result=words(self.sample());self.assertEqual(len(result),2)
  for x,c in result:
   self.assertEqual(x.shape[0:2],(1,40));self.assertEqual(x.shape[2]%8,0);self.assertLessEqual(x.shape[2],320);self.assertGreater(c,0);self.assertAlmostEqual(float(x.mean()),0,places=5)
 def test_partial_last_block_remains_valid(self):
  for x,c in words(self.sample()):self.assertEqual(c,x.shape[2]//8)
 def test_blank_rejected(self):
  with self.assertRaises(ValueError):words(np.full((224,224,3),255,dtype=np.uint8))
if __name__=='__main__':unittest.main()
