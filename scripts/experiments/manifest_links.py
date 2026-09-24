"""Verify every provenance link in the qualified source-weight corpus."""
import hashlib,json
def verify(root):
 manifest=json.loads((root/'qualified-manifest.json').read_text())
 for field,file in [('sourceManifestSha256','manifest.json'),('labelConflictReportSha256','label-conflicts.json'),('selectionSha256','selection.json')]:
  if manifest[field]!=hashlib.sha256((root/file).read_bytes()).hexdigest():raise ValueError('Changed provenance: '+field)
 return True
