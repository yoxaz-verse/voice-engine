declare module 'modesl' {
  import { EventEmitter } from 'events';

  class Connection extends EventEmitter {
    constructor(
      host: string,
      port: number,
      password: string
    );

    api(
      command: string,
      callback?: (res: { getBody(): string }) => void
    ): void;

    events(format: string, events?: string): void;

    filter?(header: string, value: string): void;
  }

  export = {
    Connection,
  };
}
