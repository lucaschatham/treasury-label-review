import unittest
from ensemble_rule import accepts,MOBILE_CUTOFF,FONT_CUTOFF
class Contract(unittest.TestCase):
 def test_each_frozen_detector_can_supply_evidence(self):
  self.assertTrue(accepts(MOBILE_CUTOFF,0))
  self.assertTrue(accepts(0,FONT_CUTOFF))
  self.assertFalse(accepts(MOBILE_CUTOFF-1e-8,FONT_CUTOFF-1e-8))
 def test_invalid_probabilities_cannot_supply_evidence(self):
  for value in [float('nan'),float('inf'),-1,1.1]:
   with self.assertRaises(ValueError):accepts(value,.9)
   with self.assertRaises(ValueError):accepts(.99,value)
if __name__=='__main__':unittest.main()
