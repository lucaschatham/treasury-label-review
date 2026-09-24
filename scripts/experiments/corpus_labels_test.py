import unittest,copy
from corpus_labels import qualify
class Labels(unittest.TestCase):
 def test_identical_pixels_with_opposite_labels_are_quarantined(self):
  rows=[dict(id='a',pixelSha256='same',expected='REGULAR'),dict(id='b',pixelSha256='same',expected='BOLD'),dict(id='c',pixelSha256='different',expected='BOLD')];before=copy.deepcopy(rows)
  kept,quarantined=qualify([],rows);self.assertEqual([r['id'] for r in kept],['c']);self.assertEqual([r['id'] for r in quarantined],['a','b']);self.assertEqual(rows,before)
 def test_original_counterexamples_cannot_be_removed(self):
  original=[dict(id='old',pixelSha256='same',expected='REGULAR')]
  with self.assertRaises(ValueError):qualify(original,[dict(id='new',pixelSha256='same',expected='BOLD')])
 def test_distinct_heavy_regular_and_bold_examples_stay(self):
  rows=[dict(id='regular',pixelSha256='heavy',expected='REGULAR'),dict(id='bold',pixelSha256='heavier',expected='BOLD')];kept,quarantined=qualify([],rows);self.assertEqual(kept,rows);self.assertEqual(quarantined,[])
if __name__=='__main__':unittest.main()
