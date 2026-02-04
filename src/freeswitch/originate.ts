import { v4 as uuidv4 } from "uuid";
import { getESL } from "./eslClient";
import { jobRegistry } from "../registry/jobRegistry";

export function originateCall({
    phoneNumber, // currently unused, ok for now
    voiceCallId,
    campaignId,
    leadId,
}: {
    phoneNumber: string;
    voiceCallId: string;
    campaignId: string;
    leadId: string;
}) {
    const esl = getESL();

    const jobUuid = uuidv4();
    const callUuid = uuidv4();

    const vars = [
        `origination_uuid=${callUuid}`,
        `job_uuid=${jobUuid}`,
        `voice_call_id=${voiceCallId}`,
        `campaign_id=${campaignId}`,
        `lead_id=${leadId}`,
        `ignore_early_media=true`,
        `originate_timeout=30`,
        `export_vars=job_uuid,voice_call_id,campaign_id,lead_id`,
    ].join(",");



    const dialString =
        `{${vars}}loopback/park`;

    esl.api(`bgapi originate ${dialString} &park`, (res: any) => {
        console.log("[BGAPI]", res.getBody());
    });


    jobRegistry.create(jobUuid, {
        voiceCallId,
        campaignId,
        leadId,
    });

    return jobUuid;
}
