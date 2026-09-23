// Ephemeral diagnostics only. No artwork, application values, or network logging.
export async function timeStage(timings, name, action, now=()=>performance.now()) {
  const start=now();
  try { return await action(); }
  finally { timings[name]=now()-start; }
}

// total is per-label processing; clickToResult includes setup and the batch queue.
export function finishTiming(timings, clickedAt, started, finished) {
  return {...timings,total:finished-started,clickToResult:finished-clickedAt,
    queue:Math.max(0,started-clickedAt-timings.setup)};
}

export function returnTimeText({running=false, elapsed=0, seconds=null, first=null, total=0, stopped=false} = {}) {
  if (running) return `Checking labels · ${elapsed.toFixed(1)} seconds elapsed`;
  if (seconds === null) return 'Return time: —';
  if (stopped) return `Stopped after ${seconds.toFixed(1)} seconds`;
  return `${total > 1 ? 'Batch results' : 'Results'} returned in ${seconds.toFixed(1)} seconds${total > 1 && first !== null ? ` · First result in ${first.toFixed(1)} seconds` : ''}`;
}
