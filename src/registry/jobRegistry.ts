 type JobMeta = {
    jobUuid: string;
    voiceCallId: string;
    campaignId: string;
    leadId: string;
    createdAt: number;
};

class JobRegistry {
    private queue: JobMeta[] = [];

    create(jobUuid: string, meta: Omit<JobMeta, 'jobUuid' | 'createdAt'>) {
        this.queue.push({
            jobUuid,
            ...meta,
            createdAt: Date.now(),
        });
    }

    consumeNext(): JobMeta | null {
        return this.queue.shift() || null;
    }

    sweep(ttlMs: number) {
        const now = Date.now();

        this.queue = this.queue.filter(job => {
            if (now - job.createdAt > ttlMs) {
                console.error('[JOB] TTL expired', {
                    job_uuid: job.jobUuid,
                    voice_call_id: job.voiceCallId,
                });
                return false;
            }
            return true;
        });
    }
}

export const jobRegistry = new JobRegistry();
