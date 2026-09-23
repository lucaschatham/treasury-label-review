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
