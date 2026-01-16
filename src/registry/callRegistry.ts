import { CallRecord, CallState } from "../freeswitch/callState";

class CallRegistry {
  private calls = new Map<string, CallRecord>();

  create(uuid: string, variables: Record<string, string>) {
    if (this.calls.has(uuid)) return;

    this.calls.set(uuid, {
      uuid,
      state: 'CREATED',
      createdAt: Date.now(),
      variables,
    });
  }

  updateState(uuid: string, next: CallState) {
    const call = this.calls.get(uuid);
    if (!call) return;

    call.state = next;

    if (next === 'ANSWERED') call.answeredAt = Date.now();
    if (next === 'HANGUP') call.hungupAt = Date.now();

    if (next === 'TERMINATED') {
      this.calls.delete(uuid);
    }
  }

  bindJob(
    uuid: string,
    job: {
      jobUuid: string;
      voiceCallId: string;
      campaignId: string;
      leadId: string;
    }
  ) {
    const call = this.calls.get(uuid);
    if (!call) return;

    call.jobUuid = job.jobUuid;
    call.voiceCallId = job.voiceCallId;
    call.campaignId = job.campaignId;
    call.leadId = job.leadId;
  }

  get(uuid: string) {
    return this.calls.get(uuid);
  }

  // ✅ ADD THIS METHOD (INSIDE CLASS)
  markCorrupt(callUuid: string, reason: string) {
    const call = this.calls.get(callUuid);
    if (!call) return;

    call.state = 'TERMINATED';
    call.hungupAt = Date.now();

    console.error('[CALL] MARKED CORRUPT', {
      callUuid,
      reason,
    });

    // optional immediate cleanup
    this.calls.delete(callUuid);
  }


  sweep(ttlMs: number) {
    const now = Date.now();

    for (const [uuid, call] of this.calls.entries()) {
      // hard TTL cleanup
      if (now - call.createdAt > ttlMs) {
        console.warn('[CALL] TTL EXPIRED', {
          callUuid: uuid,
          state: call.state,
        });

        this.calls.delete(uuid);
      }
    }
  }

}

export const callRegistry = new CallRegistry();
