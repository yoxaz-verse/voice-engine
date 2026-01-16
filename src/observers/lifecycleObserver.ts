// src/observers/lifecycleObserver.ts
import { eventRouter } from '../freeswitch/eventRouter';
import { reduce } from '../reducers/lifecycleReducer';
import { callRegistry } from '../registry/callRegistry';

eventRouter.on('CHANNEL_CREATE', (e) => {
    if (!e.uuid) return;

    callRegistry.create(e.uuid, e.headers);
    console.log('[CALL] CREATED', e.uuid);
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
    // callRegistry.terminate(e.uuid); // if present
    console.log('[CALL] TERMINATED', e.uuid);
});
