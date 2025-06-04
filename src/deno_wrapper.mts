/* eslint-disable @typescript-eslint/no-explicit-any */

/** get environment name */
export function getEnv (name: string): string | undefined {
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env !== undefined) {
    return (globalThis as any).process.env[name]
  }
  if (typeof (globalThis as any).Deno !== 'undefined') {
    return (globalThis as any).Deno.env.get(name)
  }
  return undefined
}

/** check is windows */
export function isWindows (): boolean {
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.platform) {
    return (globalThis as any).process.platform === 'win32'
  }
  if (typeof (globalThis as any).Deno !== 'undefined') {
    return (globalThis as any).Deno.build.os === 'windows'
  }
  return false
}

/** get command line arguments */
export function getCommandLineArgs (): string[] {
  // Node.js
  if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.argv) {
    return (globalThis as any).process.argv
  }
  // Deno
  if (typeof (globalThis as any).Deno !== 'undefined') {
    const args = (globalThis as any).Deno.args
    args.unshift(new URL((globalThis as any).Deno.mainModule).pathname)
    args.unshift((globalThis as any).Deno.execPath())
    return args
  }
  // Node.js環境の場合
  return []
}

/** Exit */
export function exit (code: number): void {
  if (typeof (globalThis as any).process !== 'undefined') {
    (globalThis as any).process.exit(code)
  }
  if (typeof (globalThis as any).Deno !== 'undefined') {
    (globalThis as any).Deno.exit(code)
  }
}
