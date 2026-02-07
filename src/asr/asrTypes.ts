export type ASRStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ASRSegment {
    start: number;
    end: number;
    text: string;
    confidence?: number;
}

export interface ASRResult {
    voiceCallId: string;
    callUuid: string;
    transcript: string;
    segments: ASRSegment[];
    language: string;
    confidence?: number;
    completedAt: number;
}

export interface ASRJob {
    jobId: string;
    callUuid: string;
    voiceCallId: string;
    audioPath: string;
    status: ASRStatus;
    attempts: number;
    error?: string;
    createdAt: number;
}

export interface ASRError {
    code: 'FILE_MISSING' | 'AUDIO_TOO_SHORT' | 'ENGINE_CRASH' | 'UNKNOWN';
    message: string;
}

export interface ASRTranscript {
    callUuid: string;
    voiceCallId: string;
    language: string;
    text: string;
    engine: string;
    createdAt: string;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
    asrStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
    asrError?: string;
}

export interface ASRInput {
    callUuid: string;
    voiceCallId: string;
    recordingPath: string;
}
