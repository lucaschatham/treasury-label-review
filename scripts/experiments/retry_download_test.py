import unittest,subprocess
from retry_download import fetch
class Retry(unittest.TestCase):
 def test_retry_preserves_url_and_shared_deadline(self):
  calls=[];times=iter([0,1,2,3])
  def download(url,remaining):
   calls.append((url,remaining))
   if len(calls)<3:raise subprocess.CalledProcessError(56,['curl'])
   return b'font'
  self.assertEqual(fetch('fixed-url',10,download,lambda:next(times)),b'font');self.assertEqual(calls,[('fixed-url',9),('fixed-url',8),('fixed-url',7)])
 def test_bounded_failures_are_not_silently_skipped(self):
  calls=[]
  def download(url,remaining):calls.append(url);raise subprocess.CalledProcessError(56,['curl'])
  with self.assertRaises(subprocess.CalledProcessError):fetch('fixed',10,download,lambda:0)
  self.assertEqual(len(calls),3)
if __name__=='__main__':unittest.main()
