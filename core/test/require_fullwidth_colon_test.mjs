/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

/**
 * 取り込む文で全角コロン「：」が半角コロン「:」と同等に動作するかテストする
 * issue: #2282 取り込むのコロンを全角に対応
 */
describe('require_fullwidth_colon_test', () => {
  /**
   * コードから取り込み先URLを取得するヘルパー関数
   * @param {string} code
   * @returns {string[]}
   */
  const getRequireValues = (code) => {
    const nako = new NakoCompiler()
    const tokens = nako.rawtokenize(code, 0, 'main.nako3', '')
    return NakoCompiler.listRequireStatements(tokens).map(t => t.value)
  }

  it('貯蔵庫: 半角コロン（既存動作の確認）', () => {
    const result = getRequireValues('!「貯蔵庫:hello.nako3」を取り込む')
    assert.strictEqual(result[0], 'https://n3s.nadesi.com/plain/hello.nako3')
  })

  it('貯蔵庫： 全角コロンでもURLに変換される', () => {
    const result = getRequireValues('!「貯蔵庫：hello.nako3」を取り込む')
    assert.strictEqual(result[0], 'https://n3s.nadesi.com/plain/hello.nako3')
  })

  it('拡張プラグイン: 半角コロン（既存動作の確認）', () => {
    const result = getRequireValues('!「拡張プラグイン:music.js」を取り込む')
    assert.strictEqual(result[0], 'https://cdn.jsdelivr.net/npm/nadesiko3-music@latest/nadesiko3-music.js')
  })

  it('拡張プラグイン： 全角コロンでもURLに変換される', () => {
    const result = getRequireValues('!「拡張プラグイン：music.js」を取り込む')
    assert.strictEqual(result[0], 'https://cdn.jsdelivr.net/npm/nadesiko3-music@latest/nadesiko3-music.js')
  })

  it('拡張プラグイン：バージョン付き（全角コロン）', () => {
    const result = getRequireValues('!「拡張プラグイン：music.js@1.0.2」を取り込む')
    assert.strictEqual(result[0], 'https://cdn.jsdelivr.net/npm/nadesiko3-music@1.0.2/nadesiko3-music.js')
  })

  it('貯蔵庫：全角コロン（全角感嘆符も使用）', () => {
    const result = getRequireValues('！「貯蔵庫：hello.nako3」を取り込む')
    assert.strictEqual(result[0], 'https://n3s.nadesi.com/plain/hello.nako3')
  })
})
