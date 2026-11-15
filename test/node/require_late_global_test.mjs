/* eslint-disable no-undef */
import assert from 'assert'
import { after } from 'node:test'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { CNako3 } from '../../src/cnako3mod.mjs'

// 関数定義より後で宣言されたグローバル変数の解決が、モジュール境界と
// 公開設定に従うことを確認する (#2665)
describe('require_late_global_test', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3-late-global-'))
  after(() => { fs.rmSync(dir, { recursive: true, force: true }) })
  const writeLib = (name, code) => {
    const p = path.join(dir, name)
    fs.writeFileSync(p, code, 'utf-8')
    return p
  }
  const run = async (code) => {
    const nako = new CNako3()
    const g = await nako.runAsync(code, path.join(dir, 'main.nako3'))
    return g.log
  }

  it('自モジュールの後定義グローバルが他モジュールより優先される', async () => {
    const lib = writeLib('lib_own.nako3', `
●LIB計算とは
  結果=10
  結果を戻す
ここまで
結果=1
`)
    const log = await run(`!「${lib}」を取り込む\n結果=99\nLIB計算を表示\n結果を表示`)
    assert.strictEqual(log, '10\n99')
  })

  it('非公開の変数は他モジュールの関数から見えない', async () => {
    const lib = writeLib('lib_secret.nako3', `
秘とは変数{非公開}=5
●LIB秘読取とは
  秘を戻す
ここまで
`)
    const log = await run(`!「${lib}」を取り込む\n●MAIN読取とは\n  秘を戻す\nここまで\nMAIN読取を表示\nLIB秘読取を表示`)
    assert.strictEqual(log, 'undefined\n5')
  })

  it('取り込んだモジュールの関数は自モジュールの後定義グローバルを読める', async () => {
    const lib = writeLib('lib_late.nako3', `
●LIB読取とは
  共有値を戻す
ここまで
共有値=7
`)
    const log = await run(`!「${lib}」を取り込む\nLIB読取を表示`)
    assert.strictEqual(log, '7')
  })
})
