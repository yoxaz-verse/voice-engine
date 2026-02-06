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

// startFSSocketServer(Number(process.env.FS_SOCKET_PORT)); // Only for same server

const app = express();
app.use(express.json());
app.use(cors());

app.get('/ping', (_req, res) => {
  console.log('✅ PING HIT');
  res.json({ ok: true });
});

app.use((req, res, next) => {
  console.log('🔥 INCOMING:', req.method, req.url);
  next();
});



app.use('/voice', voiceRoutes);

const PORT = process.env.PORT || 3004;

console.log('🔥 INDEX.TS LOADE SUCEESFULLY');

console.log('[ENV]', {
  FS_HOST: process.env.FS_HOST,
  FS_PORT: process.env.FS_PORT,
  FS_PASSWORD: process.env.FS_PASSWORD,
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


