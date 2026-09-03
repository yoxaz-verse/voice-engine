import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export function requireVoiceEngineSecret(req: Request, res: Response, next: NextFunction) {
  const expected = String(process.env.VOICE_ENGINE_SECRET ?? '').trim();
  const provided = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!expected) return res.status(503).json({ error: 'VOICE_ENGINE_SECRET is not configured' });
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (!provided || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized voice-engine request' });
  }
  next();
}
