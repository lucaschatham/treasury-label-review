import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from transfer_split import partition
class Split(unittest.TestCase):
 def test_exposed_pixels_cannot_count_as_transfer(self):
  rows=[dict(id='seen',pixelSha256='a',expected='BOLD'),dict(id='new',pixelSha256='b',expected='REGULAR')]
  kept,excluded=partition(rows,[dict(pixelSha256='a',expected='BOLD')])
  self.assertEqual([r['id'] for r in kept],['new']);self.assertEqual([r['id'] for r in excluded],['seen'])
  self.assertEqual(len(rows),2)
 def test_conflicting_labels_rejected(self):
  with self.assertRaises(ValueError):partition([dict(pixelSha256='a',expected='BOLD')],[dict(pixelSha256='a',expected='REGULAR')])
if __name__=='__main__':unittest.main()
