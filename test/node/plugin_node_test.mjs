/* eslint-disable no-undef */
import os from 'os'
import fs from 'node:fs'
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

async function cmp(/** @type {string} */code, /** @type {string} */res, /** @type {number} */ms=10) {
  // (原則) EvalやFunctionの中で行う非同期処理は、その中で行うこと！
  // @see https://qiita.com/kujirahand/items/880917172bb0de8d30b9
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
  nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
  const g = await nako.runAsync(code, 'main')
  await forceWait(ms)
  assert.strictEqual(g.log, res) // 強制的に指定ミリ秒待つ
  return g
}
// 強制的にミリ秒待機
function forceWait(/** @type {number} */ms) {
  return /** @type {Promise<void>} */(new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, ms);
  }));
}

const cmd = async (/** @type {string} */ code) => {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
  nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
  await nako.runAsync(code, 'main')
}
function get7zPath() {
  if (process.platform === 'linux') { // Linuxならパスを調べる
    if (fs.existsSync('/usr/bin/7z')) { return '/usr/bin/7z' }
  }
  if (process.platform === 'darwin') { // macOSでもパスを調べる
    const appleSilicon = '/opt/homebrew/bin/7z'
    if (fs.existsSync(appleSilicon)) { return appleSilicon }
    const intelMac = '/usr/local/bin/7z'
    if (fs.existsSync(intelMac)) { return intelMac }
  }
  if (process.platform === 'win32') {
    const path7z = path.join(__dirname, '../../bin/7z.exe')
    if (!fs.existsSync(path7z)) { return path7z }
  }
  return '' // なし
}

describe('plugin_node_test', () => {
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
    await cmp('「PATH」の環境変数取得して表示。', path || '')
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
    await cmp('F=「{テンポラリフォルダ}/test.txt」;「abc」をFに保存。S=Fを読む。Sを表示。', 'abc', 100)
    // await cmp('F=「{テンポラリフォルダ}/test.txt」;「abc」をFに保存。Fを読んでトリムして表示。', 'abc')
  })
  it('圧縮解凍', async function () {
    let path7z = get7zPath()
    if (path7z === '') { return this.skip() }
    let tmp = '/tmp'
    if (process.platform === 'linux') {
      tmp = path.join(os.tmpdir(), 'nadesiko3test')
    } else {
      tmp = fs.mkdtempSync(os.tmpdir())
    }
    const code = 'FIN=「' + testFileMe + '」;' +
      `TMP=「${tmp}」へ一時フォルダ作成。` +
      '『' + path7z + '』に圧縮解凍ツールパス変更;' +
      'もし、TMPが存在しないならば、TMPのフォルダ作成。' +
      'FZIP=「{TMP}/test.zip」;\n' +
      'FINをFZIPへ圧縮。FZIPを「{TMP}/」に解凍。\n' +
      'S1=「{TMP}/plugin_node_test.mjs」を読む。\n' +
      'S2=FINを読む。\n' +
      'もし(S1＝S2)ならば、"OK"と表示。\n'
    await cmp(code, 'OK', 300)
  })
  it('圧縮/解凍', async function () {
    // 7zip がない環境ではテストを飛ばす
    let path7z = get7zPath()
    if (path7z === '') { return this.skip() }
    // なぜかGitHubでエラーになるので飛ばす
    if (process.platform !== 'darwin') { return this.skip() }
    // テスト
    let tmp = '/tmp'
    if (process.platform === 'linux') {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nadesiko3zip-test'))
    } else {
      tmp = fs.mkdtempSync(os.tmpdir())
    }
    const pathSrc = `TMP="${tmp}";FILE=「{TMP}/test.txt」;ZIP=「{TMP}/test.zip」;`
    await cmp(`${pathSrc}FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。`, 'ok')
    await cmp(`${pathSrc}FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
  it('圧縮/解凍 - OSコマンドインジェクション対策がなされているか #1325', async function () {
    // 7z がない環境ではテストを飛ばす
    let path7z = get7zPath()
    if (path7z === '') { return this.skip() }
    // なぜかGitHubでエラーになるので飛ばす
    if (process.platform !== 'darwin') { return this.skip() }
    // 一時フォルダを作成
    let tmp = '/tmp'
    if (process.platform === 'linux') {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'test_nako3zip'))
    } else {
      tmp = fs.mkdtempSync(os.tmpdir())
    }
    // (1) 元ファイルへのインジェクション
    const pathSrc = '' +
      `TMP="${tmp}"\n` +
      'FILE=「{TMP}/`touch hoge`.txt」;ZIP=「{TMP}/test.zip」\n'
    await cmp(pathSrc +
        'F=「{TMP}/hoge」;Fが存在;もしそうならば、Fをファイル削除;' +
        'FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。', 'ok', 200)
    await cmp(`${pathSrc}「{TMP}/hoge」が存在。もし,そうならば「OS_INJECTION」と表示。`, '', 50)
    await cmp(`${pathSrc}FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリム。それを表示。`, 'abc', 50)
    // (2) ZIPファイルへのインジェクション
    const pathSrc2 = '' +
      `TMP="${tmp}"\n` +
      'FILE=「{TMP}/test2.txt」;ZIP=「{TMP}/`touch bbb`.zip」;'
    await cmp(pathSrc2 +
        'F=「{TMP}/bbb」;Fが存在;もしそうならば、Fをファイル削除;' +
        'FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。', 'ok', 200)
    await cmp(`${pathSrc2};「{TMP}/bbb」が存在。もし,そうならば「OS_INJECTION」と表示。`, '')
    await cmp(`${pathSrc2};FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリムして表示。`, 'abc')
  })
  it('圧縮/解凍 - OSコマンドインジェクション対策(修正が不完全だった件の修正) #1325', async function () {
    // 7z がない環境ではテストを飛ばす
    let path7z = get7zPath()
    if (path7z === '') { return this.skip() }
    // なぜかGitHubでエラーになるので飛ばす
    if (process.platform !== 'darwin') { return this.skip() }
    //
    let tmp = '/tmp'
    if (process.platform === 'linux') {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'test_nako3zip'))
    } else {
      tmp = fs.mkdtempSync(os.tmpdir())
    }
    // (1) 元ファイルへのインジェクション
    const pathSrc = '' +
      `TMP="${tmp}"\n` +
      'FILE=「{TMP}/\'a\'`touch xxx`\'c」;ZIP=「{TMP}/test.zip」\n'
    const code1 = pathSrc +
      'F=「{TMP}/xxx」;Fが存在;もしそうならば、Fをファイル削除;' +
      'FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。'
    await cmp(code1, 'ok', 200)
    await cmp(`${pathSrc}「{TMP}/xxx」が存在。もし,そうならば「OS_INJECTION」と表示。`, '')
    await cmp(`${pathSrc}FILEをファイル削除。ZIPをTMPに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
})
