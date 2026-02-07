type JobMeta = {
  jobUuid: string;
  voiceCallId: string;
  campaignId: string;
  leadId: string;
  voiceAgentId: string;
  createdAt: number;
};


class JobRegistry {
  private jobs = new Map<string, JobMeta>();

  create(jobUuid: string, meta: Omit<JobMeta, 'jobUuid' | 'createdAt'>) {
    this.jobs.set(jobUuid, {
      jobUuid,
      ...meta,
      createdAt: Date.now(),
    });
  }

  get(jobUuid: string) {
    return this.jobs.get(jobUuid);
  }

  remove(jobUuid: string) {
    this.jobs.delete(jobUuid);
  }

  list() {
    return [...this.jobs.values()];
  }
}


export const jobRegistry = new JobRegistry();
