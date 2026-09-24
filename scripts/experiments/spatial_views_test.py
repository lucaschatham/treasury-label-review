import unittest
import numpy as np
from spatial_views import views
class Contract(unittest.TestCase):
 def test_translations_preserve_interior_ink_and_source(self):
  x=np.ones((1,40,64),dtype=np.float32);x[:,10:20,20:30]=-2;before=x.copy();v=views(x)
  self.assertEqual(v.shape,(9,1,40,64));np.testing.assert_array_equal(x,before)
  for i,(dy,dx) in enumerate((y,x) for y in [-1,0,1] for x in [-1,0,1]):
   expected=np.ones_like(x);expected[:,10+dy:20+dy,20+dx:30+dx]=-2
   np.testing.assert_array_equal(v[i],expected)
if __name__=='__main__':unittest.main()
