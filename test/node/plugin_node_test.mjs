/* eslint-disable no-undef */
import fs from 'fs'
import os from 'os'
import assert from 'assert'
import path from 'path'
import { execSync } from 'child_process'

import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginNode from '../../src/plugin_node.mjs'
import PluginCSV from '../../core/src/plugin_csv.mjs'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testFileMe = path.join(__dirname, 'plugin_node_test.mjs')

describe('plugin_node_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string | undefined} */ res) => {
    const nako = new NakoCompiler()
    nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
    nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
    const g = await nako.runAsync(code, 'main')
    assert.strictEqual(g.log, res)
  }
  const cmd = async (/** @type {string} */ code) => {
    const nako = new NakoCompiler()
    nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
    nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
    await nako.runAsync(code, 'main')
  }
  // --- test ---
  it('表示', async () => {
    await cmp('3を表示', '3')
    await cmp('1+2*3を表示', '7')
    await cmp('A=30;「--{A}--」を表示', '--30--')
  })
  it('存在1', async () => {
    await cmp('「/xxx/xxx/xxx/xxx」が存在;もしそうならば;「NG」と表示。違えば「OK」と表示。', 'OK')
  })
  it('存在2', async () => {
    await cmp('「' + testFileMe + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('フォルダ存在', async () => {
    const dir = __dirname
    await cmp('「' + dir + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
    await cmp('「' + dir + '/xxx」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'NG')
  })
  it('ASSERT', async () => {
    cmd('3と3がASSERT等')
  })
  it('環境変数取得', async () => {
    const path = process.env.PATH
    await cmp('「PATH」の環境変数取得して表示。', path)
  })
  it('ファイルサイズ取得', async () => {
    await cmp('「' + testFileMe + '」のファイルサイズ取得;もし、それが2000以上ならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('ファイル情報取得', async () => {
    await cmp('「' + testFileMe + '」のファイル情報取得;もし、それ["size"]が2000以上ならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('クリップボード', async () => {
    try {
      const rnd = 'a' + Math.random()
      await cmp('クリップボード="' + rnd + '";クリップボードを表示。', rnd)
    } catch (err) {
      // テストは必須ではない(Linuxコンソール環境に配慮)
    }
  })
  it('文字エンコーディング', async () => {
    const sjisfile = path.join(__dirname, 'sjis.txt')
    await cmp(`「${sjisfile}」をバイナリ読む。` +
      'SJIS取得。CSV取得してCに代入。C[2][1]を表示',
    'ホームセンター')
    await cmp(`「${sjisfile}」をバイナリ読む。` +
      '「Shift_JIS」からエンコーディング取得。' +
      'CSV取得してCに代入。C[2][1]を表示',
    'ホームセンター')
  })
  it('ハッシュ値計算', async () => {
    await cmp('「hello world」を「sha256」の「base64」でハッシュ値計算して表示。', 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=')
    await cmp('「hello world」を「sha256」の「hex」でハッシュ値計算して表示。', 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
    await cmp('「some data to hash」を「sha256」の「hex」でハッシュ値計算して表示。', '6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50')
  })
  it('テンポラリフォルダ', async () => {
    await cmp('F=「{テンポラリフォルダ}/test.txt」;「abc」をFに保存。Fを読んでトリムして表示。', 'abc')
  })
  it('圧縮解凍', async () => {
    let path7z = '7z'
    if (process.platform === 'win32') {
      path7z = path.join(__dirname, '../../bin/7z.exe')
    }
    const code = 'FIN=「' + testFileMe + '」;' +
      'テンポラリフォルダへ一時フォルダ作成してTMPに代入;' +
      '『' + path7z + '』に圧縮解凍ツールパス変更;' +
      'もし、TMPが存在しないならば、TMPのフォルダ作成。' +
      'FZIP=「{TMP}/test.zip」;\n' +
      'FINをFZIPへ圧縮。FZIPを「{TMP}/」に解凍。\n' +
      'S1=「{TMP}/plugin_node_test.mjs」を読む。\n' +
      'S2=FINを読む。\n' +
      'もし(S1＝S2)ならば、"OK"と表示。\n'
    await cmp(code, 'OK')
  })
  it('圧縮/解凍', async function () {
    if (process.platform === 'win32') { return this.skip() }
    try { execSync('which 7z').toString() } catch (e) { return this.skip() }
    const tmp = fs.mkdtempSync(os.tmpdir())
    const pathSrc = `TMP="${tmp}";FILE=「{TMP}/test.txt」;ZIP=「{TMP}/test.zip」;`
    await cmp(`${pathSrc}FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。`, 'ok')
    await cmp(`${pathSrc}FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
  it('圧縮/解凍 - OSコマンドインジェクション対策がなされているか #1325', async function () {
    // 7z がない環境ではテストを飛ばす
    if (process.platform === 'win32') {
      return this.skip()
    } else {
      try { execSync('which 7z').toString() } catch (e) { return this.skip() }
    }
    const tmp = fs.mkdtempSync(os.tmpdir())
    // (1) 元ファイルへのインジェクション
    const pathSrc = '' +
      `TMP="${tmp}"\n` +
      'FILE=「{TMP}/`touch hoge`.txt」;ZIP=「{TMP}/test.zip」\n'
    await cmp(pathSrc +
        'F=「{TMP}/hoge」;Fが存在;もしそうならば、Fをファイル削除;' +
        'FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。', 'ok')
    await cmp(`${pathSrc}「{TMP}/hoge」が存在。もし,そうならば「OS_INJECTION」と表示。`, '')
    await cmp(`${pathSrc}FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリム。それを表示。`, 'abc')
    // (2) ZIPファイルへのインジェクション
    const pathSrc2 = '' +
      `TMP="${tmp}"\n` +
      'FILE=「{TMP}/test2.txt」;ZIP=「{TMP}/`touch bbb`.zip」;'
    await cmp(pathSrc2 +
        'F=「{TMP}/bbb」;Fが存在;もしそうならば、Fをファイル削除;' +
        'FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。', 'ok')
    await cmp(`${pathSrc2}「{TMP}/bbb」が存在。もし,そうならば「OS_INJECTION」と表示。`, '')
    await cmp(`${pathSrc2}FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
})
