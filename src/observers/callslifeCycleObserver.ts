// src/observers/callslifeCycleObserver.ts
import { eventRouter } from '../freeswitch/eventRouter';
import { startRecording, stopRecording } from '../freeswitch/recording';
import { pullRecordingFromFS } from '../freeswitch/recordingTransfer';
import { callRegistry } from '../registry/callRegistry';
import { jobRegistry } from '../registry/jobRegistry';
import { CallState } from '../freeswitch/callState';

/**
 * Map FreeSWITCH hangup cause to CallState
 */
function mapHangupCause(headers: Record<string, string>): CallState {
    const cause = headers['Hangup-Cause'] || headers['variable_hangup_cause'];

    switch (cause) {
        case 'NORMAL_CLEARING':
            return 'COMPLETED';
        case 'ORIGINATOR_CANCEL':
            return 'CANCELLED';
        case 'NO_ANSWER':
        case 'NO_USER_RESPONSE':
            return 'FAILED';
        default:
            return 'FAILED';
    }
}

/**
 * Resolve A-leg UUID from any event UUID
 */
function resolveALegUuid(eventUuid: string): string | undefined {
    if (callRegistry.has(eventUuid)) {
        return eventUuid;
    }
    const call = callRegistry.findByLegUuid(eventUuid);
    if (call) {
        return call.callUuid;
    }
    return undefined;
}

/**
 * 1️⃣ CHANNEL_CREATE
 * Create logical call ONLY on A-leg.
 */
eventRouter.on('CHANNEL_CREATE', (e) => {
    if (!e.uuid) return;

    const callUuid = e.headers['variable_call_uuid'];
    const leg = e.headers['variable_loopback_leg']; // A or B

    if (!callUuid) return;

    // ✅ A-LEG → create logical call
    if (leg === 'A') {
        if (!callRegistry.has(callUuid)) {
            callRegistry.create(callUuid, e.headers);
            console.log('📦 [ESL] CALL CREATED (A-LEG)', callUuid);
        }
    }

    // 🔗 B-LEG → link only
    if (leg === 'B') {
        callRegistry.linkBLeg(callUuid, e.uuid);
        console.log('🔗 [ESL] B-LEG LINKED', { callUuid, bLegUuid: e.uuid });
    }

    // 🔁 Bind job if present
    const jobUuid = e.headers['variable_job_uuid'] || e.headers['Job-UUID'];
    if (jobUuid) {
        const job = jobRegistry.get(jobUuid);
        if (job) {
            callRegistry.bindJob(callUuid, {
                jobUuid,
                voiceCallId: job.voiceCallId,
                campaignId: job.campaignId,
                leadId: job.leadId,
            });
            console.log('✅ [ESL] CALL BOUND TO JOB', { callUuid, jobUuid });
        }
    }
});

/**
 * 2️⃣ CHANNEL_ANSWER
 */
eventRouter.on('CHANNEL_ANSWER', (e) => {
    if (!e.uuid) return;
    const callUuid = resolveALegUuid(e.uuid);
    if (!callUuid) return;

    const call = callRegistry.get(callUuid);
    if (!call || call.state === 'ANSWERED') return;

    // Optional: Start recording if not already started
    if (!call.recordingPath) {
        const recordingPath = startRecording(callUuid, call.voiceCallId ?? callUuid);
        callRegistry.update(callUuid, { recordingPath });
        console.log('🎙️ [ESL] RECORDING STARTED', { callUuid, recordingPath });
    }

    callRegistry.updateState(callUuid, 'ANSWERED');
    console.log('📞 [ESL] CALL ANSWERED', callUuid);
});

/**
 * 3️⃣ CHANNEL_HANGUP (MAIN FINALIZATION POINT)
 */
eventRouter.on('CHANNEL_HANGUP', (e) => {
    if (!e.uuid) return;
    const callUuid = resolveALegUuid(e.uuid);
    if (!callUuid) return;

    const call = callRegistry.get(callUuid);
    if (!call) return;

    // Ignore if already finalized (e.g. from other leg event)
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(call.state)) return;

    console.log('🔴 [ESL] CHANNEL_HANGUP RECEIVED', { callUuid, cause: e.headers['Hangup-Cause'] });

    // 🛑 STOP RECORDING (Gaurded by idempotency)
    if (call.recordingPath && !call.recordingStopped) {
        stopRecording(callUuid);
        callRegistry.update(callUuid, { recordingStopped: true });

        pullRecordingFromFS(
            process.env.FS_HOST!,
            call.recordingPath,
            call.voiceCallId ?? callUuid!
        );
    }


    const finalState = mapHangupCause(e.headers);
    callRegistry.finalize(callUuid, finalState);
    console.log(`🏁 [ESL] CALL FINALIZED: ${finalState}`, callUuid);

    // 4️⃣ DELAYED CLEANUP (30 SECONDS)
    console.log('🧹 [ESL] SCHEDULED CLEANUP IN 30S', callUuid);
    setTimeout(() => {
        callRegistry.remove(callUuid);
        console.log('🗑️ [ESL] CALL REMOVED FROM REGISTRY', callUuid);
    }, 30_000).unref();
});

/**
 * 5️⃣ CHANNEL_DESTROY
 */
eventRouter.on("CHANNEL_DESTROY", (e) => {
    if (!e.uuid) return;
    const callUuid = resolveALegUuid(e.uuid);
    if (!callUuid) return;

    const call = callRegistry.get(callUuid);
    if (!call) return;

    console.log('ℹ️ [ESL] CHANNEL_DESTROY LOGGED', { callUuid, state: call.state });
});

