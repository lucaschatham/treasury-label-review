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
