import importlib.util
import pathlib
import unittest
p = pathlib.Path(__file__).resolve().parents[1] / 'scripts/experiments/audit_scores.py'
spec = importlib.util.spec_from_file_location('audit_scores', p)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class ScoreAuditTest(unittest.TestCase):
    def test_strict_ceiling_excludes_ties(self):
        rows = [dict(expected=e, score=s, verdict=v) for e,s,v in [('REGULAR',.9,'MATCH'),('BOLD',.9,'MATCH'),('BOLD',.95,'MATCH'),('BOLD',.2,'REVIEW')]]
        result = m.summarize(rows)
        self.assertEqual(result['falsePositive'], 1)
        self.assertEqual(result['boldAboveEveryRegular'], 1)
        self.assertEqual(result['bold'], 3)

    def test_no_regular_does_not_invent_ceiling(self):
        self.assertIsNone(m.summarize([dict(expected='BOLD', score=.8, verdict='MATCH')])['boldAboveEveryRegular'])

    def test_duplicate_conflicting_labels_rejected(self):
        with self.assertRaises(ValueError):
            m.deduplicate([dict(tensorSha256='x', expected='BOLD'), dict(tensorSha256='x', expected='REGULAR')])

if __name__ == '__main__': unittest.main()
