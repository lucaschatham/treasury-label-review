"""Preserve terminal experiment failures before propagating the actual error."""
import json
from contextlib import contextmanager
@contextmanager
def preserve_failure(output,arm,started,progress,clock):
 try:
  yield
 except Exception as error:
  result=dict(decision='STOP',arm=arm,reason=f'{type(error).__name__}: {error}',wallSeconds=clock()-started,completedSteps=progress['steps'])
  temporary=output/'failure.tmp'
  temporary.write_text(json.dumps(result,indent=2)+'\n')
  temporary.replace(output/'result.json')
  raise
