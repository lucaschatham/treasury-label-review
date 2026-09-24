import unittest,tempfile,json,hashlib
from pathlib import Path
from manifest_links import verify
class Links(unittest.TestCase):
 def test_all_links_must_match_their_artifacts(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);fields={'sourceManifestSha256':'manifest.json','labelConflictReportSha256':'label-conflicts.json','selectionSha256':'selection.json'}
   for file in fields.values():(root/file).write_text('{}')
   manifest={field:hashlib.sha256((root/file).read_bytes()).hexdigest() for field,file in fields.items()};(root/'qualified-manifest.json').write_text(json.dumps(manifest));self.assertTrue(verify(root))
   for file in fields.values():
    (root/file).write_text('{"changed":true}')
    with self.assertRaises(ValueError):verify(root)
    (root/file).write_text('{}')
if __name__=='__main__':unittest.main()
