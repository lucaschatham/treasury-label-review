export function reviewSummary(findings) {
  const pending = findings.filter(item => ['review', 'mismatch'].includes(item.status)).length;
  return { pending, complete: pending === 0 };
}
