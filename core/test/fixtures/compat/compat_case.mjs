/* eslint-disable no-undef */
/**
 * 差分fixtureの共通ロジック (#2448)
 *
 * なでしこ3のGo言語版など、別実装との「観測可能な挙動」を突き合わせるための
 * ケース読み込み・実行・結果の正規化をまとめたモジュール。
 *
 * - ケース定義   : `cases/*.json` (言語非依存のJSON。人が書く)
 * - 期待値(oracle): `expected/*.json` (現行TypeScript版から自動生成)
 *
 * 詳しい仕様は同じディレクトリの `SPEC.md` を参照。
 *
 * このディレクトリは `core/test/*.mjs` のテストグロブに含まれないので、
 * テスト実行時にこのファイル自体が走ることはない。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NakoCompiler } from '../../../src/nako3.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** ケースを実行するときのファイル名(エラー文面に載るので固定する) */
export const COMPAT_FILENAME = 'main.nako3'

/** 1ケースあたりの実行時間の上限(ミリ秒) */
export const COMPAT_TIMEOUT_MS = 5000

/** なでしこの変数名につく名前空間の接頭辞 */
const VAR_PREFIX = 'main__'

export const casesDir = path.join(HERE, 'cases')
export const expectedDir = path.join(HERE, 'expected')

/**
 * `cases/*.json` を読み込む
 * @returns {{group: string, file: string, description: string, cases: any[]}[]}
 */
export function loadCaseGroups () {
  const files = fs.readdirSync(casesDir).filter((f) => f.endsWith('.json')).sort()
  return files.map((file) => {
    const json = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'))
    if (!json.group) { throw new Error(`${file}: group がありません`) }
    if (!Array.isArray(json.cases)) { throw new Error(`${file}: cases が配列ではありません`) }
    const names = new Set()
    for (const c of json.cases) {
      if (!c.name) { throw new Error(`${file}: name のないケースがあります`) }
      if (typeof c.code !== 'string') { throw new Error(`${file}: ${c.name}: code が文字列ではありません`) }
      if (names.has(c.name)) { throw new Error(`${file}: ケース名が重複しています: ${c.name}`) }
      names.add(c.name)
    }
    return { group: json.group, file, description: json.description || '', cases: json.cases }
  })
}

/** 期待値ファイルのパスを得る */
export function expectedPathOf (group) {
  return path.join(expectedDir, `${group}.json`)
}

/**
 * 値を、実装をまたいで比較できる形に正規化する。
 * JSONは数値の種別や辞書のキー順を落としてしまうので、型を明示的に持たせる。
 */
export function encodeValue (value, seen = new Set(), depth = 0) {
  if (depth > 12) { return { t: 'depth-limit' } }
  if (value === undefined) { return { t: 'undefined' } }
  if (value === null) { return { t: 'null' } }
  switch (typeof value) {
    case 'boolean': return { t: 'bool', v: value }
    // len はコードポイント数。Goの utf8.RuneCountInString と揃えるため、UTF-16コードユニット数ではない
    case 'string': return { t: 'str', v: value, len: Array.from(value).length }
    case 'bigint': return { t: 'bigint', v: value.toString() }
    case 'function': return { t: 'func' }
    case 'symbol': return { t: 'symbol', v: String(value) }
    case 'number': {
      if (Number.isNaN(value)) { return { t: 'num', v: 'NaN' } }
      if (value === Infinity) { return { t: 'num', v: 'Infinity' } }
      if (value === -Infinity) { return { t: 'num', v: '-Infinity' } }
      if (Object.is(value, -0)) { return { t: 'num', v: '-0' } }
      // 整数か否かは実装差が出やすいので明示しておく
      return { t: 'num', v: value, int: Number.isInteger(value) }
    }
  }
  if (seen.has(value)) { return { t: 'circular' } }
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      // 疎な配列(穴あき)はJSONで null に化けてしまうので、添字で走査して穴を undefined として残す
      const items = []
      for (let i = 0; i < value.length; i++) { items.push(encodeValue(value[i], seen, depth + 1)) }
      return { t: 'arr', len: value.length, v: items }
    }
    if (value instanceof Date) {
      return { t: 'date', v: value.toISOString() }
    }
    if (value instanceof Map) {
      const keys = [...value.keys()].map((k) => String(k))
      const v = {}
      for (const k of value.keys()) { v[String(k)] = encodeValue(value.get(k), seen, depth + 1) }
      return { t: 'map', keys, v }
    }
    // 辞書型。なでしこではキーの並び順も観測できるので順序を保存する
    const keys = Object.keys(value)
    const v = {}
    for (const k of keys) { v[k] = encodeValue(value[k], seen, depth + 1) }
    return { t: 'obj', keys, v }
  } finally {
    seen.delete(value)
  }
}

/** 例外オブジェクトを正規化する */
function encodeError (err) {
  const e = /** @type {any} */(err)
  return {
    type: e && e.type ? String(e.type) : (e && e.constructor ? e.constructor.name : 'Error'),
    // なでしこのエラーは line が0起点。文面には「1行目」と1起点で出る
    line: (e && typeof e.line === 'number') ? e.line : null,
    message: e && e.message ? String(e.message) : String(err)
  }
}

/**
 * 1ケースを現行TypeScript版で実行し、正規化した結果を返す。
 * これが差分fixtureの「正解(oracle)」になる。
 */
export async function runCase (testCase) {
  const nako = new NakoCompiler()
  // 実装ごとのログ出力先の違いを避けるため、ログはコンパイラの log から取る
  let global = null
  let error = null
  let timedOut = false
  try {
    const timer = new Promise((_resolve, reject) => {
      setTimeout(() => { timedOut = true; reject(new Error('timeout')) }, COMPAT_TIMEOUT_MS).unref()
    })
    global = await Promise.race([nako.runAsync(testCase.code, COMPAT_FILENAME), timer])
  } catch (err) {
    if (timedOut) { return { name: testCase.name, status: 'timeout' } }
    error = err
  }
  const result = { name: testCase.name }
  if (error) {
    result.status = 'error'
    result.log = typeof nako.log === 'string' ? nako.log : ''
    result.error = encodeError(error)
  } else {
    result.status = 'ok'
    result.log = global.log
  }
  // 検査対象の変数を取り出す
  if (Array.isArray(testCase.vars) && testCase.vars.length > 0) {
    const vars = {}
    const table = global ? global.__varslist[2] : null
    for (const name of testCase.vars) {
      vars[name] = table ? encodeValue(table.get(VAR_PREFIX + name)) : { t: 'unavailable' }
    }
    result.vars = vars
  }
  return result
}

/** グループ内の全ケースを実行する */
export async function runGroup (group) {
  const results = {}
  for (const c of group.cases) {
    results[c.name] = await runCase(c)
  }
  return results
}
