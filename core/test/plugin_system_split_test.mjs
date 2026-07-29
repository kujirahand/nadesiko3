/* eslint-disable no-undef */
/**
 * plugin_system.mts の分割ファイルのテスト (#2351)
 *
 * 肥大化した plugin_system.mts を役割ごとに以下へ分割した。
 *   - plugin_system_math.mts     : 四則演算・論理演算・ビット演算
 *   - plugin_system_string.mts   : 文字列処理・置換/トリム・文字変換・指定形式・文字種類
 *   - plugin_system_array.mts    : 配列操作・二次元配列処理
 *   - plugin_system_datetime.mts : 日時処理(簡易)
 *   - plugin_system_url.mts      : URLエンコード・パラメータ・BASE64・パス操作
 *   - plugin_system_types.mts    : 型変換
 *   - plugin_system_json.mts     : JSON
 *   - plugin_system_regexp.mts   : 正規表現
 *   - plugin_system_dict.mts     : 辞書型変数の操作・ハッシュ
 *   - plugin_system_stdio.mts    : 標準出力
 *   - plugin_system_timer.mts    : タイマー処理
 * いずれも単独のプラグインではなく、plugin_system.mts に実行時マージされる。
 * 個々の命令の詳細な動作テストは plugin_system_test.mjs で従来通りカバーされているため、
 * ここでは「分割ファイルが正しくマージされているか」と代表的な命令の疎通確認を行う。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import PluginSystem from '../src/plugin_system.mjs'
import PluginSystemMath from '../src/plugin_system_math.mjs'
import PluginSystemString from '../src/plugin_system_string.mjs'
import PluginSystemArray from '../src/plugin_system_array.mjs'
import PluginSystemDatetime from '../src/plugin_system_datetime.mjs'
import PluginSystemUrl from '../src/plugin_system_url.mjs'
import PluginSystemTypes from '../src/plugin_system_types.mjs'
import PluginSystemJson from '../src/plugin_system_json.mjs'
import PluginSystemRegexp from '../src/plugin_system_regexp.mjs'
import PluginSystemDict from '../src/plugin_system_dict.mjs'
import PluginSystemStdio from '../src/plugin_system_stdio.mjs'
import PluginSystemTimer from '../src/plugin_system_timer.mjs'

describe('plugin_system_split_test', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.getLogger().debug('code=' + code)
    const g = await nako.runAsync(code, 'main.nako3')
    assert.strictEqual(g.log, res)
  }

  const parts = {
    math: PluginSystemMath,
    string: PluginSystemString,
    array: PluginSystemArray,
    datetime: PluginSystemDatetime,
    url: PluginSystemUrl,
    types: PluginSystemTypes,
    json: PluginSystemJson,
    regexp: PluginSystemRegexp,
    dict: PluginSystemDict,
    stdio: PluginSystemStdio,
    timer: PluginSystemTimer
  }

  it('分割ファイルはメタ情報や初期化を持たない', async () => {
    for (const [name, part] of Object.entries(parts)) {
      assert.strictEqual(part.meta, undefined, `${name}にmetaがあります`)
      assert.strictEqual(part['初期化'], undefined, `${name}に初期化があります`)
      assert.strictEqual(part['!クリア'], undefined, `${name}に!クリアがあります`)
    }
  })

  it('分割ファイルの命令が plugin_system にマージされている', async () => {
    for (const [name, part] of Object.entries(parts)) {
      for (const key of Object.keys(part)) {
        assert.strictEqual(PluginSystem[key], part[key], `${name}の『${key}』がマージされていません`)
      }
    }
  })

  it('分割してもプラグインは plugin_system のまま', async () => {
    assert.strictEqual(PluginSystem.meta.value.pluginName, 'plugin_system')
    await cmp('プラグイン一覧取得して「:」で配列結合して表示', 'plugin_system:plugin_math:plugin_promise:plugin_test:plugin_csv:plugin_toml')
  })

  // --- plugin_system_math.mts の疎通確認 ---
  it('四則演算', async () => {
    await cmp('3に4を掛けて表示', '12')
  })
  it('論理演算', async () => {
    await cmp('もし、(1と1の論理AND)ならば「OK」を表示', 'OK')
  })
  it('ビット演算', async () => {
    await cmp('5と3のANDを表示', '1')
  })

  // --- plugin_system_string.mts の疎通確認 ---
  it('文字列処理', async () => {
    await cmp('「なでしこ」の文字数を表示', '4')
  })
  it('置換・トリム', async () => {
    await cmp('「  殿  」のトリムを表示', '殿')
  })
  it('文字変換', async () => {
    await cmp('「abc」の大文字変換を表示', 'ABC')
  })
  it('指定形式', async () => {
    await cmp('123を5でゼロ埋して表示', '00123')
  })
  it('文字種類', async () => {
    await cmp('もし、「あ」のかなか判定ならば「OK」を表示', 'OK')
  })

  // --- plugin_system_array.mts の疎通確認 ---
  it('配列操作', async () => {
    await cmp('[1,2,3]を「-」で配列結合して表示', '1-2-3')
  })
  it('二次元配列処理', async () => {
    const g = await new NakoCompiler().runAsync('A=[[3,1],[1,2]];Aの0を表ソート;Aを JSON変換して表示', 'main.nako3')
    assert.strictEqual(g.log, '[[1,2],[3,1]]')
  })

  // --- plugin_system_datetime.mts の疎通確認 ---
  it('日時処理(簡易)', async () => {
    await cmp('「2024/01/01」の曜日を表示', '月')
  })

  // --- plugin_system_url.mts の疎通確認 ---
  it('URLエンコード・デコード', async () => {
    await cmp('「あ」をURLエンコードしてURLデコードして表示', 'あ')
  })
  it('BASE64', async () => {
    await cmp('「なでしこ」をBASE64エンコードしてBASE64デコードして表示', 'なでしこ')
  })
  it('パス操作', async () => {
    await cmp('「/a/b/c.txt」のファイル名抽出を表示', 'c.txt')
    await cmp('「/a/b/c.txt」の拡張子抽出を表示', '.txt')
  })

  // --- plugin_system_types.mts の疎通確認 ---
  it('型変換', async () => {
    await cmp('「3.14」を文字列変換して表示', '3.14')
    await cmp('「3.14」を整数変換して表示', '3')
    await cmp('TYPEOF(123)を表示', 'number')
    await cmp('3と4の5でRGBを表示', '#030405')
  })

  // --- plugin_system_json.mts の疎通確認 ---
  it('JSON', async () => {
    await cmp('[1,2,3]をJSON変換して表示', '[1,2,3]')
    await cmp('「[1,2,3]」をJSON取得してJSON変換して表示', '[1,2,3]')
  })

  // --- plugin_system_regexp.mts の疎通確認 ---
  it('正規表現', async () => {
    await cmp('「abc123」を『/([a-z]+)(\\d+)/』で正規表現マッチして表示', 'abc123')
    await cmp('「abc123」を『/([a-z]+)(\\d+)/』で正規表現マッチ;抽出文字列を「,」で配列結合して表示', 'abc,123')
  })

  // --- plugin_system_dict.mts の疎通確認 ---
  it('辞書型変数の操作', async () => {
    await cmp('A={"a":1,"b":2};Aの辞書キー列挙を「,」で配列結合して表示', 'a,b')
  })
  it('ハッシュ', async () => {
    await cmp('A={"a":1,"b":2};Aのハッシュキー列挙を「,」で配列結合して表示', 'a,b')
  })

  // --- plugin_system_stdio.mts の疎通確認 ---
  it('標準出力', async () => {
    await cmp('「あ」と継続表示;「い」を表示', 'あい')
    await cmp('「a」と「b」と「c」を連続表示', 'abc')
  })

  // --- plugin_system_timer.mts の疎通確認 ---
  it('タイマー処理', async () => {
    // 秒後で発行したタイマーIDが取得でき、タイマー停止できること
    await cmp(
      'F=関数()\n' +
      'ここまで\n' +
      'Fを0.01秒後\n' +
      'もし、(対象>0)ならば「OK」を表示\n' +
      '対象のタイマー停止',
      'OK')
  })
})
