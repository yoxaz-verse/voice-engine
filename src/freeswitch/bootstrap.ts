import { callRegistry } from "../registry/callRegistry";
import { jobRegistry } from "../registry/jobRegistry";
import { eventRouter } from "./eventRouter";
// just importing observers registers them
import '../observers/callslifeCycleObserver';
import '../observers/lifecycleObserver';

/**
 * -----------------------------------------------------
 * BGAPI JOB COMPLETION
 * -----------------------------------------------------
 * Informational only.
 * ❌ DO NOT mutate registries here.
 * Binding happens at CHANNEL_CREATE.
 */
eventRouter.on('BACKGROUND_JOB', (event) => {
  const jobUuid = event.headers['Job-UUID'];
  if (!jobUuid) return;

  console.log('[BGAPI COMPLETE]', { jobUuid });
});


/**
 * -----------------------------------------------------
 * CHANNEL CREATE
 * -----------------------------------------------------
 * This is the ONLY safe place to bind:
 * Job → Call → Business IDs
 */
eventRouter.on('CHANNEL_CREATE', (event) => {
  if (!event.uuid) return;

  const jobUuid = event.headers['variable_job_uuid'];
  if (!jobUuid) {
    console.warn('[CALL] created without job_uuid', event.uuid);
    return;
  }

  const job = jobRegistry.get(jobUuid);
  if (!job) {
    console.warn('[CALL] no job found for job_uuid', jobUuid);
    return;
  }

  callRegistry.create(event.uuid, event.headers);

  callRegistry.bindJob(event.uuid, {
    jobUuid,
    voiceCallId: job.voiceCallId,
    campaignId: job.campaignId,
    leadId: job.leadId,
  });

  console.log('[CALL CREATED + BOUND]', {
    callUuid: event.uuid,
    jobUuid,
    voiceCallId: job.voiceCallId,
  });

  // optional cleanup
  jobRegistry.remove(jobUuid);
});


/**
 * -----------------------------------------------------
 * CHANNEL ANSWER
 * -----------------------------------------------------
 */
eventRouter.on("CHANNEL_ANSWER", (event) => {
  if (!event.uuid) return;

  callRegistry.updateState(event.uuid, "ANSWERED");

  console.log("[CALL ANSWERED]", {
    callUuid: event.uuid,
  });
});

/**
 * -----------------------------------------------------
 * CHANNEL HANGUP
 * -----------------------------------------------------
 */
eventRouter.on("CHANNEL_HANGUP", (event) => {
  if (!event.uuid) return;

  callRegistry.updateState(event.uuid, "HANGUP");

  console.log("[CALL HANGUP]", {
    callUuid: event.uuid,
    cause: event.headers["Hangup-Cause"],
  });
});
