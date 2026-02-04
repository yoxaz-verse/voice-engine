export type CallState =
    | "CREATED"
    | "ANSWERED"
    | "HANGUP"
    | "TERMINATED";

export interface CallRecord {
    /** Logical call UUID (variable_call_uuid) */
    callUuid: string;

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
}
