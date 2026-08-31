#!/usr/bin/env node
// マニュアル(manualディレクトリ)に書かれたサンプルコードを実行して検証するDocTest (#2409)
//
// manual/{プラグイン名}/{命令名}.txt の中から、次の形式のサンプルコードを探して実行し、
// 「### 表示結果:」に書かれた内容と、実際の表示ログが一致するかを確認する。
//
//   {{{#nako3
//   「こんにちは」と表示。
//   ### 表示結果: こんにちは
//   }}}
//
// 複数行の表示結果は、2行目以降を「### 」に続けて書く。
//
// 使い方:
//   node batch/doctest.mjs [対象パス...]
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import { NakoCompiler } from '../core/src/nako3.mjs'
import PluginNode from '../src/plugin_node.mjs'
import PluginCSV from '../core/src/plugin_csv.mjs'

const thisDir = path.dirname(url.fileURLToPath(import.meta.url))
export const rootDir = path.resolve(thisDir, '..')
export const manualDir = path.join(rootDir, 'manual')
export const doctestDir = path.join(rootDir, 'test', 'doctest')

/** 表示結果の開始行にマッチする正規表現 */
const RE_EXPECT_HEAD = /^###\s*(WEB表示結果|表示結果)\s*[:：]?[ \t]?(.*)$/i
/** 表示結果の2行目以降にマッチする正規表現 */
const RE_EXPECT_TAIL = /^###[ \t]?(.*)$/

/**
 * ディレクトリ以下の *.txt を再帰的に列挙する
 * @param {string} dir 探索するディレクトリ
 * @returns {string[]} 見つかったファイルのパス(絶対パス)
 */
export function findManualFiles (dir) {
  if (!fs.existsSync(dir)) { return [] }
  const stat = fs.statSync(dir)
  if (stat.isFile()) { return dir.endsWith('.txt') ? [dir] : [] }
  const result = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    // シンボリックリンクの循環を避けるため、ディレクトリとファイルのみを見る
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      result.push(...findManualFiles(full))
    } else if (ent.isFile() && ent.name.endsWith('.txt')) {
      result.push(full)
    }
  }
  return result
}

/**
 * @typedef {object} DocTest
 * @property {string} file ファイルのパス
 * @property {number} line 「{{{#nako3」があった行番号(1から数える)
 * @property {string} code 実行するなでしこのコード
 * @property {string} expect 期待する表示結果
 * @property {'cnako'|'wnako'} runtime 実行するランタイム
 * @property {{canvas: boolean, width: number, height: number}} options 実行領域のオプション
 */

/**
 * テキストから「{{{#nako3 ... }}}」を抽出し、表示結果が書かれたものをDocTestとして返す
 * @param {string} text マニュアルの内容
 * @param {string} [file] ファイルのパス(エラー表示に使う)
 * @returns {DocTest[]}
 */
export function extractDocTests (text, file = '') {
  const lines = text.split(/\r\n|\r|\n/)
  const tests = []
  let inBlock = false
  let blockLine = 0
  let blockOptions = parseBlockOptions('')
  /** @type {string[]} */
  let block = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inBlock) {
      if (line.trim().startsWith('{{{#nako3')) {
        inBlock = true
        blockLine = i + 1
        blockOptions = parseBlockOptions(line)
        block = []
      }
      continue
    }
    if (line.trim() === '}}}') {
      inBlock = false
      const test = parseBlock(block, file, blockLine, blockOptions)
      if (test) { tests.push(test) }
      continue
    }
    block.push(line)
  }
  return tests
}

/**
 * `{{{#nako3(canvas,size=幅x高さ)` の実行領域オプションを得る。
 * @param {string} line ブロック開始行
 * @returns {{canvas: boolean, width: number, height: number}}
 */
