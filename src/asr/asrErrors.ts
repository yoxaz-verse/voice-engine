export class ASRError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'ASRError';
    }
}

export class FileMissingError extends ASRError {
    constructor(path: string) {
        super('FILE_MISSING', `Recording file not found at: ${path}`);
    }
}

export class AudioTooShortError extends ASRError {
    constructor() {
        super('AUDIO_TOO_SHORT', 'Audio duration below minimum required for ASR');
    }
}

export class EngineCrashError extends ASRError {
    constructor(details: string) {
        super('ENGINE_CRASH', `ASR Engine crashed: ${details}`);
    }
}
