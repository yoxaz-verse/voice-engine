import { ASRInput, ASRTranscript } from './asrTypes';
import { asrService } from './asrService';

/**
 * Public ASR Interface (Non-Negotiable)
 */
export async function transcribeAudio(input: ASRInput): Promise<ASRTranscript> {
    console.log(`🛰️ [ASR] DISPATCHING JOB: ${input.voiceCallId}`);

    // Enqueue the job
    asrService.enqueueTranscription(input.callUuid, input.voiceCallId, input.recordingPath);

    // The signature returns a Promise of the result. 
    // Since it's dispatched to a queue, we return a pending object.
    return {
        ...input,
        language: 'unknown',
        text: '',
        engine: 'faster-whisper',
        createdAt: new Date().toISOString(),
        asrStatus: 'PENDING'
    };
}
