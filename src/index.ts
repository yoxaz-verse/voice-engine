// src/index.ts
import dotenv from "dotenv";
dotenv.config();
console.log('[INDEX] START');
import { shutdownESL } from './freeswitch/esl';

// 1️⃣ eventRouter FIRST (no listeners yet, just singleton)
import './freeswitch/eventRouter';

// 2️⃣ bootstrap SECOND (registers observers)
import './freeswitch/bootstrap';

// 3️⃣ ESL THIRD (connects + emits events)
import { connectESL } from './freeswitch/esl';
connectESL();

// 4️⃣ HTTP LAST
import express from 'express';
import cors from 'cors';
import voiceRoutes from './routes/voice.routes';
import { requireVoiceEngineSecret } from './middleware/serviceAuth';

// startFSSocketServer(Number(process.env.FS_SOCKET_PORT)); // Only for same server

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use(cors({
  origin: String(process.env.ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean),
  credentials: false,
}));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/ping', (_req, res) => {
  console.log('✅ PING HIT');
  res.json({ ok: true });
});

app.use((req, res, next) => {
  console.log('🔥 INCOMING:', req.method, req.url);
  next();
});



app.use('/voice', requireVoiceEngineSecret, voiceRoutes);

const PORT = process.env.PORT || 3004;

console.log('🔥 INDEX.TS LOADE SUCEESFULLY');

console.log('[ENV]', {
  FS_HOST: process.env.FS_HOST,
  FS_PORT: process.env.FS_PORT,
  FS_PASSWORD_CONFIGURED: Boolean(process.env.FS_PASSWORD),
  VOICE_ENGINE_SECRET_CONFIGURED: Boolean(process.env.VOICE_ENGINE_SECRET),
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown(signal: string) {
  console.log(`\n[SYS] Received ${signal}, exiting...`);
  try {
    shutdownESL();

    // Close server but don't wait forever if there are active connections
    server.close();

    console.log('[SYS] Goodbye!');
    process.exit(0);
  } catch (e) {
    console.error('[SYS] Error during shutdown', e);
    process.exit(1);
  }
}

// Ensure signals are handled only once
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

