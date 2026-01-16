import ESL from 'modesl';
import { eventRouter } from './eventRouter';

const EVENTS = [
    'CHANNEL_CREATE',
    'CHANNEL_ANSWER',
    'CHANNEL_HANGUP_COMPLETE',
].join(' ');

export function registerFSEvents(
    esl: InstanceType<typeof ESL.Connection>
) {
    esl.events('plain', EVENTS);

    esl.on('event', (event: any) => {
        const name = event.getHeader('Event-Name');
        const uuid = event.getHeader('Unique-ID');

        if (!name || !uuid) return;

        eventRouter.emit({
            name,
            uuid,
            headers: event.headers || {},
        });
    });

    console.log('[FS] Event subscription active');
}
