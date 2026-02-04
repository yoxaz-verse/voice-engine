import dotenv from 'dotenv';
dotenv.config(); // 🔥 MUST BE FIRST


// 🔥 MUST COME FIRST
import './freeswitch/esl';

// 🔥 MUST COME SECOND (event listeners)
import './freeswitch/bootstrap';

// observers AFTER bootstrap
import './observers/logObserver';
import './observers/callslifeCycleObserver';

import './freeswitch/bootstrap';
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
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('[SYS] Shutting down');
  process.exit(0);
}

app.use('/voice', voiceRoutes);

const PORT = process.env.PORT || 3004;

console.log('🔥 INDEX.TS LOADE SUCEESFULLY');
console.log('[ENV]', {
  FS_HOST: process.env.FS_HOST,
  FS_PORT: process.env.FS_PORT,
  FS_PASSWORD: process.env.FS_PASSWORD,
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
