// src/observers/lifecycleObserver.ts
import { eventRouter } from '../freeswitch/eventRouter';
import { reduce } from '../reducers/lifecycleReducer';
import { callRegistry } from '../registry/callRegistry';
import { jobRegistry } from '../registry/jobRegistry';


eventRouter.on('CHANNEL_CREATE', (e) => {
    if (!e.uuid) return;

    const jobUuid =
        e.headers['variable_job_uuid'] ||
        e.headers['Job-UUID'];

    if (!jobUuid) {
        console.warn('[CALL] CREATED WITHOUT job_uuid', e.uuid);
        return;
    }

    const job = jobRegistry.get(jobUuid);
    if (!job) {
        console.warn('[CALL] No job found for job_uuid', jobUuid);
        return;
    }

    callRegistry.create(e.uuid, e.headers);

    callRegistry.bindJob(e.uuid, {
        jobUuid,
        voiceCallId: job.voiceCallId,
        campaignId: job.campaignId,
        leadId: job.leadId,
    });

    console.log('[CALL CREATED + BOUND]', {
        callUuid: e.uuid,
        jobUuid,
        voiceCallId: job.voiceCallId,
    });
});



eventRouter.on('CHANNEL_ANSWER', (e) => {
    if (!e.uuid) return;

    const call = callRegistry.get(e.uuid);
    const next = reduce(call?.state, 'CHANNEL_ANSWER');

    if (!next) {
        callRegistry.markCorrupt(e.uuid, 'INVALID_ANSWER_SEQUENCE');
        return;
    }

    callRegistry.updateState(e.uuid, next);
    console.log('[CALL] ANSWERED', e.uuid);
});

eventRouter.on('CHANNEL_HANGUP', (e) => {
    if (!e.uuid) return;

    const call = callRegistry.get(e.uuid);
    const next = reduce(call?.state, 'CHANNEL_HANGUP');
    if (!next) return;

    callRegistry.updateState(e.uuid, next);
    console.log('[CALL] TERMINATED', e.uuid);
});
