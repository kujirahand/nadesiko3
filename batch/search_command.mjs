#!/usr/bin/env node
// なでしこ3の命令一覧を検索するCLIの起動用ラッパー (#2385)
//
// cnako3は、なでしこのスクリプト名より後ろの引数も自前のオプション解析にかけるため、
// 「--help」などを直接渡すとcnako3自身のヘルプが表示されてしまう。
// そこで利用者の指定した引数は環境変数に入れて渡し、cnako3には渡さないようにする。
// 検索処理の本体は batch/search_command.nako3 (なでしこ3) にある。
import path from 'node:path'
import url from 'node:url'
import { spawn } from 'node:child_process'

const thisDir = path.dirname(url.fileURLToPath(import.meta.url))
const rootDir = path.resolve(thisDir, '..')
const cnako3Path = path.join(rootDir, 'src', 'cnako3.mjs')
const scriptPath = path.join(thisDir, 'search_command.nako3')

const child = spawn(process.execPath, [cnako3Path, scriptPath], {
  stdio: 'inherit',
  env: { ...process.env, NAKO3_SEARCH_ARGS: JSON.stringify(process.argv.slice(2)) }
})
child.on('error', (err) => {
  console.error(`[エラー] 検索CLIを起動できませんでした: ${err.message}`)
  process.exit(3)
})
child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code === null ? 1 : code))
})
