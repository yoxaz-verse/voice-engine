import test from 'node:test';
import assert from 'node:assert/strict';
import { requireVoiceEngineSecret } from './serviceAuth';

function invoke(authorization?: string) {
  let status = 200;
  let payload: unknown;
  let nextCalled = false;
  const req = { headers: { authorization } } as never;
  const res = {
    status(code: number) { status = code; return this; },
    json(value: unknown) { payload = value; return this; },
  } as never;
  requireVoiceEngineSecret(req, res, () => { nextCalled = true; });
  return { status, payload, nextCalled };
}

test('fails closed when the voice secret is missing', () => {
  const previous = process.env.VOICE_ENGINE_SECRET;
  delete process.env.VOICE_ENGINE_SECRET;
  assert.equal(invoke().status, 503);
  if (previous) process.env.VOICE_ENGINE_SECRET = previous;
});

test('rejects invalid credentials and accepts the configured bearer secret', () => {
  process.env.VOICE_ENGINE_SECRET = 'test-voice-secret';
  assert.equal(invoke('Bearer wrong').status, 401);
  assert.equal(invoke('Bearer test-voice-secret').nextCalled, true);
});
