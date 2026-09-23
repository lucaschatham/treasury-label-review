export const decisionCount = rows => rows.filter(row => ['Approved','Sent back','Later'].includes(row.human?.status)).length;
export const resetMessage = count => `Start a new batch? This clears ${count} ${count === 1 ? 'decision' : 'decisions'} and the current results.`;
