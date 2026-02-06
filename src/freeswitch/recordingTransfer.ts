import fs from "fs";
import path from "path";
import { exec } from "child_process";

const LOCAL_RECORDINGS_DIR = "./recordings";

export function pullRecordingFromFS(
  fsHost: string,
  remotePath: string,
  voiceCallId: string
) {
  const filename = path.basename(remotePath);
  const localPath = path.join(LOCAL_RECORDINGS_DIR, filename);

  const cmd = `
scp root@${fsHost}:${remotePath} ${localPath} &&
ssh root@${fsHost} "rm -f ${remotePath}"
`;

  console.log("📥 [RECORDING TRANSFER]", filename);

  exec(cmd, (err) => {
    if (err) {
      console.error("❌ RECORDING TRANSFER FAILED", err);
    } else {
      console.log("✅ RECORDING SAVED LOCALLY", localPath);
    }
  });

  return localPath;
}
