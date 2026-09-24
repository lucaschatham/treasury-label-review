import unittest,copy
from regression_roles import annotate
class Contract(unittest.TestCase):
 def test_preserve_examples_and_distinguish_family_from_exact_exposure(self):
  train=[dict(id='train',family='A',pixelSha256='one',expected='BOLD')]
  rows=[dict(id='old',family='A',pixelSha256='one',expected='BOLD'),dict(id='variant',family='A',pixelSha256='two',expected='BOLD'),dict(id='other',family='B',pixelSha256='three',expected='REGULAR')];before=copy.deepcopy(rows)
  result=annotate(rows,train);self.assertEqual(rows,before);self.assertEqual([r['id'] for r in result],['old','variant','other'])
  self.assertEqual([(r.get('trainedFamily'),r.get('trainedPixel')) for r in result],[(True,True),(True,False),(False,False)])
 def test_conflicting_answer_key_fails(self):
  with self.assertRaises(ValueError):annotate([dict(family='A',pixelSha256='x',expected='BOLD')],[dict(family='A',pixelSha256='x',expected='REGULAR')])
if __name__=='__main__':unittest.main()
