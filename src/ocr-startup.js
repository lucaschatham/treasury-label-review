// Tesseract 7 reports some initialization failures through errorHandler while
// leaving createWorker's promise pending. Bridge that channel and bound startup.
export function createOcrLoader(factory, options = {}, {timeoutMs = 60_000} = {}) {
  let startup;
  return () => {
    if (startup) return startup;
    startup = new Promise((resolve, reject) => {
      let state = 'pending', worker;
      const release = instance => {if (instance) Promise.resolve().then(() => instance.terminate()).catch(() => {});};
      const fail = (cause, timedOut = false) => {
        if (state !== 'pending') return;
        state = 'failed'; clearTimeout(timer); release(worker); worker = null;
        reject(new Error(`OCR setup ${timedOut ? 'timed out' : 'failed'}. Check your connection, then Reload this page and try again.`, {cause}));
      };
      const timer = setTimeout(() => fail(new Error('OCR startup deadline'), true), timeoutMs);
      Promise.resolve().then(() => factory('eng', 1, {...options, errorHandler: error => fail(error)}))
        .then(async instance => {
          if (state === 'failed') {release(instance); return;}
          worker = instance;
          await worker.setParameters({tessedit_pageseg_mode:'11'});
          if (state === 'failed') return;
          state = 'ready'; clearTimeout(timer); resolve(worker);
        }).catch(error => fail(error));
    });
    // Keep a failed startup cached. The dependency may not expose the failed
    // worker for termination; reloading releases it without accumulating retries.
    return startup;
  };
}
