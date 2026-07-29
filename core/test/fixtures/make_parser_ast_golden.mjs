/* eslint-disable no-undef */
/**
 * `parser_ast_golden.json` を生成するスクリプト (#2364)
 *
 * コーパス(`parser_corpus.mjs` の PARSER_CORPUS)を構文解析し、
 * その AST をゴールデンファイルとして書き出す。
 *
 * 実行前に必ずビルドすること(core/src/*.mjs はビルド生成物のため)。
 *
 *   npm run build:tsc
 *   node core/test/fixtures/make_parser_ast_golden.mjs
 *
 * このディレクトリは `core/test/*.mjs` のテストグロブに含まれないので、
 * テスト実行時にこのファイルが走ることはない。
 */
import fs from 'node:fs'
import { PARSER_CORPUS, parseToPlainAst } from './parser_corpus.mjs'

const golden = {}
for (const [name, code] of Object.entries(PARSER_CORPUS)) {
  try {
    golden[name] = parseToPlainAst(code)
  } catch (err) {
    console.error(`構文解析に失敗しました: ${name}`)
    throw err
  }
}

const outPath = new URL('./parser_ast_golden.json', import.meta.url)
fs.writeFileSync(outPath, JSON.stringify(golden, null, 1) + '\n', 'utf8')
console.log(`${Object.keys(golden).length} 件のゴールデン AST を書き出しました`)
