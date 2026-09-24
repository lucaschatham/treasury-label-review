import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from family_coverage import validate_families, validate_pixels
class Coverage(unittest.TestCase):
 def test_disjoint_and_balanced(self):
  self.assertEqual(validate_families(['One','Two'],['Three'],2),['one','two'])
 def test_alias_duplicate_rejected(self):
  with self.assertRaises(ValueError):validate_families(['One Sans','one-sans'],[],2)
 def test_reserved_alias_rejected(self):
  with self.assertRaises(ValueError):validate_families(['One Sans'],['one-sans'],1)
 def test_wrong_count_rejected(self):
  with self.assertRaises(ValueError):validate_families(['One'],[],2)
 def test_opposite_labels_same_pixels_rejected(self):
  with self.assertRaises(ValueError):validate_pixels([dict(pixelSha256='same',expected='BOLD',split='train'),dict(pixelSha256='same',expected='REGULAR',split='train')])
 def test_train_evaluation_pixel_overlap_rejected(self):
  with self.assertRaises(ValueError):validate_pixels([dict(pixelSha256='same',expected='BOLD',split='train'),dict(pixelSha256='same',expected='BOLD',split='calibration')])
 def test_same_class_same_partition_duplicates_allowed(self):
  self.assertEqual(validate_pixels([dict(pixelSha256='same',expected='BOLD',split='train')]*2),1)
if __name__=='__main__':unittest.main()
