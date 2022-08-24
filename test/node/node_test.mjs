/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import { execSync, spawnSync } from 'child_process'
import nakoVersion from '../../src/nako_version.mjs'

// __dirname のために
import url from 'url'
const debug = false
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// PATH
const cnako3 = path.join(__dirname, '../../src/cnako3.mjs')

// eslint-disable-next-line no-undef
describe('node_test(cnako)', () => {
  const cmp = (/** @type {string} */ code, /** @type {string} */ exRes) => {
    const result = execSync(`node ${cnako3} -e "${code}"`).toString().replace(/\s+$/, '')
    if (debug) {
      console.log('code=' + code)
      console.log('result=' + result)
    }
    assert.strictEqual(result, exRes)
  }
  // --- バージョンチェック ---
  it('ナデシコバージョン:src/plugin_system.jsを正しく設定しているか？', () => {
    cmp('ナデシコバージョンを表示', nakoVersion.version)
    cmp('ナデシコ種類を表示', 'cnako3')
  })
  // --- test ---
  it('print simple', () => {
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  }).timeout(15000)

  it('単独で実行できるプログラムの出力(macの時のみ) - Node.js', function () {
    // [memo] なでしこが生成するコードも ESM ("".mjs") です
    // testフォルダはmjsがデフォルト
    // /tmp を使うので、windowsならテストしない macの時だけテスト
    if (process.platform !== 'darwin') { return this.skip() }
    const nakofileOrg = path.join(__dirname, 'add_test.nako3')
    const nakofile = path.join('/tmp', 'add_test.nako3')
    const jsfile = path.join('/tmp', 'add_test.mjs')
    fs.copyFileSync(nakofileOrg, nakofile)
    if (process.env.NODE_ENV === 'test') { return this.skip() }
    const stderr = spawnSync('node', [cnako3, '-c', nakofile]).stderr
    try {
      if (stderr) { console.error(stderr.toString()) }
      const p = spawnSync('node', [jsfile])
      if (p.stderr) { console.error(p.stderr.toString()) }
      assert.strictEqual(p.stdout.toString(), '3\n')
    } finally {
      if (fs.existsSync(jsfile)) { fs.unlinkSync(jsfile) }
    }
  })
  it('圧縮/解凍', function () {
    if (process.platform === 'win32') { return this.skip() }
    try { execSync('which 7z').toString() } catch (e) { return this.skip() }
    const pathSrc = 'FILE=「{テンポラリフォルダ}/test.txt」;ZIP=「{テンポラリフォルダ}/test.zip」;'
    cmp(`${pathSrc}FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。`, 'ok')
    cmp(`${pathSrc}FILEをファイル削除。ZIPをテンポラリフォルダに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
  it('圧縮/解凍 - OS Command Injection #1325', function () {
    // 7z がない環境ではテストを飛ばす
    if (process.platform === 'win32') { return this.skip() }
    try { execSync('which 7z').toString() } catch (e) { return this.skip() }
    // (1) 元ファイルへのインジェクション
    const pathSrc = 'FILE=「{テンポラリフォルダ}/`touch hoge`.txt」;ZIP=「{テンポラリフォルダ}/test.zip」;'
    cmp('F=「{テンポラリフォルダ}/hoge」;Fが存在;もしそうならば、Fをファイル削除;' +
        `${pathSrc}FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。`, 'ok')
    cmp(`${pathSrc}「{テンポラリフォルダ}/hoge」が存在。もし,そうならば「OS_INJECTION」と表示。`, '')
    cmp(`${pathSrc}FILEをファイル削除。ZIPをテンポラリフォルダに解凍。FILEを読む。トリム。それを表示。`, 'abc')
    // (2) ZIPファイルへのインジェクション
    const pathSrc2 = 'FILE=「{テンポラリフォルダ}/test2.txt」;ZIP=「{テンポラリフォルダ}/`touch bbb`.zip」;'
    cmp('F=「{テンポラリフォルダ}/bbb」;Fが存在;もしそうならば、Fをファイル削除;' +
        `${pathSrc2}FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。`, 'ok')
    cmp(`${pathSrc2}「{テンポラリフォルダ}/bbb」が存在。もし,そうならば「OS_INJECTION」と表示。`, '')
    cmp(`${pathSrc2}FILEをファイル削除。ZIPをテンポラリフォルダに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
})
