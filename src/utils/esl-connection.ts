export function getCallUUID(evt: any): string | null {
    return (
        evt.getHeader("variable_call_uuid") ||
        evt.getHeader("Channel-Call-UUID") ||
        null
    );
}

export function isALeg(evt: any): boolean {
    return evt.getHeader("variable_loopback_leg") === "A";
}

export function isBLeg(evt: any): boolean {
    return evt.getHeader("variable_loopback_leg") === "B";
}
