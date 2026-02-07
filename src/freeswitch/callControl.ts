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
export async function hangupCall(callId: string, cause = 'NORMAL_CLEARING') {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  // Task 2: ESL Reality Guard
  if (!(await esl.exists(callUuid))) {
    const call = callRegistry.get(callUuid);
    console.error('🚨 [ESL DESYNC] Registry active but FS channel gone', {
      callUuid,
      state: call?.state
    });
    throw new Error('CHANNEL_NOT_FOUND');
  }



  esl.api(`uuid_kill ${callUuid} ${cause}`);
}

/**
 * Park call
 */
export async function parkCall(callId: string) {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  if (!(await esl.exists(callUuid))) {
    throw new Error('CHANNEL_NOT_FOUND');
  }

  esl.api(`uuid_park ${callUuid}`);
}

/**
 * Hold call
 */
export async function holdCall(callId: string) {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  if (!(await esl.exists(callUuid))) {
    throw new Error('CHANNEL_NOT_FOUND');
  }

  esl.api(`uuid_hold ${callUuid}`);
}

/**
 * Resume call
 */
export async function resumeCall(callId: string) {
  const esl = getESL();
  const callUuid = resolveCallUuid(callId);

  if (!(await esl.exists(callUuid))) {
    throw new Error('CHANNEL_NOT_FOUND');
  }

  esl.api(`uuid_hold off ${callUuid}`);
}

