export type CallState =
    | "CREATED"
    | "ANSWERED"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";


export interface CallRecord {
    /** Logical call UUID (variable_call_uuid) */
    callUuid: string;
    recordingPath?: string;

    /** Whether recording has been explicitly stopped */
    recordingStopped?: boolean;

    /** Current lifecycle state */
    state: CallState;

    /** When the call record was created */
    createdAt: number;

    /** When hangup occurred (if applicable) */
    hungupAt?: number;

    /** Job correlation */
    jobUuid?: string;

    /** Business identifiers */
    voiceCallId?: string;
    campaignId?: string;
    leadId?: string;

    /** Loopback metadata */
    bLegUuid?: string;

    /** Optional FreeSWITCH variables */
    variables?: Record<string, string>;
    finalOutcome?: string;
}
