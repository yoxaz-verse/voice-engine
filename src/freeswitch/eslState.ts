export type ESLState =
    | 'idle'
    | 'connecting'
    | 'connected'   // socket ready
    | 'ready'       // events subscribed + safe
    | 'disconnected'
    | 'error';

export const eslState = {
    current: 'idle' as ESLState,
};
