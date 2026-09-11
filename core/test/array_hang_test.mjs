/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 実行時に無限ループすると同期処理でイベントループが止まり、
// node --test のタイムアウトでは検出できずテスト全体が固まってしまう。
// そのため、子プロセスで実行してタイムアウトを監視する。(#2470)

const testDir = path.dirname(fileURLToPath(import.meta.url))
const nako3Url = pathToFileURL(path.join(testDir, '../src/nako3.mjs')).href

const runnerScript =
  'import { NakoCompiler } from ' + JSON.stringify(nako3Url) + '\n' +
  'const nako = new NakoCompiler()\n' +
  'try {\n' +
  '  const res = await nako.runAsync(process.argv[1], \'main.nako3\')\n' +
  '  process.stdout.write(String(res.log ?? \'\'))\n' +
  '} catch (err) {\n' +
  '  process.stderr.write(String(err?.msg ?? err?.message ?? err ?? \'Unknown error\'))\n' +
  '  process.exitCode = 1\n' +
  '}\n'

/** 子プロセスでなでしこのコードを実行する */
function runNako (code) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', runnerScript, code], {
    cwd: testDir,
    encoding: 'utf8',
    timeout: 10000,
    killSignal: 'SIGKILL'
  })
  assert.notStrictEqual(result.error?.code, 'ETIMEDOUT', `実行がタイムアウトしました: ${code}`)
  assert.ifError(result.error)
  assert.strictEqual(result.signal, null, `プロセスがシグナルで終了しました: ${result.signal}`)
  return result
}

describe('配列一括挿入の停止防止 (#2470)', () => {
  it('挿入元と挿入先が同じ配列でも有限回で終了する', () => {
    const result = runNako('A=[1]。Aの0にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[1,1]')
  })

  it('自己挿入でも元の要素を固定長として挿入する', () => {
    const result = runNako('A=[1,2]。Aの1にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[1,1,2,2]')
  })

  it('別名参照(B=A)でも有限回で終了する', () => {
    const result = runNako('A=[1]。B=A。Aの0にBを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[1,1]')
  })

  it('先頭への複数要素の自己挿入も元の要素を固定長として挿入する', () => {
    const result = runNako('A=[1,2]。Aの0にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[1,2,1,2]')
  })

  it('末尾ちょうどの自己挿入も有限回で終了する', () => {
    const result = runNako('A=[1]。Aの1にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[1,1]')
  })

  it('範囲外の位置への自己挿入も有限回で終了する', () => {
    const result = runNako('A=[1,2]。Aの5にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[1,2,1,2]')
  })

  it('空配列の自己挿入は空のまま終了する', () => {
    const result = runNako('A=[]。Aの0にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[]')
  })

  it('挿入した要素は浅いコピーで参照を共有する', () => {
    const result = runNako('A=[0]。B=[{"x":1}]。Aの0にBを配列一括挿入。A[0]$x=2。B[0]$xを表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '2')
  })

  it('自己挿入でも要素は浅いコピーで参照を共有する', () => {
    const result = runNako('A=[{"x":1}]。Aの0にAを配列一括挿入。A[0]$x=2。A[1]$xを表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '2')
  })

  it('負のインデックスでも従来どおり動作する', () => {
    const result = runNako('A=[0,1,2]。Aの-1に[9]を配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[0,1,9,2]')
  })

  it('負のインデックスへの自己挿入も有限回で終了する', () => {
    // 負のインデックスは splice の都度解釈される既存仕様のため、[2,1,1,2] になる
    const result = runNako('A=[1,2]。Aの-1にAを配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[2,1,1,2]')
  })

  it('循環参照(Aの要素がA自身)でも有限回で終了する', () => {
    const result = runNako('A=[]。AにAを配列追加。Aの0にAを配列一括挿入。Aの配列要素数を表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '2')
  })

  it('A[0]がA自身でも有限回で終了する', () => {
    const result = runNako('A=[]。AにAを配列追加。Aの0にA[0]を配列一括挿入。Aの配列要素数を表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '2')
  })

  it('インデックスを数値文字列で指定しても数値として扱う', () => {
    const result = runNako('A=[0,1,2,3]。I=「1」。AのIに[8,9]を配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[0,8,9,1,2,3]')
  })

  it('負の数値文字列インデックスでも数値として扱う', () => {
    const result = runNako('A=[0,1,2]。I=「-1」。AのIに[9]を配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[0,1,9,2]')
  })

  it('挿入元が配列でない場合はエラーになる', () => {
    const result = runNako('A=[1]。Aの0に「x」を配列一括挿入。')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /『配列一括挿入』の引数が配列ではありません/)
    assert.strictEqual(result.stdout, '')
  })

  it('挿入先が配列でない場合はエラーになる', () => {
    const result = runNako('A=1。Aの0に[1]を配列一括挿入。')
    assert.strictEqual(result.status, 1, `エラーになりませんでした: ${result.stdout}`)
    assert.match(result.stderr, /『配列一括挿入』の引数が配列ではありません/)
    assert.strictEqual(result.stdout, '')
  })

  it('負のインデックスに複数要素を挿入する既存仕様を維持する', () => {
    const result = runNako('A=[0,1,2]。Aの-1に[8,9]を配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[9,0,1,8,2]')
  })

  it('数値に変換できないインデックスは先頭への挿入として扱う', () => {
    const result = runNako('A=[0,1,2]。I=「abc」。AのIに[8,9]を配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[8,9,0,1,2]')
  })

  it('別配列を挿入しても挿入元は変わらない', () => {
    const result = runNako('A=[0,1,2]。B=[8,9]。Aの1にBを配列一括挿入。BをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[8,9]')
  })

  it('挿入元と挿入先が別の配列では従来どおり動作する', () => {
    const result = runNako('A=[0,1,2,3]。Aの1に[8,9]を配列一括挿入。AをJSONエンコードして表示。')
    assert.strictEqual(result.status, 0, result.stderr)
    assert.strictEqual(result.stdout.trim(), '[0,8,9,1,2,3]')
  })
})
