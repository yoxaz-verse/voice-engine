import { CallState } from '../freeswitch/callState';

type LifecycleEvent =
  | 'CHANNEL_CREATE'
  | 'CHANNEL_ANSWER'
  | 'CHANNEL_HANGUP';

export function reduce(
  current: CallState | undefined,
  eventName: LifecycleEvent
): CallState | null {

  // 🔒 Terminal guard
  if (current === 'HANGUP') {
    return null;
  }

  switch (eventName) {
    case 'CHANNEL_CREATE':
      return current ? null : 'CREATED';

    case 'CHANNEL_ANSWER':
      return current === 'CREATED' ? 'ANSWERED' : null;

    case 'CHANNEL_HANGUP':
      if (current === 'CREATED' || current === 'ANSWERED') return 'HANGUP';
      return null;

    default:
      return null;
  }
}