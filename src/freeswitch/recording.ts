import { getESL } from "./esl";

// recording.ts
const RECORDINGS_DIR = "/tmp/fs-recordings";

export function startRecording(callUuid: string, voiceCallId: string) {
    const esl = getESL();

    const filename = `${voiceCallId}_${Date.now()}.wav`;
    const path = `${RECORDINGS_DIR}/${filename}`;

    const cmd = `uuid_record ${callUuid} start ${path}`;

    console.log("🎙️ [RECORDING START]", path);

    esl.api(cmd);

    return path;
}

export function stopRecording(callUuid: string) {
    const esl = getESL();

    console.log("🛑 [RECORDING STOP]", callUuid);
    esl.api(`uuid_record ${callUuid} stop`);
}


