/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'

import { CNako3 } from '../../src/cnako3mod.mjs'
import { NakoImportError } from '../../core/src/nako_errors.mjs'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('require_nako3_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new CNako3()
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, res)
  }
  it('「ファイルを取り込む」', async () => {
    await cmp('!「' + __dirname + '/requiretest.nako3」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。', '5\n8')
  })
  it('CNakoの相対インポート', async () => {
    await cmp('!「' + __dirname + '/relative_import_test_2.nako3」を取り込む。', '1\n2')
  })
  it('「回」が1回だけ分割されることを確認する', async () => {
    await cmp('！「' + __dirname + '/kai_test.nako3」を取り込む', '')
  })
  it('.jsと.nako3を同時に読み込む[1/2] .jsが先の場合', async () => {
    const nako = new CNako3()
    const code =
      '!「plugin_csv.mjs」を取り込む。\n' +
      `!「${__dirname}/requiretest.nako3」を取り込む。\n`
    await nako.runAsync(code, 'main.nako3') // エラーが飛ばないことを確認
  })
  it('.jsと.nako3を同時に読み込む[2/2] .nako3が先の場合', async () => {
    const nako = new CNako3()
    const code =
      `!「${__dirname}/requiretest.nako3」を取り込む。\n` +
      '!「plugin_csv.mjs」を取り込む。\n'
    await nako.runAsync(code, 'main.nako3') // エラーが飛ばないことを確認
  })
  it('.jsファイルの投げたエラーを表示', async () => {
    const nako = new CNako3()
    const code = `!「${__dirname}/plugin_broken.js.txt」を取り込む`
    // await nako.loadDependencies(code, 'main.nako3', '')
    assert.rejects(
      async () => {
        await nako.run(code, 'main.nako3')
      },
      (err) => {
        assert(err instanceof NakoImportError)
        assert(err.message.includes('テスト'))
        assert.strictEqual(err.line, 0) // 1行目
        assert.strictEqual(err.file, 'main.nako3')
      }
    )
  })
  it('『プラグイン名』のテスト。(#956)(#1112)', async () => {
    const fname = path.join(__dirname, 'requiretest_name.nako3')
    await cmp('!「' + fname + '」を取り込む。リクエスト名前取得して表示。', 'requiretest_name')
  })
})
