// src/observers/callsLifecycleObserver.ts
import { eventRouter } from '../freeswitch/eventRouter';
import { callRegistry } from '../registry/callRegistry';
import { jobRegistry } from '../registry/jobRegistry';

eventRouter.on('CHANNEL_CREATE', (e) => {
    if (!e.uuid) return;

    const job = jobRegistry.consumeNext();
    if (!job) {
        console.warn('[CALL] No pending job to bind', e.uuid);
        return;
    }

    callRegistry.bindJob(e.uuid, job);

    console.log('[CALL] JOB BOUND', {
        callUuid: e.uuid,
        jobUuid: job.jobUuid,
    });
});
