import { WebNakoCompiler } from 'nako3/wnako3mod.mjs'

const DIV_ID = 'nako3_doctest_div'
const CANVAS_ID = 'nako3_doctest_canvas'

function prepareDocument (options) {
  const stage = document.createElement('main')
  const div = document.createElement('div')
  div.id = DIV_ID
  stage.appendChild(div)

  if (options.canvas) {
    const canvas = document.createElement('canvas')
    canvas.id = CANVAS_ID
    canvas.width = options.width
    canvas.height = options.height
    stage.appendChild(canvas)
  }

  document.body.replaceChildren(stage)
}

function makePreCode (options) {
  const lines = [
    `「#${DIV_ID}」へDOM親要素設定。`,
    `「#${DIV_ID}」に「」をHTML設定。`
  ]
  if (options.canvas) {
    lines.push(`「#${CANVAS_ID}」へ描画開始。`)
    lines.push(`カメ描画先＝「#${CANVAS_ID}」。`)
  }
  return lines.join('\n')
}

/**
 * ブラウザ用DocTestを現在のページで1件実行する。
 * @param {{file: string, code: string, expect: string, options: {canvas: boolean, width: number, height: number}}} test
 */
export async function runBrowserDocTest (test) {
  const options = {
    canvas: Boolean(test.options?.canvas),
    width: test.options?.width || 300,
    height: test.options?.height || 300
  }
  prepareDocument(options)
  const nako = new WebNakoCompiler()
  try {
    const preCode = makePreCode(options)
    const global = await nako.runAsync(`${preCode}\n${test.code}`, test.file || 'browser-doctest.nako3')
    const actual = String(global.log).replace(/\s+$/, '')
    return { ok: actual === test.expect, actual, error: null }
  } catch (error) {
    return {
      ok: false,
      actual: '',
      error: error?.stack || error?.message || String(error)
    }
  }
}
