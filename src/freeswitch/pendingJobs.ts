type PendingJob = {
    jobUuid: string;
    voiceCallId: string;
    createdAt: number;
};

class PendingJobRegistry {
    private jobs = new Map<string, PendingJob>();

    add(jobUuid: string, voiceCallId: string) {
        this.jobs.set(jobUuid, {
            jobUuid,
            voiceCallId,
            createdAt: Date.now(),
        });
    }

    findByVoiceCallId(voiceCallId: string) {
        return [...this.jobs.values()].find(
            j => j.voiceCallId === voiceCallId
        );
    }

    remove(jobUuid: string) {
        this.jobs.delete(jobUuid);
    }
}

export const pendingJobRegistry = new PendingJobRegistry();
