import io,subprocess,sys,unittest
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from render_controls import png_options
class Depth(unittest.TestCase):
 def test_grayscale_levels_survive_png_decode(self):
  b=subprocess.check_output(['magick','-size','513x1','gradient:black-white',*png_options(),'png:-'])
  a=np.asarray(Image.open(io.BytesIO(b)).convert('RGB'))
  self.assertGreater(len(np.unique(a)),2)
unittest.main()
