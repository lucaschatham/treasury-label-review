import unittest
from corpus_selection import related,ordered
class Selection(unittest.TestCase):
 def test_obvious_design_variants_stay_together(self):
  for a,b in [('CrimsonText','CrimsonPro'),('AveriaSerifLibre','AveriaSansLibre'),('Roboto','RobotoCondensed')]:self.assertTrue(related(a,b))
  self.assertFalse(related('Arima','Amiko'))
 def test_exclusions_are_variant_aware_and_order_is_input_independent(self):
  a=['amiko','robotocondensed','arima','besley'];result=ordered(a,['Roboto'])
  self.assertNotIn('robotocondensed',result);self.assertEqual(result,ordered(list(reversed(a)),['Roboto']));self.assertEqual(set(result),{'amiko','arima','besley'})
if __name__=='__main__':unittest.main()
