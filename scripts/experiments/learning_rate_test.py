import unittest
from learning_rate import rate
class Schedule(unittest.TestCase):
 def test_fixed_endpoints_and_monotonic_decay(self):
  values=[rate(i,100) for i in range(100)];self.assertEqual(values[0],.001);self.assertAlmostEqual(values[-1],.00001);self.assertTrue(all(a>=b for a,b in zip(values,values[1:])))
if __name__=='__main__':unittest.main()
