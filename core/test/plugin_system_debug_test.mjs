/* eslint-disable no-undef */
/**
 * plugin_system_debug.mts のテスト (#2351)
 *
 * plugin_system.mts から分割した「特殊命令」「デバッグ支援」「プラグイン管理」の
 * 命令が、分割後も plugin_system の一部として正しく動作することを確認する。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import PluginSystem from '../src/plugin_system.mjs'
import PluginSystemDebug from '../src/plugin_system_debug.mjs'

describe('plugin_system_debug_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.getLogger().debug('code=' + code)
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, res)
  }

  // --- 分割ファイルの構造 ---
  it('分割ファイルはメタ情報や初期化を持たない', async () => {
    assert.strictEqual(PluginSystemDebug.meta, undefined)
    assert.strictEqual(PluginSystemDebug['初期化'], undefined)
    assert.strictEqual(PluginSystemDebug['!クリア'], undefined)
  })
  it('分割ファイルの命令が plugin_system にマージされている', async () => {
    for (const key of Object.keys(PluginSystemDebug)) {
      assert.strictEqual(PluginSystem[key], PluginSystemDebug[key], `『${key}』がマージされていません`)
    }
  })
  it('分割してもプラグインは plugin_system のまま', async () => {
    assert.strictEqual(PluginSystem.meta.value.pluginName, 'plugin_system')
    await cmp('プラグイン一覧取得して「:」で配列結合して表示', 'plugin_system:plugin_math:plugin_promise:plugin_test:plugin_csv:plugin_toml')
  })

  // --- 特殊命令 ---
  it('特殊命令 - JS実行', async () => {
    await cmp('「3*7」をJS実行して表示', '21')
  })
  it('特殊命令 - JS関数実行', async () => {
    await cmp('「Math.max」を[3,9,5]でJS関数実行して表示', '9')
  })
  it('特殊命令 - JSメソッド実行', async () => {
    await cmp('「[1,2,3]」の「join」を[「-」]でJSメソッド実行して表示', '1-2-3')
  })
  it('特殊命令 - JSオブジェクト取得', async () => {
    await cmp('A=5;「A」のJSオブジェクト取得して表示', '5')
  })
  it('特殊命令 - 実行', async () => {
    await cmp('F=関数()\n「呼ばれた」を表示\nここまで\nFを実行', '呼ばれた')
    await cmp('●テスト関数とは\n「OK」を表示\nここまで\n「テスト関数」を実行', 'OK')
    // 関数でも文字列(関数名)でもない値はそのまま返る (#938)
    await cmp('123を実行して表示', '123')
  })
  it('特殊命令 - 実行時間計測', async () => {
    await cmp('F=関数()\nそれは1\nここまで\nFの実行時間計測;もし、(それ>=0)ならば「OK」を表示', 'OK')
  })
  it('特殊命令 - AWAIT実行', async () => {
    const nako = new NakoCompiler()
    const code = 'F=「a=>a*2」をJS実行\nFを[21]でAWAIT実行して表示'
    const g = await nako.runAsync(code, 'main.nako3')
    // AWAIT実行はPromiseをawaitするため、実行完了までイベントループを1tick進める
    await new Promise((resolve) => setTimeout(resolve, 10))
    assert.strictEqual(g.log, '42')
  })
  it('特殊命令 - ナデシコ', async () => {
    await cmp('『「なでしこ」を表示』をナデシコ', 'なでしこ')
  })

  // --- デバッグ支援 ---
  it('デバッグ支援 - デバッグ表示', async () => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync('「メッセージ」をデバッグ表示', 'main.nako3')
    // 「ファイル名(行番号): メッセージ」の形式で出力される
    assert.ok(g.log.indexOf('メッセージ') >= 0, `想定外の出力: ${g.log}`)
    assert.ok(g.log.indexOf('main.nako3') >= 0, `想定外の出力: ${g.log}`)
  })
  it('デバッグ支援 - ハテナ関数設定と実行', async () => {
    await cmp('「表示」をハテナ関数設定; ?? 2*5', '10')
    await cmp('["JSON_E","表示"]をハテナ関数設定; ?? [1,2]', '[1,2]')
  })
  it('デバッグ支援 - エラー発生', async () => {
    const nako = new NakoCompiler()
    try {
      await nako.runAsync('「わざとエラー」のエラー発生', 'main.nako3')
    } catch (err) {
      assert.ok(String(err.message).indexOf('わざとエラー') >= 0)
      return
    }
    assert.fail('エラーが発生しませんでした')
  })
  it('デバッグ支援 - システム関数一覧取得', async () => {
    await cmp('A=システム関数一覧取得;I=Aから「表示」を配列検索;もし、(I>=0)ならば「OK」を表示', 'OK')
    // 分割ファイル側の命令も一覧に含まれる
    await cmp('A=システム関数一覧取得;I=Aから「デバッグ表示」を配列検索;もし、(I>=0)ならば「OK」を表示', 'OK')
  })
  it('デバッグ支援 - システム関数存在', async () => {
    await cmp('もし、「デバッグ表示」のシステム関数存在ならば「OK」を表示', 'OK')
    await cmp('もし、「存在しない命令XYZ」のシステム関数存在でなければ「OK」を表示', 'OK')
  })
  it('デバッグ支援 - グローバル関数一覧取得', async () => {
    // ユーザー定義関数は「モジュール名__関数名」の形式で登録される
    await cmp(
      '●ホゲとは\n' +
      'それは1\n' +
      'ここまで\n' +
      'A=グローバル関数一覧取得\n' +
      'I=Aから「main__ホゲ」を配列検索\n' +
      'もし、(I>=0)ならば「OK」を表示',
      'OK')
  })
  it('デバッグ支援 - モジュール一覧取得', async () => {
    await cmp('A=モジュール一覧取得;もし、(Aの配列要素数)>=0ならば「OK」を表示', 'OK')
  })
  it('デバッグ支援 - 助詞一覧取得と予約語一覧取得', async () => {
    await cmp('A=助詞一覧取得;もし、(Aの配列要素数)>0ならば「OK」を表示', 'OK')
    await cmp('A=予約語一覧取得;もし、(Aの配列要素数)>0ならば「OK」を表示', 'OK')
  })

  // --- プラグイン管理 ---
  it('プラグイン管理 - プラグイン名', async () => {
    await cmp('プラグイン名を表示', 'メイン')
  })
  it('プラグイン管理 - プラグイン名設定', async () => {
    await cmp('「テストプラグイン」にプラグイン名設定;プラグイン名を表示', 'テストプラグイン')
  })
  it('プラグイン管理 - 名前空間設定と名前空間ポップ', async () => {
    await cmp('「サブ空間」に名前空間設定;名前空間を表示;名前空間ポップ', 'サブ空間')
    // ポップすると設定前の名前空間に戻る
    await cmp('元=名前空間;「サブ空間」に名前空間設定;名前空間ポップ;もし、(名前空間=元)ならば「OK」を表示', 'OK')
  })
})
