import { ASRResult, ASRJob } from './asrTypes';

class ASRRegistry {
    private results = new Map<string, ASRResult>(); // Key: voiceCallId
    private jobs = new Map<string, ASRJob>();       // Key: callUuid

    setResult(voiceCallId: string, result: ASRResult) {
        this.results.set(voiceCallId, result);
    }

    getResult(voiceCallId: string): ASRResult | undefined {
        return this.results.get(voiceCallId);
    }

    setJob(callUuid: string, job: ASRJob) {
        this.jobs.set(callUuid, job);
    }

    getJob(callUuid: string): ASRJob | undefined {
        return this.jobs.get(callUuid);
    }

    getJobByVoiceCallId(voiceCallId: string): ASRJob | undefined {
        return Array.from(this.jobs.values()).find(j => j.voiceCallId === voiceCallId);
    }
}

export const asrRegistry = new ASRRegistry();
