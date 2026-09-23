// Machine findings are immutable inputs. Human review is a separate session record.
export function machinePile({ findings = [], confidence, error }) {
  if (error) return 'review';
  if (findings.some(item => item.status === 'mismatch')) return 'failed';
  if (findings.some(item => item.status === 'review') || confidence < 70) return 'review';
  return 'passed';
}
export function pileOf(row) {
  if (row.human?.status === 'Approved') return 'passed';
  if (row.human?.status === 'Sent back') return 'failed';
  if (row.human?.status === 'Later') return 'review';
  return machinePile(row);
}
export function transition(row, action, { reason = '', note = '' } = {}) {
  if (action === 'seen' && row.human?.status) return row;
  const status = {seen:'Seen', approve:'Approved', 'send-back':'Sent back', later:'Later'}[action];
  if (!status) throw new Error('Unknown review action');
  if (action === 'send-back' && !reason.trim()) throw new Error('Choose a reason to send back');
  return {...row, human: {status, reason, note}};
}
export function tallies(rows) {
  return rows.reduce((counts, row) => {
    counts[pileOf(row)]++;
    if (['Approved', 'Sent back'].includes(row.human?.status)) counts.human++;
    else if (pileOf(row) !== 'review') counts.machine++;
    return counts;
  }, {passed:0, failed:0, review:0, machine:0, human:0});
}
export function rowStatus(row) {
  if (row.human?.status === 'Seen' && machinePile(row) !== 'review') return 'Machine';
  return row.human?.status || (machinePile(row) === 'review' ? 'New' : 'Machine');
}
export function primaryFinding(row) {
  return row.findings.find(f => f.status === 'mismatch') || row.findings.find(f => f.status === 'review') || row.findings[0];
}
export function rowReason(row) {
  if (row.human?.status === 'Sent back') return `Sent back: ${row.human.reason}`;
  if (row.human?.status === 'Approved') return 'Approved after review';
  if (row.error) return "Couldn't open this image. Try a clearer file.";
  const finding = primaryFinding(row);
  if (finding?.status !== 'mismatch' && row.confidence < 70) return 'Photo too blurry to read confidently';
  if (finding?.status === 'mismatch' || finding?.status === 'review') {
    const field = finding.field || 'Label';
    const extra = row.findings.filter(f => ['review','mismatch'].includes(f.status)).length - 1;
    const reason = field === 'Warning appearance' && /unavailable|not configured/i.test(finding.found || '') ? 'Appearance check unavailable' : field === 'Warning appearance' ? "Can't tell if the warning heading is bold" : finding.status === 'mismatch' ? `${field} differs from the form` : `Check ${field.toLowerCase()} against the artwork`;
    return `${reason}${extra ? ` · +${extra} more` : ''}`;
  }
  return `All ${row.findings.filter(f => f.status === 'match').length} checks matched`;
}
export function reasonChoices(rows) {
  return [...new Set(rows.flatMap(row => row.findings.filter(f => ['review','mismatch'].includes(f.status)).map(f => f.field)).filter(Boolean)), 'Image unreadable', 'Other problem'];
}
