import { callRegistry } from "../registry/callRegistry";
import { jobRegistry } from "../registry/jobRegistry";

const CALL_TTL_MS = 5 * 60 * 1000; // 5 minutes
const JOB_TTL_MS = 15 * 1000;      // 15 seconds

const SWEEP_INTERVAL_MS = 30 * 1000; // 30s

setInterval(() => {
  callRegistry.sweep(CALL_TTL_MS);
  jobRegistry.sweep(JOB_TTL_MS);
}, SWEEP_INTERVAL_MS);
