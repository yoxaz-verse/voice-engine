


import net from "net";
import { EventEmitter } from "events";
import { eventRouter } from "./eventRouter";
import { eslState } from "./eslState";
import type { FSEvent } from "./eventRouter";

// ... imports

let esl: CustomESLConnection | null = null;
let socket: net.Socket | null = null;

class CustomESLConnection extends EventEmitter {
    private socket: net.Socket;
    private buffer: string = "";
    private authenticated: boolean = false;
    private pendingCallback: ((res: any) => void) | null = null;

    constructor(private host: string, private port: number, private password: string) {
        super();
        this.socket = new net.Socket();
        this.init();
    }

    private init() {
        this.socket.connect(this.port, this.host, () => {
            console.log("📡 [ESL SOCKET CONNECTED]");
        });

        this.socket.on("data", (data) => this.handleData(data));
        this.socket.on("close", () => this.emit("esl::end"));
        this.socket.on("error", (err) => this.emit("error", err));
    }

    private handleData(data: Buffer) {
        this.buffer += data.toString("utf8");

        while (this.buffer.includes("\n\n")) {
            const index = this.buffer.indexOf("\n\n");
            const rawHeaders = this.buffer.slice(0, index);
            const headers = this.parseRawHeaders(rawHeaders);

            const contentLength = headers["Content-Length"] ? parseInt(headers["Content-Length"]) : 0;

            if (contentLength > 0) {
                if (this.buffer.length < index + 2 + contentLength) return;

                const body = this.buffer.slice(index + 2, index + 2 + contentLength);
                this.buffer = this.buffer.slice(index + 2 + contentLength);
                this.processMessage(headers, body);
            } else {
                this.buffer = this.buffer.slice(index + 2);
                this.processMessage(headers, "");
            }
        }
    }

    private parseRawHeaders(raw: string): Record<string, string> {
        const lines = raw.split("\n");
        const headers: Record<string, string> = {};
        for (const line of lines) {
            const [key, ...parts] = line.split(":");
            if (key && parts.length) {
                headers[key.trim()] = parts.join(":").trim();
            }
        }
        return headers;
    }

    private processMessage(headers: Record<string, string>, body: string) {
        const contentType = headers["Content-Type"];

        if (contentType === "auth/request") {
            console.log("🔑 [ESL] Authenticating...");
            this.socket.write(`auth ${this.password}\n\n`);
        } else if (contentType === "command/reply") {
            const replyText = headers["Reply-Text"];
            console.log("📥 [ESL REPLY]", replyText);

            if (replyText?.startsWith("+OK accepted")) {
                this.authenticated = true;
                this.emit("esl::ready");
            }

            if (this.pendingCallback) {
                const cb = this.pendingCallback;
                this.pendingCallback = null;
                cb({ getBody: () => replyText || body || "" });
            }
        } else if (contentType === "text/event-plain") {
            const eventHeaders = this.parseRawHeaders(body);
            const eventName = eventHeaders["Event-Name"];

            const event: FSEvent & { getHeader: (k: string) => string } = {
                name: eventName,
                uuid: eventHeaders["Unique-ID"],
                headers: eventHeaders,
                getHeader: (k: string) => eventHeaders[k] || ""
            };

            this.emit("esl::event::*", event);
            if (eventName) {
                this.emit(`esl::event::${eventName}`, event);
            }
        }
    }


    public events(type: "plain" | "json", list: string, cb?: () => void) {
        this.socket.write(`event ${type} ${list}\n\n`, cb);
    }

    public api(command: string, cb?: (res: any) => void) {
        this.pendingCallback = cb || null;
        this.socket.write(`api ${command}\n\n`);
    }

    public async executeSync(command: string): Promise<string> {
        return new Promise((resolve) => {
            this.api(command, (res) => {
                resolve(res.getBody());
            });
        });
    }

    public async exists(callUuid: string): Promise<boolean> {
        const res = await this.executeSync(`uuid_exists ${callUuid}`);
        return res.trim() === "true";
    }
}

// --------------------------------------------------------------------------------

export function connectESL() {
    if (eslState.current === "ready") return;

    // 🔥 LAZY LOAD ENV VARS to avoid hoisting issues
    const FS_HOST = process.env.FS_HOST!;
    const FS_PORT = Number(process.env.FS_PORT!);
    const FS_PASSWORD = process.env.FS_PASSWORD!;

    console.log("[ESL] Connecting Custom Client to FreeSWITCH", { FS_HOST, FS_PORT });

    esl = new CustomESLConnection(FS_HOST, FS_PORT, FS_PASSWORD);

    esl.on("esl::ready", () => {
        console.log("📡 [ESL READY]");
        eslState.current = "ready";

        esl!.events("plain", "ALL");
        console.log("📡 [ESL EVENTS ENABLED (PLAIN)]");

        // 🔥 HEARTBEAT check
        esl!.on("esl::event::HEARTBEAT", (evt: any) => {
            console.log("💗 [HEARTBEAT]", evt.getHeader("Event-Date-Local"));
        });

        esl!.on("esl::event::CHANNEL_CREATE", (evt: any) => {
            console.log("🔥 [ESL SPECIFIC] CHANNEL_CREATE", evt.getHeader("Unique-ID"));
            eventRouter.emit({
                name: 'CHANNEL_CREATE',
                uuid: evt.getHeader("Unique-ID"),
                headers: evt.headers
            });
        });

        esl!.on("esl::event::BACKGROUND_JOB", (evt: any) => {
            console.log("🔥 [ESL SPECIFIC] BACKGROUND_JOB", evt.getHeader("Job-UUID"));
            eventRouter.emit({
                name: 'BACKGROUND_JOB',
                uuid: evt.getHeader("Unique-ID"),
                headers: evt.headers
            });
        });
        esl!.on("esl::event::CHANNEL_ANSWER", (evt: any) => {
            const uuid = evt.getHeader("Unique-ID");
            console.log("🔥 [ESL SPECIFIC] CHANNEL_ANSWER", uuid);

            eventRouter.emit({
                name: "CHANNEL_ANSWER",
                uuid,
                headers: evt.headers,
            });
        });

        esl!.on("esl::event::CHANNEL_HANGUP", (evt: any) => {
            const uuid = evt.getHeader("Unique-ID");
            console.log("🔥 [ESL SPECIFIC] CHANNEL_HANGUP", uuid);

            eventRouter.emit({
                name: "CHANNEL_HANGUP",
                uuid,
                headers: evt.headers,
            });
        });

        esl!.on("esl::event::*", (evt: any) => {
            const name = evt.getHeader("Event-Name");
            if (name === 'CHANNEL_CREATE' || name === 'BACKGROUND_JOB') return;

            console.log("🔥 [ESL WILDCARD]", name);
        });


    });

    esl.on("esl::end", () => {
        console.error("[ESL] Disconnected");
        eslState.current = "disconnected";
        esl = null;
    });

    esl.on("error", (err) => {
        console.error("[ESL ERROR]", err);
    });
}

export function shutdownESL() {
    console.log('[ESL] Shutting down');

    if (esl) {
        (esl as any).socket?.end?.();
        (esl as any).socket?.destroy?.();
        esl = null;
    }

    eslState.current = "disconnected";
}

export function getESL(): CustomESLConnection {
    if (!esl || eslState.current !== "ready") {
        throw new Error("ESL_NOT_READY");
    }
    return esl;
}

// Re-export Connection type for compatibility if needed, but we use CustomESLConnection
export type Connection = CustomESLConnection;

