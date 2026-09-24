"""Experimental expected-behavior tests. Known RED; not the application suite."""
import json,subprocess,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class WeightBehavior(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  data=json.loads(subprocess.check_output([sys.executable,str(ROOT/'scripts/experiments/replay_systematic_debug.py')]))
  cls.rows={r['id']:r for r in data['rows']}
 def test_superclarendon_regular_cannot_pass(self):self.assertNotEqual(self.rows['Superclarendon-cap-9-regular']['verdict'],'MATCH')
 def test_georgia_regular_cannot_pass(self):self.assertNotEqual(self.rows['Georgia-cap-9-regular']['verdict'],'MATCH')
 def test_ti_bold_detected(self):self.assertEqual(self.rows['TI-Nspire-4-bold']['verdict'],'MATCH')
 def test_arial_bold_remains_detected(self):self.assertEqual(self.rows['Arial-same-family-bold']['verdict'],'MATCH')
unittest.main()
