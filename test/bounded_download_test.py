import http.server,sys,threading,time,unittest,subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/experiments'))
from bounded_download import download
class Handler(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  self.send_response(200);self.end_headers()
  if self.path=='/slow':time.sleep(2)
  else:self.wfile.write(b'font data')
 def log_message(self,*args):pass
class Download(unittest.TestCase):
 def test_response_and_absolute_timeout(self):
  server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
  thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
  try:
   url=f'http://127.0.0.1:{server.server_port}'
   self.assertEqual(download(url+'/ok',1),b'font data')
   start=time.monotonic()
   with self.assertRaises((subprocess.TimeoutExpired,subprocess.CalledProcessError)):download(url+'/slow',.1)
   self.assertLess(time.monotonic()-start,1)
  finally:server.shutdown();server.server_close()
if __name__=='__main__':unittest.main()
