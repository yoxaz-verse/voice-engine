import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import {
  getNextExecutionLeads,
  markStepSuccess,
  markStepFailure,
  handleBounce,
} from '../services/execution.service';
import { advanceInboxWarmup } from '../services/webhook/warmup.service';

const router = Router();

router.use(requireAuth('operator'));

/**
 * GLOBAL EXECUTION PICKUP
 */
router.post('/execution/next', async (req, res) => {
  const batchSize = req.body.batch_size ?? 10;
  const leads = await getNextExecutionLeads(batchSize);
  res.json({ leads });
});

/**
 * STEP SUCCESS
 */
router.post('/execution/:id/success', async (req, res) => {
  await markStepSuccess(req.params.id);
  res.json({ success: true });
});

/**
 * STEP FAILURE
 */
router.post('/execution/:id/failure', async (req, res) => {
  await markStepFailure(req.params.id);
  res.json({ success: true });
});

router.post('/execution/bounce', async (req, res) => {
    const { email, type, reason } = req.body;
  
    if (!email || !type) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
  
    await handleBounce(email, type, reason);
    res.json({ success: true });
  });
  
  

  

export default router;
