import { eventRouter } from "./eventRouter";

export function registerFSEvents(esl: any) {
    esl.on("esl::event::*", (evt: any) => {
        const name = evt.getHeader("Event-Name");
        const uuid = evt.getHeader("Unique-ID");

        if (!name) return;

        const headers: Record<string, string> = {};
        evt.headers?.forEach((v: string, k: string) => {
            headers[k] = v;
        });

        console.log("[FS EVENT]", name, uuid);

        eventRouter.emit({
            name,
            uuid,
            headers,
        });
    });
}