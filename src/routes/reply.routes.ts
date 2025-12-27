
import { Router } from 'express';
import { handleReply } from '../services/replyIngestService';

const router = Router();




router.post('/', async (req, res) => {
    await handleReply(req.body);
    res.json({ success: true });
  });
  

export default router;
