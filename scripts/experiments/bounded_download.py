"""Bound the entire download subprocess, including a slowly streamed body."""
import subprocess

def download(url, remaining):
    if remaining <= 0:
        raise TimeoutError('Asset preparation deadline reached')
    return subprocess.run(
        ['curl', '--fail', '--silent', '--show-error', '--location',
         '--max-time', str(min(90, remaining)), url],
        check=True, capture_output=True, timeout=remaining).stdout
