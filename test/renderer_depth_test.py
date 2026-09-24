import io,subprocess,sys,unittest
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from render_controls import png_options
class Depth(unittest.TestCase):
 def test_antialiased_georgia_edges_survive_decode(self):
  root=Path(__file__).resolve().parents[1]
  b=subprocess.check_output(['magick','-size','1200x160','xc:white','-fill','black','-font',str(root/'evidence/render-diagnostic-r016/Georgia-REGULAR.ttf'),'-pointsize','15','-annotate','+20+100','GOVERNMENT',*png_options(),'png:-'])
  a=np.asarray(Image.open(io.BytesIO(b)).convert('RGB'))
  self.assertGreater(len(np.unique(a)),2)
unittest.main()
