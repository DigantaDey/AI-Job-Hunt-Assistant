// Runs once when the Node server boots (App Router instrumentation).
// Starts the continuous-mode queue worker. The scheduler is non-blocking and
// only advances jobs in permitted autonomy modes.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/scheduler/worker");
    startScheduler();
  }
}
