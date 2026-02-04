import { getESL } from "./eslClient";

export function hangupCall(callUuid: string, cause = "NORMAL_CLEARING") {
  const esl = getESL();
  esl.api(`uuid_kill ${callUuid} ${cause}`);
}

export function parkCall(callUuid: string) {
  const esl = getESL();
  esl.api(`uuid_park ${callUuid}`);
}

export function holdCall(callUuid: string) {
  const esl = getESL();
  esl.api(`uuid_hold ${callUuid}`);
}

export function resumeCall(callUuid: string) {
  const esl = getESL();
  esl.api(`uuid_hold off ${callUuid}`);
}
