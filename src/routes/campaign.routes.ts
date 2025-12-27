import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import {
  attachLeadsToCampaign,
  startCampaign,
  pauseCampaign
} from '../services/campaign.domain';

const router = Router();
router.use(requireAuth('operator'));

router.post('/:id/leads/attach', async (req, res) => {
  const { id } = req.params;
  const { lead_ids } = req.body;

  await attachLeadsToCampaign(id, lead_ids);
  res.json({ success: true });
});

router.post('/:id/start', async (req, res) => {
  await startCampaign(req.params.id);
  res.json({ success: true });
});

router.post('/:id/pause', async (req, res) => {
  await pauseCampaign(req.params.id);
  res.json({ success: true });
});

export default router;
