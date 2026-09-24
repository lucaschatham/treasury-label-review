import unittest
import torch
from augmented_features import select
class Contract(unittest.TestCase):
 def test_views_cannot_change_word_identity_or_order(self):
  x=torch.arange(5*9*3).reshape(5,9,3);indices=torch.tensor([4,0,2]);views=torch.tensor([8,3,5])
  result=select(x,indices,views)
  torch.testing.assert_close(result,torch.stack([x[4,8],x[0,3],x[2,5]]))
if __name__=='__main__':unittest.main()
