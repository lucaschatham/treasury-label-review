"""Retry transport failures within one shared deadline, without changing inputs."""
import subprocess,time
from bounded_download import download
def fetch(url,seconds,downloader=download,clock=time.monotonic):
 deadline=clock()+seconds
 for attempt in range(3):
  remaining=deadline-clock()
  if remaining<=0:raise TimeoutError('Shared download deadline reached')
  try:return downloader(url,remaining)
  except subprocess.CalledProcessError:
   if attempt==2:raise
