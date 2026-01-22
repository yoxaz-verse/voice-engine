
import { Router } from 'express';
import { originateCall } from '../freeswitch/callController';
import { getESL } from '../freeswitch/esl';
import { callRegistry } from '../registry/callRegistry';

const router = Router();

router.post('/start', async (req, res) => {
  const { phoneNumber, campaignId, leadId, voiceCallId } = req.body;

  if (!phoneNumber || !campaignId || !leadId || !voiceCallId) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const jobUuid = await originateCall({
      phoneNumber,
      campaignId,
      leadId,
      voiceCallId,
    });

    res.json({
      ok: true,
      status: 'queued',
      jobUuid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Originate failed' });
  }
});


router.get('/:uuid/status', (req, res) => {
  const call = callRegistry.get(req.params.uuid);

  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }

  res.json(call);
});




router.post('/test-esl', (_req, res) => {
  let esl;

  try {
    esl = getESL();
  } catch (e) {
    return res.status(503).json({
      ok: false,
      error: 'ESL_NOT_READY',
      message: String(e),
    });
  }

  const cmd = 'status';

  esl.api(cmd, (response) => {
    const body = response.getBody();

    console.log('[TEST] ESL reply:', body);

    res.json({
      ok: true,
      reply: body,
    });
  });
});


export default router;



