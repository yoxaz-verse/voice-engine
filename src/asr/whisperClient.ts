import { ASRResult } from './asrTypes';
import { runWhisperEngine } from './whisperEngine';

/**
 * Whisper client
 */
export async function transcribeAudio(
    audioPath: string,
    callUuid: string,
    voiceCallId: string
): Promise<ASRResult> {
    console.log(`🤖 [WHISPER] TRANSCRIBING: ${audioPath}`);

    // Call the Faster-Whisper engine logic
    const transcript = await runWhisperEngine({
        callUuid,
        voiceCallId,
        recordingPath: audioPath
    });

    // Map back to ASRResult for the queue/registry
    return {
        voiceCallId,
        callUuid,
        transcript: transcript.text,
        segments: transcript.segments?.map(s => ({ ...s, confidence: 1 })) || [],
        language: transcript.language,
        confidence: 1,
        completedAt: Date.now()
    };
}
