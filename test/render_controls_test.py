import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from render_controls import validate_pair, validate_matrix, write_new
import tempfile
class Controls(unittest.TestCase):
 def test_font_mismatch(self):
  with self.assertRaisesRegex(ValueError,'font'):validate_pair(dict(font='a',height=12,clipped=False),dict(font='b',height=12,clipped=False))
 def test_height_mismatch(self):
  with self.assertRaisesRegex(ValueError,'height'):validate_pair(dict(font='a',height=12,clipped=False),dict(font='a',height=13,clipped=False))
 def test_clipping(self):
  with self.assertRaisesRegex(ValueError,'clipped'):validate_pair(dict(font='a',height=12,clipped=True),dict(font='a',height=12,clipped=False))
 def test_missing_and_duplicate(self):
  for rows in [['a'],['a','a']]:
   with self.assertRaises(ValueError):validate_matrix(rows,{'a','b'})
 def test_no_overwrite(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'x';write_new(p,'first')
   with self.assertRaises(FileExistsError):write_new(p,'second')
   self.assertEqual(p.read_text(),'first')
unittest.main()
