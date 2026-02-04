// import dotenv from 'dotenv';
// dotenv.config();

// import ESL from 'modesl';
// import { eslState } from './eslState';
// import { registerFSEvents } from './events';
// import { callRegistry } from '../registry/callRegistry';

// const FS_HOST = process.env.FS_HOST!;
// const FS_PORT = Number(process.env.FS_PORT!);
// const FS_PASSWORD = String(process.env.FS_PASSWORD || '').trim();

// let esl: InstanceType<typeof ESL.Connection> | null = null;
// let reconnectTimer: NodeJS.Timeout | null = null;
// let reconnectAttempts = 0;
// let heartbeatTimer: NodeJS.Timeout | null = null;

// const MAX_BACKOFF = 30_000;

// function backoffDelay(attempt: number) {
//     return Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF);
// }

// export function connectESL() {

//     if (eslState.current === 'connecting' || eslState.current === 'ready') {
//         return;
//     }

//     eslState.current = 'connecting';
//     reconnectAttempts++;

//     console.log(`[FS] Connecting ESL (attempt ${reconnectAttempts})`);

//     esl = new ESL.Connection(FS_HOST, FS_PORT, FS_PASSWORD);

//     esl.on('connect', () => {
//         console.log('[FS] TCP connected');
//     });


//     function onESLReady() {
//         if (!esl) return;
//         if (eslState.current === "ready") return;

//         console.log("[FS] ESL fully ready");
//         eslState.current = "ready";

//         // ✅ THIS IS THE ONLY VALID WAY
//         esl.events("plain", "CHANNEL_CREATE CHANNEL_ANSWER CHANNEL_HANGUP");

//         // ✅ RAW EVENT LISTENER
//         esl.on("esl::event::*", (evt: any) => {
//             const name = evt.getHeader("Event-Name");
//             const uuid = evt.getHeader("Unique-ID");

//             console.log("[FS EVENT]", name, uuid);

//             if (name === "CHANNEL_CREATE") {
//                 const jobUuid = evt.getHeader("variable_job_uuid");
//                 const voiceCallId = evt.getHeader("variable_voice_call_id");

//                 if (!uuid || !jobUuid) return;

//                 callRegistry.create(uuid, {
//                     job_uuid: jobUuid,
//                     voice_call_id: voiceCallId ?? "",
//                 });

//                 console.log("[CALL REGISTERED]", uuid);
//             }
//         });
//     }



//     esl.on('esl::ready', onESLReady);


//     esl.on("esl::end", () => {
//         console.error("[FS] ESL disconnected");
//         eslState.current = "disconnected";
//         scheduleReconnect();
//     });

//     esl.on("error", (err: any) => {
//         console.error("[FS] ESL error:", err?.message || err);

//         // 🚫 DO NOT reconnect unless socket actually closed
//     });


// }

// function scheduleReconnect() {
//     if (
//         eslState.current === 'connecting' ||
//         eslState.current === 'idle'
//     ) {
//         return;
//     }

//     eslState.current = 'disconnected';

//     esl = null; // 🔥 IMPORTANT

//     if (reconnectTimer) return;

//     const delay = backoffDelay(reconnectAttempts);
//     console.log(`[FS] Reconnecting ESL in ${delay}ms`);

//     reconnectTimer = setTimeout(() => {
//         reconnectTimer = null;
//         connectESL();
//     }, delay);
// }

// export function getESL() {
//     if (!esl || eslState.current !== 'ready') {
//         throw new Error(`ESL_NOT_READY (state=${eslState.current})`);
//     }
//     return esl;
// }

// // 🔥 SINGLE ENTRY POINT
// connectESL();

import dotenv from "dotenv";
dotenv.config();

import ESL, { Connection } from "modesl";
import { eslState } from "./eslState";
import { callRegistry } from "../registry/callRegistry";
import { getCallUUID, isALeg, isBLeg } from "../utils/esl-connection";

const FS_HOST = process.env.FS_HOST!;
const FS_PORT = Number(process.env.FS_PORT!);
const FS_PASSWORD = process.env.FS_PASSWORD!;

let esl: Connection | null = null;

export function connectESL(): Promise<void> {
    return new Promise((resolve, reject) => {
        esl = new ESL.Connection(FS_HOST, FS_PORT, FS_PASSWORD);

        esl.on("esl::ready", () => {
            console.log("📡 [ESL READY]");

            // 🔥 THIS LINE WAS MISSING
            eslState.current = "ready";

            esl!.events("plain", "ALL");
            console.log("📡 [ESL EVENTS ENABLED]");

            esl!.api("linger", () => {
                console.log("📡 [ESL LINGER ENABLED]");
            });

            esl!.on("esl::event::*", (evt: any) => {
                const eventName = evt.getHeader("Event-Name");
                const channelUuid = evt.getHeader("Unique-ID"); // ALWAYS exists
                const leg = evt.getHeader("variable_loopback_leg"); // A | B
                const callUuid = evt.getHeader("variable_call_uuid"); // MAY NOT exist yet

                if (!channelUuid) return;

                console.log(
                    "📡 [ESL EVENT]",
                    eventName,
                    "channel=",
                    channelUuid,
                    "leg=",
                    leg,
                    "callUuid=",
                    callUuid
                );

                // ✅ CREATE CALL ON A-LEG USING CHANNEL UUID
                if (eventName === "CHANNEL_CREATE" && leg === "A") {
                    callRegistry.create(channelUuid);
                    return;
                }

                // ✅ LINK B-LEG
                if (eventName === "CHANNEL_CREATE" && leg === "B") {
                    callRegistry.linkBLeg(channelUuid, channelUuid);
                    return;
                }

                // ✅ BIND LOGICAL CALL UUID WHEN IT APPEARS
                if (callUuid) {
                    callRegistry.bindJob(channelUuid, {
                        jobUuid: evt.getHeader("variable_job_uuid"),
                        voiceCallId: evt.getHeader("variable_voice_call_id"),
                        campaignId: evt.getHeader("variable_campaign_id"),
                        leadId: evt.getHeader("variable_lead_id"),
                    });
                }

                // ✅ STATE MACHINE (A-LEG ONLY)
                if (leg === "A") {
                    if (eventName === "CHANNEL_ANSWER") {
                        callRegistry.updateState(channelUuid, "ANSWERED");
                    }

                    if (eventName === "CHANNEL_HANGUP" || eventName === "CHANNEL_DESTROY") {
                        callRegistry.updateState(channelUuid, "TERMINATED");
                    }
                }
            });


            console.log("📡 [ESL EVENTS IDK]");


            resolve();
        });

        esl.on("esl::error", reject);
    });
}


export function getESL() {
    if (!esl || eslState.current !== "ready") {
        throw new Error("ESL_NOT_READY");
    }
    return esl;
}

connectESL();
