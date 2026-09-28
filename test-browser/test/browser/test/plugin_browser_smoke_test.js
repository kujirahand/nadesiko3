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
    fn: async () => {
      const nako = createCompiler()
      const originalAlert = window.alert
      let count = 0
      window.alert = (msg) => {
        if (msg === 'あいうえお') count++
      }
      try {
        await nako.runAsync('ダイアログ方式=「ブラウザ」。「あいうえお」を言う', 'main.nako3')
        assertEqual(count, 1, 'alert呼び出し回数')
      } finally {
        window.alert = originalAlert
      }
    }
  },
  {
    title: '尋ねる',
    fn: async () => {
      const nako = createCompiler()
      const originalPrompt = window.prompt
      let count = 0
      window.prompt = (msg) => {
        if (msg === 'かきくけこ') count++
        return 'abc'
      }
      try {
        const result = await nako.runAsync('ダイアログ方式=「ブラウザ」。A=「かきくけこ」を尋ねる;AをJSONエンコードして表示', 'main.nako3')
        assertEqual(result.log, '"abc"', 'prompt戻り値')
        assertEqual(count, 1, 'prompt呼び出し回数')
      } finally {
        window.prompt = originalPrompt
      }
    }
  },
  {
    title: '二択',
    fn: async () => {
      const nako = createCompiler()
      const originalConfirm = window.confirm
      let count = 0
      window.confirm = (msg) => {
        if (msg === 'これ') count++
        return true
      }
      try {
        const result = await nako.runAsync('ダイアログ方式=「ブラウザ」。A=「これ」で二択;AをJSONエンコードして表示', 'main.nako3')
        assertEqual(result.log, 'true', 'confirm戻り値')
        assertEqual(count, 1, 'confirm呼び出し回数')
      } finally {
        window.confirm = originalConfirm
      }
    }
  },
  {
    title: 'ボタン選択(DOMダイアログ) #2548',
    fn: async () => {
      const nako = createCompiler()
      const p = nako.runAsync('A=["# 選んで", "寿司", "ラーメン"]のボタン選択;Aを表示', 'main.nako3')
      const dlg = await waitDialog()
      assertEqual(dlg.querySelector('.nako3dialog-label').textContent, '選んで', 'ラベル')
      Array.from(dlg.querySelectorAll('.nako3dialog-button')).find(b => b.textContent === 'ラーメン').click()
      const result = await p
      assertEqual(result.log, 'ラーメン', 'ボタン選択の戻り値')
      assertEqual(document.querySelector('dialog.nako3dialog'), null, 'ダイアログが閉じる')
    }
  },
  {
    title: '尋ねる(DOMダイアログ) #2548',
    fn: async () => {
      const nako = createCompiler()
      const p = nako.runAsync('A=「年齢は？」と尋ねる;(A+1)を表示', 'main.nako3')
      const dlg = await waitDialog()
      dlg.querySelector('.nako3dialog-input').value = '２０'
      Array.from(dlg.querySelectorAll('.nako3dialog-button')).find(b => b.textContent === 'OK').click()
      const result = await p
      assertEqual(result.log, '21', '尋ねるの戻り値')
    }
  }
]

// DOMダイアログが表示されるまで待つ
async function waitDialog () {
  for (let i = 0; i < 200; i++) {
    const dlg = document.querySelector('dialog.nako3dialog')
    if (dlg) return dlg
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error('ダイアログが表示されませんでした')
}

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
