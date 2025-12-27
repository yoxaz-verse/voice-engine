import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sendRoutes from './routes/send.routes';
import statsRoutes from './routes/stats.routes';
import adminRoutes from './routes/admin.routes';
import replyRoutes from './routes/reply.routes';
import sequencesRoutes from './routes/sequences.routes';
import operatorRoutes from './routes/operator.routes';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import crudRoutes from './routes/crud.routes';
import campaignRoutes from './routes/campaign.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get('/ping', (_req, res) => {
  console.log('✅ PING HIT');
  res.json({ ok: true });
});
app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/crud', crudRoutes);
app.use('/users', usersRoutes);
app.use('/operator', operatorRoutes);
app.use('/sequences', sequencesRoutes);
app.use('/reply', replyRoutes);
app.use('/send', sendRoutes);
app.use('/stats', statsRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

console.log('🔥 INDEX.TS LOADED');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

