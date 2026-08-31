import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testRoot, '../..')
const cnako3Path = path.join(projectRoot, 'src/cnako3.mjs')
const jsplugin2textPath = path.join(projectRoot, 'batch/jsplugin2text.nako3')
const commandListPath = path.join(projectRoot, 'doc/command_list.json')

/** summarizePlugin の結果を覚えておくキャッシュ(同じプラグインを何度も解析しないため) */
const summaryCache = new Map()

/**
 * jsplugin2text.nako3 で命令一覧テキストを作り、行を分解して返す
 * @param {string} pluginPath プロジェクトルートからの相対パス
 */
function summarizePlugin (pluginPath) {
  const cached = summaryCache.get(pluginPath)
  if (cached) { return cached }
  const result = spawnSync(process.execPath, [cnako3Path, jsplugin2textPath, pluginPath], {
    cwd: projectRoot,
    encoding: 'utf8'
  })
  assert.strictEqual(result.status, 0, result.stderr)
  const commands = result.stdout.split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) => {
      const cols = line.split('|').map((s) => s.trim())
      // cols[0] は「|」の前の空文字列
      return { type: cols[1], name: cols[2], args: cols[3], url: cols[6] }
    })
  summaryCache.set(pluginPath, commands)
  return commands
}

/**
 * プラグインの命令名の集合を返す
 * @param {string} pluginPath プロジェクトルートからの相対パス
 */
function pluginNames (pluginPath) {
  return new Set(summarizePlugin(pluginPath).map((c) => c.name))
}

