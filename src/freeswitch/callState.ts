export type CallState =
    | 'INIT'
    | 'CREATED'
    | 'ANSWERED'
    | 'HANGUP'
    | 'TERMINATED';

export type CallRecord = {
    uuid: string;
    state: CallState;
    createdAt: number;
    answeredAt?: number;
    hungupAt?: number;
    variables: Record<string, string>;

    // 🔥 ADD THESE
    jobUuid?: string;
    voiceCallId?: string;
    campaignId?: string;
    leadId?: string;
};
