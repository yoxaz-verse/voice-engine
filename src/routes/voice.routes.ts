
import { Router } from 'express';
import { getESL } from '../freeswitch/esl';
import { callRegistry } from '../registry/callRegistry';
import { originateCall } from '../freeswitch/originate';
import { jobRegistry } from '../registry/jobRegistry';
import {
  hangupCall,
  parkCall,
  holdCall,
  resumeCall,
} from '../freeswitch/callControl';

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


router.get('/:voiceCallId/status', (req, res) => {
  const call = callRegistry.getByVoiceCallId(req.params.voiceCallId);
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }

  // Normalize response
  const response = {
    callUuid: call.callUuid,
    voiceCallId: call.voiceCallId,
    state: call.state,
    recordingPath: call.recordingPath,
    createdAt: call.createdAt,
    hungupAt: call.hungupAt,
    finalOutcome: call.finalOutcome,
  };

  res.json(response);
});


/**
 * --------------------------------------------------
 * DEBUG: List all active calls
 * --------------------------------------------------
 */
router.get('/_debug/calls', (_req, res) => {
  console.log("🌐 HTTP served by PID", process.pid);
  const calls = callRegistry.list();
  res.json({ count: calls.length, calls });
});

/**
 * --------------------------------------------------
 * DEBUG: List all pending jobs
 * --------------------------------------------------
 */
router.get('/_debug/jobs', (_req, res) => {
  const jobs = jobRegistry.list();

  res.json({
    count: jobs.length,
    jobs,
  });
});

router.post('/:voiceCallId/hangup', (req, res) => {
  try {
    hangupCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/:voiceCallId/park', (req, res) => {
  try {
    parkCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/:voiceCallId/hold', (req, res) => {
  try {
    holdCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/:voiceCallId/resume', (req, res) => {
  try {
    resumeCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

export default router;




