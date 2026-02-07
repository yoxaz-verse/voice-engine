import { ASRInput, ASRTranscript } from './asrTypes';
import { runWhisperEngine } from './whisperEngine';
import fs from 'fs';
import path from 'path';

/**
 * ASR Worker Logic
 * Handles retries and saves output to disk.
 */
export async function processASRJob(input: ASRInput): Promise<ASRTranscript> {
    let attempts = 0;
    const maxRetries = 1;

    while (attempts <= maxRetries) {
        try {
            const transcript = await runWhisperEngine(input);
            await saveTranscript(input.recordingPath, transcript);
            return transcript;
        } catch (error: any) {
            attempts++;
            console.error(`⚠️ [ASR WORKER] Attempt ${attempts} failed for ${input.callUuid}: ${error.message}`);

            if (attempts > maxRetries || error.code === 'FILE_MISSING' || error.code === 'AUDIO_TOO_SHORT') {
                const failedTranscript: ASRTranscript = {
                    callUuid: input.callUuid,
                    voiceCallId: input.voiceCallId,
                    language: 'unknown',
                    text: '',
                    engine: 'faster-whisper',
                    createdAt: new Date().toISOString(),
                    asrStatus: 'FAILED',
                    asrError: error.message
                };
                await saveTranscript(input.recordingPath, failedTranscript);
                throw error;
            }

            console.log(`🔁 [ASR WORKER] Retrying ${input.callUuid}...`);
        }
    }

    throw new Error("UNREACHABLE_STATE");
}

async function saveTranscript(recordingPath: string, transcript: ASRTranscript) {
    const transcriptPath = recordingPath.replace(/\.[^/.]+$/, "") + ".transcript.json";
    try {
        fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));
        console.log(`📄 [ASR WORKER] Saved transcript to ${transcriptPath}`);
    } catch (e) {
        console.error(`❌ [ASR WORKER] Failed to save transcript file:`, e);
    }
}
