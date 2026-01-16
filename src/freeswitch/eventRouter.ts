type FSEvent = {
    name: string;
    uuid?: string;
    headers: Record<string, string>;
};

type EventHandler = (event: FSEvent) => void;

class EventRouter {
    private handlers: Record<string, EventHandler[]> = {};

    on(eventName: string, handler: EventHandler) {
        if (!this.handlers[eventName]) {
            this.handlers[eventName] = [];
        }
        this.handlers[eventName].push(handler);
    }

    emit(event: FSEvent) {
        const list = this.handlers[event.name] || [];
        for (const handler of list) {
            handler(event);
        }
    }
}

export const eventRouter = new EventRouter();
