
import { Router } from 'express';
import { listActiveSequences } from '../services/sequenceService';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();


router.use(requireAuth('operator'));


router.get('/', async (_req, res) => {
  const sequences = await listActiveSequences();
  res.json(sequences);
});

export default router;
