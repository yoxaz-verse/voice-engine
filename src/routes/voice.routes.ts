
import { Router } from 'express';
import { getESL } from '../freeswitch/esl';
import { callRegistry } from '../registry/callRegistry';
import { originateCall } from '../freeswitch/originate';
import { jobRegistry } from '../registry/jobRegistry';
import fs from 'fs';
import path from 'path';

import {
  hangupCall,
  parkCall,
  holdCall,
  resumeCall,
} from '../freeswitch/callControl';

const router = Router();

router.post('/start', async (req, res) => {
  const { phoneNumber, campaignId, leadId, voiceCallId, voiceAgentId } = req.body;

  if (!phoneNumber || !campaignId || !leadId || !voiceCallId || !voiceAgentId) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const jobUuid = await originateCall({
      phoneNumber,
      campaignId,
      leadId,
      voiceCallId,
      voiceAgentId,
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
    voiceAgentId: call.voiceAgentId,
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

router.post('/:voiceCallId/hangup', async (req, res) => {
  try {
    await hangupCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' || e.message === 'CHANNEL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/:voiceCallId/park', async (req, res) => {
  try {
    await parkCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' || e.message === 'CHANNEL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/:voiceCallId/hold', async (req, res) => {
  try {
    await holdCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' || e.message === 'CHANNEL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/:voiceCallId/resume', async (req, res) => {
  try {
    await resumeCall(req.params.voiceCallId);
    res.json({ ok: true });
  } catch (e: any) {
    const status = e.message === 'CALL_NOT_FOUND' || e.message === 'CHANNEL_NOT_FOUND' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
});

import { asrRegistry } from '../asr/asrRegistry';

// --- ASR ENDPOINTS (TASK 5) ---

router.get('/:voiceCallId/transcript', (req, res) => {
  const { voiceCallId } = req.params;

  // 1. Check Registry (Live)
  const result = asrRegistry.getResult(voiceCallId);
  if (result) {
    return res.json(result);
  }

  // 2. Check Disk (Persistence)
  const recordingDir = process.env.RECORDING_DIR || path.join(process.cwd(), 'recordings');
  const transcriptPath = path.join(recordingDir, `${voiceCallId}.transcript.json`);

  if (!fs.existsSync(transcriptPath)) {
    return res.status(404).json({ error: 'TRANSCRIPT_NOT_FOUND_OR_NOT_READY' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'FAILED_TO_READ_TRANSCRIPT' });
  }
});

router.get('/:voiceCallId/asr-status', (req, res) => {
  const { voiceCallId } = req.params;

  // 1. Check Registry (Live Job)
  const job = asrRegistry.getJobByVoiceCallId(voiceCallId);
  if (job) {
    return res.json({
      status: job.status,
      attempts: job.attempts,
      error: job.error
    });
  }

  // 2. Check Disk (Completed File)
  const recordingDir = process.env.RECORDING_DIR || path.join(process.cwd(), 'recordings');
  const transcriptPath = path.join(recordingDir, `${voiceCallId}.transcript.json`);

  if (fs.existsSync(transcriptPath)) {
    return res.json({ status: 'completed', attempts: 1 });
  }

  // 3. Check Call Registry (Pending)
  const call = callRegistry.getByVoiceCallId(voiceCallId);
  if (call) {
    return res.json({ status: 'PENDING', message: 'Call is active or recently ended' });
  }

  res.status(404).json({ error: 'ASR_JOB_NOT_FOUND' });
});





export default router;




