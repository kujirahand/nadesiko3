/* eslint-disable @typescript-eslint/no-explicit-any */
/** get environment name */
export function getEnv(name) {
    if (typeof globalThis.process !== 'undefined' && globalThis.process.env !== undefined) {
        return globalThis.process.env[name];
    }
    if (typeof globalThis.Deno !== 'undefined') {
        return globalThis.Deno.env.get(name);
    }
    return undefined;
}
/** check is windows */
export function isWindows() {
    if (typeof globalThis.process !== 'undefined' && globalThis.process.platform) {
        return globalThis.process.platform === 'win32';
    }
    if (typeof globalThis.Deno !== 'undefined') {
        return globalThis.Deno.build.os === 'windows';
    }
    return false;
}
/** get command line arguments */
export function getCommandLineArgs() {
    // Node.js
    if (typeof globalThis.process !== 'undefined' && globalThis.process.argv) {
        return globalThis.process.argv;
    }
    // Deno
    if (typeof globalThis.Deno !== 'undefined') {
        const args = globalThis.Deno.args;
        args.unshift(new URL(globalThis.Deno.mainModule).pathname);
        args.unshift(globalThis.Deno.execPath());
        return args;
    }
    // Node.js環境の場合
    return [];
}
/** Exit */
export function exit(code) {
    if (typeof globalThis.process !== 'undefined') {
        globalThis.process.exit(code);
    }
    if (typeof globalThis.Deno !== 'undefined') {
        globalThis.Deno.exit(code);
    }
}
