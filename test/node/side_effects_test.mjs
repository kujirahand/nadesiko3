/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import { CNako3 } from '../../src/cnako3mod.mjs'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('cnako::side_effects_test', () => {
  it('プラグインの取り込み', async () => {
    const nako = new CNako3({ nostd: false })
    // 取り込み命令ありで実行
    const code1 = '!「plugin_csv.mjs」を取り込む。\n「1,2」のCSV取得して表示'
    assert.strictEqual((await nako.runAsync(code1, 'main.nako3')).log, '1,2')

    // [TODO] 取り込み命令なしで実行
    // const code2 = '!「1,2」のCSV取得して表示'
    // assert.throws(() => nako.run(code2, 'main.nako3'), NakoSyntaxError)
  })
  it('ファイルの取り込み', async () => {
    const cnako = new CNako3({ nostd: false })
    // 取り込み命令ありで実行
    const fname = path.join(__dirname, 'requiretest.nako3')
    const code1 = `!「${fname}」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。`
    const res = await cnako.runAsync(code1, 'main.nako3')
    assert.strictEqual(res.log, '5\n8')

    // 取り込み命令なしで実行
    /* [TODO] なぜか以下うまくエラーを捕捉できない
        const code2 = '痕跡を表示。3と5を痕跡演算して、表示。'
        assert.throws(
            async () => { nako.run(code2, 'main.nako3') },
            NakoSyntaxError)
        */
  })
})
