import { asrQueue } from './asrQueue';
import { ASRJob } from './asrTypes';

/**
 * ASR Service
 * Isolated module to handle transcription requests
 */
export const asrService = {
    enqueueTranscription(callUuid: string, voiceCallId: string, audioPath: string) {
        if (process.env.ASR_ENABLED !== 'true') {
            console.log('🚫 [ASR SERVICE] ASR is disabled via config');
            return;
        }

        const job: ASRJob = {
            jobId: `asr_${callUuid}_${Date.now()}`,
            callUuid,
            voiceCallId,
            audioPath,
            status: 'queued',
            attempts: 0,
            createdAt: Date.now()
        };

        console.log(`📥 [ASR SERVICE] ENQUEUING: ${callUuid}`);
        asrQueue.enqueue(job);
    }
};
