import { Router, Request, Response } from 'express';
import {
  logSendSuccess,
  logSendFailure
} from '../services/sendLogger';
import { getNextSend } from '../services/decisionEngine'
import { handleLeadReply } from '../services/handleReply';

import { requireAuth } from '../middleware/requireAuth';

const router = Router();

/**
 * Decision endpoint (READ-ONLY)
 */

router.use(requireAuth('operator'));


router.get('/next', async (_req: Request, res: Response) => {
  const payload = await getNextSend();
  if (!payload) return res.sendStatus(204);
  res.json(payload);
});

/**
 * Log successful send (WRITE)
 */
router.post('/log', async (req: Request, res: Response) => {
  await logSendSuccess(req.body);
  res.json({ success: true });
});

/**
 * Log failed send (WRITE)
 */
router.post('/fail', async (req: Request, res: Response) => {
  await logSendFailure(req.body);
  res.status(500).json({ success: false });
});

router.post('/reply', async (req: Request, res: Response) => {
  const { from_email, message } = req.body;

  if (!from_email) {
    return res.status(400).json({ error: 'Missing from_email' });
  }

  await handleLeadReply({
    from_email,
    message
  });

  res.json({ success: true });
});

export default router;
