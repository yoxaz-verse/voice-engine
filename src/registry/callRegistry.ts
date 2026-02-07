import { CallRecord, CallState } from "../freeswitch/callState";



const CALL_TTL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  callRegistry.sweep(CALL_TTL_MS);
}, 60 * 1000).unref();
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
      lastActivityAt: Date.now(),
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
    call.lastActivityAt = Date.now();

    if (next === "COMPLETED" || next === "FAILED" || next === "CANCELLED") {
      call.hungupAt = Date.now();
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
      voiceAgentId?: string;
    }
  ) {
    const call = this.calls.get(callUuid);
    if (!call) return;

    call.jobUuid ??= job.jobUuid;
    call.voiceCallId ??= job.voiceCallId;
    call.campaignId ??= job.campaignId;
    call.leadId ??= job.leadId;
    call.voiceAgentId ??= job.voiceAgentId;
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

    call.state = "FAILED";
    call.hungupAt = Date.now();
    this.calls.delete(callUuid);
  }

  /**
   * Safety TTL sweep (Phase 6+ will tune this)
   */
  sweep(ttlMs: number) {
    const now = Date.now();

    for (const [callUuid, call] of this.calls.entries()) {
      // Task 4: Zombie Call Sweeper
      // Removes calls that:
      // - Have no ESL activity for > 5 minutes
      // - Are not ACTIVE (though active calls should have activity)
      const inactiveTime = now - (call.lastActivityAt || call.createdAt);

      const isActuallyStale = inactiveTime > ttlMs;
      const isActive = ["CREATED", "ANSWERED"].includes(call.state);

      if (isActuallyStale) {
        console.warn("🧹 [CALL SWEEPER] Cleaning zombie/stale call", {
          callUuid,
          state: call.state,
          isActive,
          inactiveMinutes: Math.floor(inactiveTime / 60000)
        });
        this.calls.delete(callUuid);
      }

    }
  }

  update(
    callUuid: string,
    patch: Partial<CallRecord>
  ) {
    const call = this.calls.get(callUuid);
    if (!call) return;

    Object.assign(call, patch);
  }

  finalize(callUuid: string, outcome: string) {
    this.update(callUuid, {
      state: (["COMPLETED", "CANCELLED"].includes(outcome) ? outcome : "FAILED") as CallState,
      finalOutcome: outcome,
      hungupAt: Date.now(),
      lastActivityAt: Date.now()
    });
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

  remove(callUuid: string) {
    this.calls.delete(callUuid);
  }

}

export const callRegistry = new CallRegistry();
