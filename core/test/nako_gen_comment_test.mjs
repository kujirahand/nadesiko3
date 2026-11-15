/* eslint-disable no-undef */
/**
 * コメント中の行終端文字 (CR / LS U+2028 / PS U+2029) の中和テスト (PR #2626)
 *
 * なでしこのコメントは生成 JS の `//` コメントへ転記されるため、
 * コメント本文に ECMAScript の行終端が残ると `//` が途中で終わり、
 * 後続が実行コードになってしまう。字句解析ではコメントを LF まで
 * 本文として取り込み、生成側 (nako_gen.mts の convComment) で
 * 行終端文字を `¶` へ中和することを検証する。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

const LS = '\u2028'
const PS = '\u2029'

describe('nako_gen_comment_test', () => {
  const run = async (code) => {
    const nako = new NakoCompiler()
    return (await nako.runAsync(code)).log
  }

  it('# 行コメント中の LS・PS・CR を含むソースを実行できる', async () => {
    const code = [
      `# LS${LS}続き`,
      `# PS${PS}続き`,
      '# CR\r',
      '「ok」を表示'
    ].join('\n')
    assert.strictEqual(await run(code), 'ok')
  })

  it('// 行コメント中の LS・PS を含むソースを実行できる', async () => {
    const code = [
      `// LS${LS}続き`,
      `// PS${PS}続き`,
      '「ok」を表示'
    ].join('\n')
    assert.strictEqual(await run(code), 'ok')
  })

  it('範囲コメント中の LS・PS・改行を含むソースを実行できる', async () => {
    const code = `/* 範囲${LS}コメント${PS}続き\n末尾 */\n「ok」を表示`
    assert.strictEqual(await run(code), 'ok')
  })

  it('生成 JS に生の LS・PS を含まず、コメントを ¶ へ中和する', () => {
    const nako = new NakoCompiler()
    const js = nako.compile(`# コメント${LS}続き${PS}末尾\n「ok」を表示`, 'main.nako3')
    assert.strictEqual(js.includes(LS), false)
    assert.strictEqual(js.includes(PS), false)
    assert.strictEqual(js.includes('コメント¶続き¶末尾'), true)
  })

  it('範囲コメントの生成 JS でも LS・PS が中和される', () => {
    const nako = new NakoCompiler()
    const js = nako.compile(`/* コメント${LS}続き${PS}末尾 */\n「ok」を表示`, 'main.nako3')
    assert.strictEqual(js.includes(LS), false)
    assert.strictEqual(js.includes(PS), false)
    assert.strictEqual(js.includes('コメント¶続き¶末尾'), true)
  })

  it('LS を利用したコメント注入が実行されない', async () => {
    const marker = '__nako2626Pwned'
    delete globalThis[marker]
    const nako = new NakoCompiler()
    try {
      const result = await nako.runAsync(`#x${LS}globalThis.${marker}=1;//\n「ok」を表示`)
      assert.strictEqual(result.log, 'ok')
      assert.strictEqual(globalThis[marker], undefined)
    } finally {
      delete globalThis[marker]
    }
  })

  it('通常の LF 行コメントが従来どおり動作する', async () => {
    assert.strictEqual(await run('# 通常のコメント\n「ok」を表示'), 'ok')
  })
})
