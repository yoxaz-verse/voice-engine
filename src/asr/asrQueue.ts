import { ASRJob } from './asrTypes';
import { asrRegistry } from './asrRegistry';
import { transcribeAudio } from './whisperClient';

class ASRQueue {
    private queue: string[] = []; // List of callUuids
    private maxConcurrency = Number(process.env.ASR_MAX_CONCURRENCY) || 1;
    private activeCount = 0;

    enqueue(job: ASRJob) {
        asrRegistry.setJob(job.callUuid, job);
        this.queue.push(job.callUuid);
        this.processNext();
    }

    private async processNext() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }

        const callUuid = this.queue.shift()!;
        const job = asrRegistry.getJob(callUuid);

        if (!job) return;

        this.activeCount++;
        job.status = 'processing';

        try {
            const result = await transcribeAudio(job.audioPath, job.callUuid, job.voiceCallId);
            job.status = 'completed';
            asrRegistry.setResult(job.voiceCallId, result);
            console.log(`✅ [ASR QUEUE] JOB COMPLETED: ${job.callUuid}`);
        } catch (error: any) {
            console.error(`❌ [ASR QUEUE] JOB FAILED: ${job.callUuid}`, error);

            if (job.attempts < 1) { // Retry max 1 time as per requirements
                job.attempts++;
                job.status = 'queued';
                this.queue.push(callUuid);
                console.log(`🔁 [ASR QUEUE] RETRYING JOB: ${job.callUuid}`);
            } else {
                job.status = 'failed';
                job.error = error.message;
            }
        } finally {
            this.activeCount--;
            this.processNext();
        }
    }
}

export const asrQueue = new ASRQueue();
