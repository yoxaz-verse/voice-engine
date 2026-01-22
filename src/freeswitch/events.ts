import ESL from 'modesl';

export async function registerFSEvents(
  esl: InstanceType<typeof ESL.Connection>
) {
    console.log('[FS] Registering events');

    // REQUIRED FIRST
    esl.events('plain', 'ALL');

    console.log('[FS] Event subscription sent');

    esl.on('event::plain::*', (evt: any) => {
        const eventName = evt.getHeader('Event-Name');
        if (!eventName) return;

        if (eventName.startsWith('CHANNEL_')) {
            console.log(`[FS EVENT] ${eventName}`);
        }
    });
}
