import canvasBasicHtml from '../browser/test/html/canvas_basic.html?raw'
import divBasicHtml from '../browser/test/html/div_basic.html?raw'
import eventDomFormHtml from '../browser/test/html/event_dom_form.html?raw'
import eventDomScrollDivHtml from '../browser/test/html/event_dom_scrolldiv.html?raw'
import { NakoCompiler } from 'nadesiko3core/src/nako3.mjs'

// 旧テストの期待に合わせ、実行ごとにログを初期化する。
NakoCompiler.prototype.run = function (code, fname = 'main.nako3', preCode = '') {
  // 旧Mocha環境と同じく毎回クリーンな実行環境で評価する
  if (this?.logger && typeof this.logger.clear === 'function') {
    this.logger.clear()
  }
  return this.runSync(code, fname, {
    preCode,
    resetAll: true,
    resetEnv: true
  })
}

// 旧ブラウザテストが参照するHTMLテンプレートをグローバルへ供給する。
globalThis.__html__ = {
  'test/html/canvas_basic.html': canvasBasicHtml,
  'test/html/div_basic.html': divBasicHtml,
  'test/html/event_dom_form.html': eventDomFormHtml,
  'test/html/event_dom_scrolldiv.html': eventDomScrollDivHtml
}

function createSuite (title, parent = null) {
  return {
    title,
    parent,
    entries: [],
    beforeEachHooks: [],
    afterEachHooks: []
  }
}

const rootSuite = createSuite('')
let currentSuite = rootSuite

function createTimeoutConfigurer (testCase) {
  return {
    timeout (ms) {
      testCase.timeout = ms
      return this
    }
  }
}

function describe (title, fn) {
  const suite = createSuite(title, currentSuite)
  currentSuite.entries.push({ type: 'suite', suite })
  const prevSuite = currentSuite
  currentSuite = suite
  try {
    fn()
  } finally {
    currentSuite = prevSuite
  }
}

describe.skip = () => {}

describe.only = describe

function it (title, fn) {
  const testCase = {
    title,
    fn,
    timeout: 10000,
    skip: false
  }
  currentSuite.entries.push({ type: 'test', testCase })
  return createTimeoutConfigurer(testCase)
}

it.skip = (title) => {
  const testCase = {
    title,
    fn: null,
    timeout: 10000,
    skip: true
  }
  currentSuite.entries.push({ type: 'test', testCase })
  return createTimeoutConfigurer(testCase)
}

it.only = it

function beforeEach (fn) {
  currentSuite.beforeEachHooks.push(fn)
}

function afterEach (fn) {
  currentSuite.afterEachHooks.push(fn)
}

globalThis.describe = describe
globalThis.it = it
globalThis.beforeEach = beforeEach
globalThis.afterEach = afterEach

function getSuiteChain (suite) {
  const chain = []
  let target = suite
  while (target && target !== rootSuite) {
    chain.unshift(target)
    target = target.parent
  }
  return chain
}

function getFullTitle (suite, testTitle) {
  const names = getSuiteChain(suite).map((s) => s.title).filter(Boolean)
  names.push(testTitle)
  return names.join(' ')
}

async function runWithTimeout (fn, timeoutMs, fullTitle) {
  if (typeof fn !== 'function') return
  let timerId = null
  try {
    await Promise.race([
      Promise.resolve().then(() => fn()),
      new Promise((_, reject) => {
        timerId = setTimeout(() => {
          reject(new Error(`タイムアウト: ${timeoutMs}ms (${fullTitle})`))
        }, timeoutMs)
      })
    ])
  } finally {
    if (timerId !== null) {
      clearTimeout(timerId)
    }
  }
}

async function runTestCase (suite, testCase, result) {
  if (testCase.skip) return

  const fullTitle = getFullTitle(suite, testCase.title)
  const chain = getSuiteChain(suite)
  const beforeHooks = chain.flatMap((s) => s.beforeEachHooks)
  const afterHooks = chain.flatMap((s) => s.afterEachHooks).reverse()

  result.total += 1
  let failedError = null

  try {
    for (const hook of beforeHooks) {
      await runWithTimeout(hook, testCase.timeout, `${fullTitle} [beforeEach]`)
    }
    await runWithTimeout(testCase.fn, testCase.timeout, fullTitle)
  } catch (error) {
    failedError = error
  }

  try {
    for (const hook of afterHooks) {
      await runWithTimeout(hook, testCase.timeout, `${fullTitle} [afterEach]`)
    }
  } catch (error) {
    if (failedError === null) {
      failedError = error
    }
  }

  if (failedError === null) {
    result.passes += 1
    return
  }

  result.failures += 1
  result.failures_detail.push({
    title: fullTitle,
    error: failedError?.stack || failedError?.message || String(failedError)
  })
}

async function runSuite (suite, result) {
  for (const entry of suite.entries) {
    if (entry.type === 'suite') {
      await runSuite(entry.suite, result)
      continue
    }
    await runTestCase(suite, entry.testCase, result)
  }
}

async function main () {
  const result = {
    failures: 0,
    passes: 0,
    total: 0,
    failures_detail: []
  }

  try {
    await import('../browser/test/plugin_browser_test.js')
    await import('../browser/test/plugin_turtle_test.js')
    await import('../browser/test/plugin_webworker_test.js')

    await runSuite(rootSuite, result)
  } catch (error) {
    result.failures += 1
    result.total += 1
    result.failures_detail.push({
      title: 'browser-full-runner bootstrap',
      error: error?.stack || error?.message || String(error)
    })
  }

  window.__playwright_done__ = result
}

void main()
