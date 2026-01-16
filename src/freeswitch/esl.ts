import dotenv from 'dotenv';
dotenv.config();

import ESL from 'modesl';
import { eslState } from './eslState';
import { registerFSEvents } from './events';

const FS_HOST = process.env.FS_HOST!;
const FS_PORT = Number(process.env.FS_PORT!);
const FS_PASSWORD = process.env.FS_PASSWORD!;

let esl: InstanceType<typeof ESL.Connection> | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;

const MAX_BACKOFF = 30_000; // 30s cap

function backoffDelay(attempt: number) {
    return Math.min(1000 * 2 ** attempt, MAX_BACKOFF);
}

export function connectESL() {
    if (eslState.current === 'connecting' || eslState.current === 'ready') {
        return;
    }

    eslState.current = 'connecting';
    reconnectAttempts++;

    console.log(`[FS] Connecting ESL (attempt ${reconnectAttempts})`);

    esl = new ESL.Connection(FS_HOST, FS_PORT, FS_PASSWORD);

esl.on('esl::ready', async () => {
    console.log('[FS] ESL socket connected');
    eslState.current = 'connected';

    try {
        // ✅ pass raw ESL connection
        await registerFSEvents(esl!);

        eslState.current = 'ready';
        reconnectAttempts = 0;
        console.log('[FS] ESL fully ready');
    } catch (err) {
        console.error('[FS] Event registration failed', err);
        eslState.current = 'error';
        scheduleReconnect();
    }
});


    esl.on('esl::end', () => {
        console.error('[FS] ESL disconnected');
        scheduleReconnect();
    });

    esl.on('error', (err: unknown) => {
        console.error('[FS] ESL error', err);
        scheduleReconnect();
    });
}

function scheduleReconnect() {
    if (
        eslState.current === 'connecting' ||
        eslState.current === 'idle'
    ) {
        return;
    }

    eslState.current = 'disconnected';

    if (reconnectTimer) return;

    const delay = backoffDelay(reconnectAttempts);

    console.log(`[FS] Reconnecting ESL in ${delay}ms`);

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectESL();
    }, delay);
}

export function getESL() {
   if (!esl || eslState.current !== 'ready') {
    throw new Error(`ESL_NOT_READY (state=${eslState.current})`);
}

    return esl;
}

// INITIAL CONNECT (single entry point)
connectESL();