describe('命令一覧の生成 (#2401)', () => {
  // plugin_system.mts は分割ファイルをimportしているため、
  // 分割ファイルだけを読んで本体を読み飛ばす不具合があった
  it('plugin_system.mts 自身が持つ命令を取りこぼさない', () => {
    const commands = summarizePlugin('core/src/plugin_system.mts')
    const names = new Set(commands.map((c) => c.name))
    for (const name of ['改行', 'タブ', '空', 'はい', 'いいえ', 'PI', '対象', '回数']) {
      assert.ok(names.has(name), `plugin_system.mts の『${name}』が命令一覧にありません`)
    }
  })

  it('importしている plugin_system_*.mts の命令も取り込む', () => {
    const commands = summarizePlugin('core/src/plugin_system.mts')
    const names = new Set(commands.map((c) => c.name))
    // 足=math, 文字数=string, 配列切取=array, 今日=datetime, JS実行=debug, URLエンコード=url
    for (const name of ['足', '文字数', '配列切取', '今日', 'JS実行', 'URLエンコード']) {
      assert.ok(names.has(name), `分割ファイルの『${name}』が命令一覧にありません`)
    }
  })

  it('分割ファイルのソースURLが core/src を指す', () => {
    const commands = summarizePlugin('core/src/plugin_system.mts')
    const target = commands.find((c) => c.name === '足')
    assert.ok(target, '『足』が見つかりません')
    assert.match(target.url, /\/master\/core\/src\/plugin_system_math\.mts#L\d+$/)
  })

  // 「無いこと」だけを確かめると、命令一覧の生成が壊れて空になってもテストが通ってしまう。
  // そこで、生きている代表的な命令が取れているかを先に確かめる
  it('3つのプラグインの代表的な命令を取りこぼさない (#2234)', () => {
    // plugin_system: 本体(表示)と分割ファイル(math/string/array/json/timer/datetime)から
    const systemNames = pluginNames('core/src/plugin_system.mts')
    for (const name of ['表示', '足', '文字数', '配列切取', 'JSONエンコード', '秒待', '今日']) {
      assert.ok(systemNames.has(name), `plugin_system の『${name}』が命令一覧にありません`)
    }
    // plugin_browser: 分割ファイル(ajax/canvas/dom_basic/storage/speech/color)から
    const browserNames = pluginNames('src/plugin_browser.mts')
    for (const name of ['AJAXテキスト取得', '描画開始', 'DOCUMENT', '保存', '話', '水色']) {
      assert.ok(browserNames.has(name), `plugin_browser の『${name}』が命令一覧にありません`)
    }
    // plugin_node: ファイル/フォルダ/プロセス/OS/ネット/文字コード/ハッシュの各分野から
    const nodeNames = pluginNames('src/plugin_node.mts')
    for (const name of ['開', '存在', 'ファイル列挙', '起動待機', 'OS取得', 'DISCORD送信', 'SJIS変換', 'ハッシュ値計算']) {
      assert.ok(nodeNames.has(name), `plugin_node の『${name}』が命令一覧にありません`)
    }
  })

  it('廃止した命令と定数を含まない (#2234)', () => {
    const systemNames = pluginNames('core/src/plugin_system.mts')
    const browserNames = pluginNames('src/plugin_browser.mts')
    const nodeNames = pluginNames('src/plugin_node.mts')
    // 代表的な命令が取れていることは、ひとつ前のテストで確認している
    assert.ok(systemNames.size > 0 && browserNames.size > 0 && nodeNames.size > 0)
    for (const name of ['JSON_D', 'JSON_E', 'JSON_ES', '秒逐次待機']) {
      assert.ok(!systemNames.has(name), `廃止した『${name}』が命令一覧に残っています`)
    }
    for (const name of ['AJAX逐次送信', 'HTTP逐次取得', 'POST逐次送信', 'POSTフォーム逐次送信']) {
      assert.ok(!browserNames.has(name), `廃止した『${name}』が命令一覧に残っています`)
    }
    for (const name of ['LINE送信', 'LINE画像送信']) {
      assert.ok(!nodeNames.has(name), `廃止した『${name}』が命令一覧に残っています`)
    }
  })
})

describe('release/command_cnako3.json', () => {
  // command.txt と release/*.json はビルド生成物 (gitignore対象) なので、
  // テスト内で生成してから検証する
  // 拡張プラグインが手元に無くても REPORT_ERR 未設定なら読み飛ばして生成できる
  const runBatch = (/** @type {string} */nako3) => {
    const r = spawnSync(process.execPath, [cnako3Path, path.join(projectRoot, 'batch', nako3)], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, REPORT_ERR: '' }
    })
    assert.strictEqual(r.status, 0, `${nako3}: ${r.stderr}`)
  }

  it('URL欄にソースコードのURLが入る', () => {
    runBatch('pickup_command.nako3')
    runBatch('cmd_txt2json.nako3')
    const commands = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'release/command_cnako3.json'), 'utf8'))
    // 列のズレでヨミガナがURL欄に入ってしまう不具合があった
    const invalid = Object.values(commands)
      .filter((c) => !String(c.URL).startsWith('https://'))
      .map((c) => `${c.名前}: ${c.URL}`)
    assert.deepStrictEqual(invalid, [])
    assert.match(commands['改行'].URL, /\/master\/core\/src\/plugin_system\.mts#L\d+$/)
  })
})

describe('doc/command_list.json', () => {
  const commandList = JSON.parse(fs.readFileSync(commandListPath, 'utf8'))

  it('plugin_system の命令のURLがすべて core/src を指す', () => {
    const invalid = commandList
      .filter((c) => c.plugin === 'plugin_system')
      .filter((c) => !c.url.includes('/master/core/src/'))
      .map((c) => `${c.name}: ${c.url}`)
    assert.deepStrictEqual(invalid, [])
  })

  it('plugin_system.mts 本体のシステム定数が含まれる', () => {
    for (const name of ['改行', 'タブ', '空', 'はい']) {
      const item = commandList.find((c) => c.name === name && c.plugin === 'plugin_system')
      assert.ok(item, `command_list.json に『${name}』がありません`)
    }
  })

  it('廃止した命令と定数を含まない (#2234)', () => {
    const names = new Set(commandList.map((c) => c.name))
    const removedNames = [
      'JSON_D', 'JSON_E', 'JSON_ES',
      'AJAX逐次送信', 'HTTP逐次取得', 'POST逐次送信', 'POSTフォーム逐次送信', '秒逐次待機',
      'LINE送信', 'LINE画像送信'
    ]
    for (const name of removedNames) {
      assert.ok(!names.has(name), `廃止した『${name}』が command_list.json に残っています`)
    }
  })
})
