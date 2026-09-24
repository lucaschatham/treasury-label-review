import json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from experiment_failure import preserve_failure
class Failure(unittest.TestCase):
 def test_timeout_records_stop_and_reraises(self):
  with tempfile.TemporaryDirectory() as d:
   out=Path(d)
   with self.assertRaises(TimeoutError):
    with preserve_failure(out,'baseline',0,{'steps':17},clock=lambda:20):
     raise TimeoutError('budget')
   self.assertTrue((out/'result.json').exists(), 'Failure evidence must be written')
   result=json.loads((out/'result.json').read_text())
   self.assertEqual(result,dict(decision='STOP',arm='baseline',reason='TimeoutError: budget',wallSeconds=20,completedSteps=17))
if __name__=='__main__':unittest.main()
