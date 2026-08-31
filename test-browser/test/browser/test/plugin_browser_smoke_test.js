import { NakoCompiler } from 'nadesiko3core/src/nako3.mjs'
import PluginBrowser from 'nako3/plugin_browser.mjs'

function createCompiler () {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginBrowser', 'plugin_browser.js', PluginBrowser)
  return nako
}

function assertEqual (actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} (actual=${actual}, expected=${expected})`)
  }
}

async function runCase (title, fn, result) {
  result.total++
  try {
    await fn()
    result.passes++
  } catch (error) {
    result.failures.push({
      title,
      error: error?.stack || error?.message || String(error)
    })
  }
}

/**
 * 旧plugin_browser_smoke_test.jsの内容をMocha非依存で実行する
 */
const smokeCases = [
  {
    title: '言う',
    fn: () => {
      const nako = createCompiler()
      const originalAlert = window.alert
      let count = 0
      window.alert = (msg) => {
        if (msg === 'あいうえお') count++
      }
      try {
        nako.run('「あいうえお」を言う')
        assertEqual(count, 1, 'alert呼び出し回数')
      } finally {
        window.alert = originalAlert
      }
    }
  },
  {
    title: '尋ねる',
    fn: () => {
      const nako = createCompiler()
      const originalPrompt = window.prompt
      let count = 0
      window.prompt = (msg) => {
        if (msg === 'かきくけこ') count++
        return 'abc'
      }
      try {
        const result = nako.run('A=「かきくけこ」を尋ねる;AをJSONエンコードして表示')
        assertEqual(result.log, '"abc"', 'prompt戻り値')
        assertEqual(count, 1, 'prompt呼び出し回数')
      } finally {
        window.prompt = originalPrompt
      }
    }
  },
  {
    title: '二択',
    fn: () => {
      const nako = createCompiler()
      const originalConfirm = window.confirm
      let count = 0
      window.confirm = (msg) => {
        if (msg === 'これ') count++
        return true
      }
      try {
        const result = nako.run('A=「これ」で二択;AをJSONエンコードして表示')
        assertEqual(result.log, 'true', 'confirm戻り値')
        assertEqual(count, 1, 'confirm呼び出し回数')
      } finally {
        window.confirm = originalConfirm
      }
    }
  }
]

export async function runBrowserSmokeCases (cases = smokeCases) {
  const result = {
    total: 0,
    failures: [],
    passes: 0
  }

  for (const { title, fn } of cases) {
    await runCase(title, fn, result)
  }

  return result
}
