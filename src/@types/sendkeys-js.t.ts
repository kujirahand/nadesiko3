declare module 'sendkeys-js'

declare interface SendKyes {
    send: (keys: string, metaKeys: string) => void;
    activate: (title: string) => void;
    run: (path: string) => void;
    sleep: (v: number) => void;
    sendKeys: (keys: string) => void;
}
