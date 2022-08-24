/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../../core/src/nako3.mjs'
import path from 'path'
import PluginNode from '../../src/plugin_node.mjs'
import PluginCSV from '../../core/src/plugin_csv.mjs'
import { execSync } from 'child_process'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testFileMe = path.join(__dirname, 'plugin_node_test.js')

describe('plugin_node_test', () => {
  const nako = new NakoCompiler()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
  nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
  const cmp = async (/** @type {string} */ code, /** @type {string | undefined} */ res) => {
    nako.getLogger().debug('code=' + code)
    assert.strictEqual((await nako.run(code)).log, res)
  }
  const cmd = (/** @type {string} */ code) => {
    nako.getLogger().debug('code=' + code)
    nako.run(code)
  }
  // --- test ---
  it('表示', () => {
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  })
  it('存在1', () => {
    cmp('「/xxx/xxx/xxx/xxx」が存在;もしそうならば;「NG」と表示。違えば「OK」と表示。', 'OK')
  })
  it('存在2', () => {
    cmp('「' + testFileMe + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('フォルダ存在', () => {
    const dir = __dirname
    cmp('「' + dir + '」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'OK')
    cmp('「' + dir + '/xxx」が存在;もしそうならば;「OK」と表示。違えば「NG」と表示。', 'NG')
  })
  it('ASSERT', () => {
    cmd('3と3がASSERT等')
  })
  it('環境変数取得', () => {
    const path = process.env.PATH
    cmp('「PATH」の環境変数取得して表示。', path)
  })
  it('ファイルサイズ取得', () => {
    cmp('「' + testFileMe + '」のファイルサイズ取得;もし、それが2000以上ならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('ファイル情報取得', () => {
    cmp('「' + testFileMe + '」のファイル情報取得;もし、それ["size"]が2000以上ならば;「OK」と表示。違えば「NG」と表示。', 'OK')
  })
  it('クリップボード', () => {
    try {
      const rnd = 'a' + Math.random()
      cmp('クリップボード="' + rnd + '";クリップボードを表示。', rnd)
    } catch (err) {
      // テストは必須ではない(Linuxコンソール環境に配慮)
    }
  })
  it('文字エンコーディング', () => {
    const sjisfile = path.join(__dirname, 'sjis.txt')
    cmp(`「${sjisfile}」をバイナリ読む。` +
      'SJIS取得。CSV取得してCに代入。C[2][1]を表示',
    'ホームセンター')
    cmp(`「${sjisfile}」をバイナリ読む。` +
      '「Shift_JIS」からエンコーディング取得。' +
      'CSV取得してCに代入。C[2][1]を表示',
    'ホームセンター')
  })
  it('ハッシュ値計算', () => {
    cmp('「hello world」を「sha256」の「base64」でハッシュ値計算して表示。', 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=')
    cmp('「hello world」を「sha256」の「hex」でハッシュ値計算して表示。', 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')
    cmp('「some data to hash」を「sha256」の「hex」でハッシュ値計算して表示。', '6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50')
  })
  it('テンポラリフォルダ', () => {
    cmp('F=「{テンポラリフォルダ}/test.txt」;「abc」をFに保存。Fを読んでトリムして表示。', 'abc')
  })
  it('圧縮解凍', () => {
    let path7z = '7z'
    if (process.platform === 'win32') {
      path7z = path.join(__dirname, '../../bin/7z.exe')
    }
    cmp('FIN=「' + testFileMe + '」;' +
      'TMP=テンポラリフォルダ;' +
      '『' + path7z + '』に圧縮解凍ツールパス変更;' +
      'もし、!(TMPが存在する)ならば、TMPのフォルダ作成。' +
      'FZIP=「{TMP}/test.zip」;\n' +
      'FINをFZIPへ圧縮。FZIPを「{TMP}/」に解凍。\n' +
      'S1=「{TMP}/plugin_node_test.js」を読む。\n' +
      'S2=FINを読む。\n' +
      'もし(S1＝S2)ならば、"OK"と表示。\n', 'OK')
  })
  it('圧縮/解凍', function () {
    if (process.platform === 'win32') { return this.skip() }
    try { execSync('which 7z').toString() } catch (e) { return this.skip() }
    const pathSrc = 'FILE=「{テンポラリフォルダ}/test.txt」;ZIP=「{テンポラリフォルダ}/test.zip」;'
    cmp(`${pathSrc}FILEへ「abc」を保存。FILEをZIPに圧縮。ZIPが存在。もし,そうならば「ok」と表示。`, 'ok')
    cmp(`${pathSrc}FILEをファイル削除。ZIPをテンポラリフォルダに解凍。FILEを読む。トリム。それを表示。`, 'abc')
  })
  it('圧縮/解凍 - OSコマンドインジェクション対策がなされているか #1325', function () {
    // 7z がない環境ではテストを飛ばす
    if (process.platform === 'win32') {
      return this.skip()
    } else {
      try { execSync('which 7z').toString() } catch (e) { return this.skip() }
    }
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
