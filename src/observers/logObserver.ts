// src/observers/logObserver.ts
import { eventRouter } from '../freeswitch/eventRouter';

eventRouter.on('CHANNEL_CREATE', (e) => {
    console.log('[EVT] CHANNEL_CREATE', e.uuid);
});

eventRouter.on('CHANNEL_ANSWER', (e) => {
    console.log('[EVT] CHANNEL_ANSWER', e.uuid);
});

eventRouter.on('CHANNEL_HANGUP', (e) => {
    console.log('[EVT] CHANNEL_HANGUP', e.uuid);
});
