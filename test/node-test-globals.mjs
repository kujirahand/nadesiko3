import 'module-alias/register'
import {
  after,
  afterEach,
  before,
  beforeEach,
  describe as nodeDescribe,
  it as nodeIt,
  test as nodeTest
} from 'node:test'

class SkipTest extends Error {}

const chain = {
  timeout: () => chain,
  slow: () => chain,
  retries: () => chain
}

function normalizeArgs(args) {
  const [name, optionsOrFn, maybeFn] = args
  if (typeof optionsOrFn === 'function' || optionsOrFn === undefined) {
    return [name, undefined, optionsOrFn]
  }
  return [name, optionsOrFn, maybeFn]
}

function createContext(t) {
  return {
    skip(message) {
      t.skip(message)
      throw new SkipTest(message)
    },
    timeout() {},
    slow() {},
    retries() {}
  }
}

function wrapFn(fn) {
  if (typeof fn !== 'function') {
    return fn
  }
  return async (t) => {
    const context = createContext(t)
    try {
      if (fn.length > 0) {
        await new Promise((resolve, reject) => {
          let settled = false
          const done = (err) => {
            if (settled) {
              return
            }
            settled = true
            err ? reject(err) : resolve()
          }
          const result = fn.call(context, done)
          if (result && typeof result.then === 'function') {
            result.then(() => done(), done)
          }
        })
      } else {
        await fn.call(context)
      }
    } catch (err) {
      if (err instanceof SkipTest) {
        return
      }
      throw err
    }
  }
}

function createRunner(nodeRunner) {
  const runner = (...args) => {
    const [name, options, fn] = normalizeArgs(args)
    if (options === undefined) {
      nodeRunner(name, wrapFn(fn))
    } else {
      nodeRunner(name, options, wrapFn(fn))
    }
    return chain
  }
  runner.skip = (...args) => {
    const [name, options, fn] = normalizeArgs(args)
    if (options === undefined) {
      nodeRunner.skip(name, wrapFn(fn))
    } else {
      nodeRunner.skip(name, options, wrapFn(fn))
    }
    return chain
  }
  runner.only = (...args) => {
    const [name, options, fn] = normalizeArgs(args)
    if (options === undefined) {
      nodeRunner.only(name, wrapFn(fn))
    } else {
      nodeRunner.only(name, options, wrapFn(fn))
    }
    return chain
  }
  return runner
}

globalThis.describe = createRunner(nodeDescribe)
globalThis.it = createRunner(nodeIt)
globalThis.test = createRunner(nodeTest)
globalThis.before = before
globalThis.after = after
globalThis.beforeEach = beforeEach
globalThis.afterEach = afterEach