function parseBlockOptions (line) {
  const options = { canvas: false, width: 300, height: 300 }
  const matched = line.trim().match(/^\{\{\{#nako3(?:\(([^)]*)\))?/)
  if (!matched || !matched[1]) { return options }
  for (const item of matched[1].split(',').map((s) => s.trim())) {
    if (item === 'canvas') { options.canvas = true }
    const size = item.match(/^size\s*=\s*(\d+)\s*x\s*(\d+)$/i)
    if (size) {
      options.width = Number(size[1])
      options.height = Number(size[2])
    }
  }
  return options
}

/**
 * ブロックの中身をコードと表示結果に分ける(表示結果がなければnull)
 * @param {string[]} block
 * @param {string} file
 * @param {number} line
 * @param {{canvas: boolean, width: number, height: number}} options
 * @returns {DocTest|null}
 */
function parseBlock (block, file, line, options) {
  const head = block.findIndex((s) => RE_EXPECT_HEAD.test(s.trimEnd()))
  if (head < 0) { return null }
  const headMatch = block[head].trimEnd().match(RE_EXPECT_HEAD)
  const runtime = /** @type {'cnako'|'wnako'} */(headMatch?.[1].toUpperCase() === 'WEB表示結果' ? 'wnako' : 'cnako')
  const expects = [headMatch?.[2] ?? '']
  let i = head + 1
  for (; i < block.length; i++) {
    const m = block[i].trimEnd().match(RE_EXPECT_TAIL)
    if (!m) { break }
    expects.push(m[1])
  }
  // 表示結果より後ろにコードが続く場合もつなげて実行する
  const code = block.slice(0, head).concat(block.slice(i)).join('\n')
  return { file, line, code, expect: expects.join('\n').replace(/\s+$/, ''), runtime, options }
}

/**
 * DocTestを1件実行する
 * @param {DocTest} test
 * @returns {Promise<{ok: boolean, actual: string, error: Error|null}>}
 */
export async function runDocTest (test) {
  if (test.runtime === 'wnako') {
    return { ok: false, actual: '', error: new Error('WEB表示結果のDocTestはブラウザ版の実行コマンドを使用してください。') }
  }
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
  nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
  try {
    const g = await nako.runAsync(test.code, test.file || 'doctest.nako3')
    const actual = String(g.log).replace(/\s+$/, '')
    return { ok: actual === test.expect, actual, error: null }
  } catch (err) {
    return { ok: false, actual: '', error: /** @type {Error} */(err) }
  }
}

/**
 * 失敗したときの親切なエラーメッセージを作る
 * @param {DocTest} test
 * @param {{ok: boolean, actual: string, error: Error|null}} result
 * @returns {string}
 */
export function formatFailure (test, result) {
  const where = `${toShortPath(test.file)}:${test.line}`
  const lines = []
  if (result.error) {
    lines.push(`[DocTest失敗] ${where} のサンプルコードが実行エラーになりました。`)
    lines.push('--- 実行したコード ---')
    lines.push(indent(test.code))
    lines.push('--- エラー内容 ---')
    lines.push(indent(result.error.message))
    lines.push('マニュアルのサンプルコードを修正するか、期待する表示結果を見直してください。')
    return lines.join('\n')
  }
  lines.push(`[DocTest失敗] ${where} の表示結果が期待と異なります。`)
  lines.push('--- 実行したコード ---')
  lines.push(indent(test.code))
  lines.push('--- 期待した表示結果 ---')
  lines.push(indent(test.expect))
  lines.push('--- 実際の表示結果 ---')
  lines.push(indent(result.actual))
  lines.push('--- 違いのある行 ---')
  lines.push(indent(diffLines(test.expect, result.actual)))
  const marker = test.runtime === 'wnako' ? '### WEB表示結果:' : '### 表示結果:'
  lines.push(`マニュアルの「${marker}」の記述か、サンプルコードのどちらかを修正してください。`)
  return lines.join('\n')
}

/**
 * ルートからの相対パスにする(ルートの外にあるファイルはそのまま返す)
 * @param {string} file
 * @returns {string}
 */
function toShortPath (file) {
  const rel = path.relative(rootDir, file)
  return (rel && !rel.startsWith('..')) ? rel : file
}

/**
 * 期待と実際を行ごとに比べて、違う行だけを取り出す
 * @param {string} expect
 * @param {string} actual
 * @returns {string}
 */
function diffLines (expect, actual) {
  const e = expect.split('\n')
  const a = actual.split('\n')
  const result = []
  for (let i = 0; i < Math.max(e.length, a.length); i++) {
    if (e[i] === a[i]) { continue }
    result.push(`${i + 1}行目: 期待=${JSON.stringify(e[i] ?? '(行なし)')} / 実際=${JSON.stringify(a[i] ?? '(行なし)')}`)
  }
  return result.join('\n')
}

/**
 * 各行の先頭に空白を足す
 * @param {string} s
 * @returns {string}
 */
function indent (s) {
  return s.split('\n').map((line) => '  ' + line).join('\n')
}

/**
 * 指定したパス以下のDocTestをすべて集める
 * @param {string[]} [targets] 対象のファイルまたはディレクトリ(省略時はmanualとtest/doctest)
 * @param {'cnako'|'wnako'} [runtime] 対象ランタイム
 * @returns {DocTest[]}
 */
export function collectDocTests (targets, runtime = 'cnako') {
  const dirs = (targets && targets.length > 0) ? targets : [manualDir, doctestDir]
  const tests = []
  for (const target of dirs) {
    for (const file of findManualFiles(path.resolve(rootDir, target))) {
      const text = fs.readFileSync(file, 'utf-8')
      if (!text.split(/\r\n|\r|\n/).some((line) => RE_EXPECT_HEAD.test(line.trimEnd()))) { continue }
      tests.push(...extractDocTests(text, file).filter((test) => test.runtime === runtime))
    }
  }
  return tests
}

/** CLIとして実行された時の処理 */
async function main () {
  const targets = process.argv.slice(2)
  const tests = collectDocTests(targets)
  console.log(`[DocTest] ${tests.length}件のサンプルコードを実行します。`)
  let failed = 0
  for (const test of tests) {
    const result = await runDocTest(test)
    if (result.ok) { continue }
    failed++
    console.error(formatFailure(test, result))
    console.error('')
  }
  if (failed > 0) {
    console.error(`[DocTest] ${failed}件失敗しました。`)
    process.exit(1)
  }
  console.log('[DocTest] すべて成功しました。')
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  main()
}
