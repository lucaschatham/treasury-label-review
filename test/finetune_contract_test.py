import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from finetune_contract import summarize, cutoff_for
class Contract(unittest.TestCase):
 def test_calibration_excludes_regular(self):
  c=cutoff_for([.2,.7,.8,.9],[0,0,1,1]); self.assertGreater(c,.7)
  self.assertTrue(summarize([.2,.7,.8,.9],[0,0,1,1],c)['pass'])
 def test_any_false_match_rejects(self):
  self.assertFalse(summarize([.9,.95],[0,1],.8)['pass'])
 def test_insufficient_bold_rejects(self):
  self.assertFalse(summarize([.1,.7,.9],[0,1,1],.8)['pass'])
if __name__=='__main__': unittest.main()
