import { getESL } from './esl';
import { callRegistry } from '../registry/callRegistry';

/**
 * Resolve A-leg UUID safely
 */
function resolveCallUuid(input: string): string {
  let call =
    callRegistry.get(input) ||
    callRegistry.findByLegUuid(input) ||
    callRegistry.getByVoiceCallId(input);

  if (!call) {
    throw new Error('CALL_NOT_FOUND');
  }

  // 🔥 CRITICAL GUARD: Prevent actions on finalized calls
  if (
    call.state === 'COMPLETED' ||
    call.state === 'FAILED' ||
    call.state === 'CANCELLED'
  ) {
    throw new Error('CALL_NOT_ACTIVE');
  }

  return call.callUuid;
}



/**
 * Hangup call
 */
export function hangupCall(callId: string, cause = 'NORMAL_CLEARING') {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  esl.api(`uuid_kill ${callUuid} ${cause}`);
}

/**
 * Park call
 */
export function parkCall(callId: string) {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  esl.api(`uuid_park ${callUuid}`);
}

/**
 * Hold call
 */
export function holdCall(callId: string) {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  esl.api(`uuid_hold ${callUuid}`);
}

/**
 * Resume call
 */
export function resumeCall(callId: string) {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  esl.api(`uuid_hold off ${callUuid}`);
}
