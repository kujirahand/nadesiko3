/* eslint-disable no-undef */
// batch/search_command.nako3 (命令検索CLI)のテスト (#2385)
// ラッパー batch/search_command.mjs を子プロセスとして実行して動作を確認する。
import assert from 'assert'
import path from 'path'
import url from 'url'
import { spawnSync } from 'child_process'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../')
const cliPath = path.join(rootDir, 'batch/search_command.mjs')

/** 命令検索CLIを実行して {code, stdout} を返す */
function runCLI (args) {
  const r = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: rootDir,
    encoding: 'utf-8',
    timeout: 60000
  })
  if (r.error) { throw r.error }
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' }
}

describe('search_command(命令検索CLI)', () => {
  it('検索語で部分一致検索ができる', () => {
    const r = runCLI(['ファイル'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    assert.ok(r.stdout.indexOf('件見つかりました。') >= 0)
    assert.ok(r.stdout.indexOf('ファイル') >= 0)
  })

  it('命令名が完全一致するものが先頭に表示される', () => {
    const r = runCLI(['表示', '--limit', '5'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const lines = r.stdout.split('\n').filter((s) => s.indexOf('[関数] ') === 0)
    assert.ok(lines.length > 0)
    assert.ok(lines[0].indexOf('[関数] 表示 ') === 0, lines[0])
  })

  it('--targetで実行環境を絞り込める', () => {
    const r = runCLI(['ファイル', '--target', 'cnako', '--json'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const list = JSON.parse(r.stdout)
    assert.ok(list.length > 0)
    for (const c of list) {
      assert.ok(c.target.indexOf('cnako') >= 0, JSON.stringify(c))
    }
  })

  it('--groupで基本/拡張プラグインを絞り込める(英語指定)', () => {
    const r = runCLI(['表示', '--group', 'basic', '--json'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const list = JSON.parse(r.stdout)
    assert.ok(list.length > 0)
    for (const c of list) {
      assert.strictEqual(c.group, '基本プラグイン')
    }
  })

  it('--groupは日本語でも指定できる', () => {
    // 拡張プラグインの命令は環境によって有無が変わるため、英語指定と日本語指定の
    // 結果が一致することで、日本語の指定が使えることを確認する。
    const r1 = runCLI(['表示', '--group', 'basic', '--json'])
    const r2 = runCLI(['表示', '--group', '基本プラグイン', '--json'])
    assert.strictEqual(r1.code, 0, r1.stdout + r1.stderr)
    assert.strictEqual(r2.code, r1.code)
    assert.deepStrictEqual(JSON.parse(r2.stdout), JSON.parse(r1.stdout))
    const r3 = runCLI(['ファイル', '--group', '拡張プラグイン', '--json'])
    assert.ok(r3.code === 0 || r3.code === 1, `exit=${r3.code}`)
    for (const c of JSON.parse(r3.stdout)) {
      assert.strictEqual(c.group, '拡張プラグイン')
    }
  })

  it('--plugin と --type で絞り込める', () => {
    const r = runCLI(['--plugin', 'plugin_node', '--type', '関数', '--limit', '0', '--json'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const list = JSON.parse(r.stdout)
    assert.ok(list.length > 0)
    for (const c of list) {
      assert.ok(c.plugin.indexOf('plugin_node') >= 0, c.plugin)
      assert.strictEqual(c.type, '関数')
    }
  })

  it('--option=値 の形式でも指定できる', () => {
    const r = runCLI(['ファイル', '--target=cnako', '--limit=3', '--json'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const list = JSON.parse(r.stdout)
    assert.strictEqual(list.length, 3)
  })

  it('検索語を複数指定するとAND条件になる', () => {
    const r1 = runCLI(['ファイル', '--json', '--limit', '0'])
    const r2 = runCLI(['ファイル', 'コピー', '--json', '--limit', '0'])
    assert.strictEqual(r1.code, 0)
    assert.strictEqual(r2.code, 0)
    const list1 = JSON.parse(r1.stdout)
    const list2 = JSON.parse(r2.stdout)
    assert.ok(list2.length > 0)
    assert.ok(list2.length < list1.length)
    for (const c of list2) {
      const text = `${c.name} ${c.yomi} ${c.description}`
      assert.ok(text.indexOf('コピー') >= 0, JSON.stringify(c))
    }
  })

  it('一致なしのとき終了コード1になる', () => {
    const r = runCLI(['ぜったいにない命令名XYZ'])
    assert.strictEqual(r.code, 1)
    assert.ok(r.stdout.indexOf('一致する命令は見つかりませんでした。') >= 0)
  })

  it('一致なしのJSON出力は空配列になる', () => {
    const r = runCLI(['ぜったいにない命令名XYZ', '--json'])
    assert.strictEqual(r.code, 1)
    assert.deepStrictEqual(JSON.parse(r.stdout), [])
  })

  it('JSON出力は必要なキーだけを含む', () => {
    const r = runCLI(['CSV変換', '--json'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const list = JSON.parse(r.stdout)
    assert.ok(list.length > 0)
    const keys = Object.keys(list[0]).sort()
    assert.deepStrictEqual(keys, ['args', 'description', 'group', 'name', 'plugin', 'target', 'type', 'yomi'])
    assert.strictEqual(list[0].name, 'CSV変換')
  })

  it('--limitで表示件数を制限できる', () => {
    const r = runCLI(['ファイル', '--limit', '2'])
    assert.strictEqual(r.code, 0, r.stdout + r.stderr)
    const lines = r.stdout.split('\n').filter((s) => /^\[(関数|変数|定数)\] /.test(s))
    assert.strictEqual(lines.length, 2)
    assert.ok(r.stdout.indexOf('--limit 0') >= 0)
  })

  it('--helpで使い方を表示する', () => {
    const r = runCLI(['--help'])
    assert.strictEqual(r.code, 0)
    assert.ok(r.stdout.indexOf('なでしこ3 命令検索CLI') >= 0)
    assert.ok(r.stdout.indexOf('--target') >= 0)
  })

  it('引数がないときは使い方を表示して終了コード2になる', () => {
    const r = runCLI([])
    assert.strictEqual(r.code, 2)
    assert.ok(r.stdout.indexOf('使い方:') >= 0)
  })

  it('不明なオプションは終了コード2になる', () => {
    const r = runCLI(['ファイル', '--unknown'])
    assert.strictEqual(r.code, 2)
    assert.ok(r.stdout.indexOf('不明なオプション') >= 0)
  })

  it('オプションの値がないときは終了コード2になる', () => {
    const r = runCLI(['ファイル', '--target'])
    assert.strictEqual(r.code, 2)
    assert.ok(r.stdout.indexOf('値の指定が必要です') >= 0)
  })

  it('不正な値を指定したときは終了コード2になる', () => {
    const r = runCLI(['ファイル', '--target', 'xxx'])
    assert.strictEqual(r.code, 2)
    assert.ok(r.stdout.indexOf('--target') >= 0)
  })
})
