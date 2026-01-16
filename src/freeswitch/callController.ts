import { jobRegistry } from '../registry/jobRegistry';
import { getESL } from './esl';

type OriginateInput = {
    phoneNumber: string;
    campaignId: string;
    leadId: string;
    voiceCallId: string;
};

export function originateCall({
    phoneNumber,
    campaignId,
    leadId,
    voiceCallId,
}: OriginateInput): Promise<string> {
    const esl = getESL();

    const cmd =
        'bgapi originate ' +
        `{ignore_early_media=true,` +
        `campaign_id=${campaignId},` +
        `lead_id=${leadId},` +
        `voice_call_id=${voiceCallId}} ` +
        `loopback/1000/default ` +
        `&playback(/usr/share/freeswitch/sounds/en/us/callie/ivr/8000/ivr-welcome.wav)`;

    console.log('📞 BGAPI CMD =>', cmd);

    return new Promise((resolve, reject) => {
        esl.api(cmd, (res) => {
            const body = res.getBody();
            console.log('[FS] BGAPI response:', body);

            const match = body.match(/Job-UUID:\s*([a-f0-9-]+)/i);
            if (!match) {
                return reject(new Error('Job-UUID not found'));
            }

            const jobUuid = match[1];

            // ✅ REQUIRED LINK
            jobRegistry.create(jobUuid, {
                voiceCallId,
                campaignId,
                leadId,
            });

            resolve(jobUuid);
        });
    });
}
