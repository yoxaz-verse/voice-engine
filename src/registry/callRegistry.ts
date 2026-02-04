import { CallRecord, CallState } from "../freeswitch/callState";

class CallRegistry {
  // KEY = call_uuid (variable_call_uuid)
  private calls = new Map<string, CallRecord>();

  list() {
    console.log("📋 [REGISTRY LIST]", this.calls.size);
    return Array.from(this.calls.values());
  }

  has(callUuid: string): boolean {
    return this.calls.has(callUuid);
  }

  get(callUuid: string) {
    return this.calls.get(callUuid);
  }

  
  /**
   * Create logical call record (A-leg only)
   */
  create(callUuid: string, variables: Record<string, string> = {}) {
    if (this.calls.has(callUuid)) return;

    console.log("📦 [CALL CREATE]", callUuid);

    this.calls.set(callUuid, {
      callUuid,
      state: "CREATED",
      createdAt: Date.now(),
      variables,
    });
  }

  /**
   * Deterministic state transition
   * Only valid for A-leg lifecycle
   */
  updateState(callUuid: string, next: CallState) {
    const call = this.calls.get(callUuid);
    if (!call) {
      console.warn("⚠️ [STATE UPDATE — CALL NOT FOUND]", callUuid);
      return;
    }

    if (call.state === next) return;

    console.log("🔄 [CALL STATE]", {
      callUuid,
      from: call.state,
      to: next,
    });

    call.state = next;

    if (next === "TERMINATED") {
      call.hungupAt = Date.now();
      console.log("🧹 [CALL CLEANUP]", callUuid);
      this.calls.delete(callUuid);
    }
  }

  /**
   * Bind job + campaign metadata
   * Safe to call multiple times
   */
  bindJob(
    callUuid: string,
    job: {
      jobUuid: string;
      voiceCallId?: string;
      campaignId?: string;
      leadId?: string;
    }
  ) {
    const call = this.calls.get(callUuid);
    if (!call) return;

    call.jobUuid ??= job.jobUuid;
    call.voiceCallId ??= job.voiceCallId;
    call.campaignId ??= job.campaignId;
    call.leadId ??= job.leadId;
  }

  /**
   * Link loopback B-leg UUID to A-leg call
   */
  linkBLeg(callUuid: string, bLegUuid: string) {
    const call = this.calls.get(callUuid);
    if (!call) return;

    if (!call.bLegUuid) {
      call.bLegUuid = bLegUuid;
      console.log("🔗 [B-LEG LINKED]", {
        callUuid,
        bLegUuid,
      });
    }
  }

  /**
   * Lookup helper if event arrives for B-leg UUID
   */
  findByLegUuid(uuid: string) {
    for (const call of this.calls.values()) {
      if (call.bLegUuid === uuid) return call;
    }
    return undefined;
  }

  /**
   * Corruption / invariant violation handler
   */
  markCorrupt(callUuid: string, reason: string) {
    const call = this.calls.get(callUuid);
    if (!call) return;

    console.error("🚨 [CALL CORRUPT]", {
      callUuid,
      reason,
      state: call.state,
    });

    call.state = "TERMINATED";
    call.hungupAt = Date.now();
    this.calls.delete(callUuid);
  }

  /**
   * Safety TTL sweep (Phase 6+ will tune this)
   */
  sweep(ttlMs: number) {
    const now = Date.now();

    for (const [callUuid, call] of this.calls.entries()) {
      if (now - call.createdAt > ttlMs) {
        console.warn("⏱️ [CALL TTL EXPIRED]", {
          callUuid,
          state: call.state,
        });
        this.calls.delete(callUuid);
      }
    }
  }

  /**
   * Business lookup helper
   */
  getByVoiceCallId(voiceCallId: string) {
    for (const call of this.calls.values()) {
      if (call.voiceCallId === voiceCallId) return call;
    }
    return undefined;
  }
}

export const callRegistry = new CallRegistry();
