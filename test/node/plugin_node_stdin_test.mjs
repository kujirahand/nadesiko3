/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import { execSync, spawnSync } from 'child_process'

// __dirname のために
import url from 'url'
const debug = false
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// PATH
const cnako3 = path.join(__dirname, '../../src/cnako3.mjs')

// eslint-disable-next-line no-undef
describe('plugin_node_stdin_test(cnako)', () => {
  const cmp = (code, exRes, stdinStr) => {
    const cmd = `echo "${stdinStr}" | node ${cnako3} -e "${code}"`
    const result = execSync(cmd).toString().trimEnd()
    if (debug) {
      console.log('code=' + code)
      console.log('result=' + result)
    }
    assert.strictEqual(result, exRes)
  }
  it('echo', () => {
    cmp('「」を尋ねて表示', 'abc', 'abc')
    cmp('「」を文字尋ねて表示', 'def', 'def')
    cmp('標準入力全取得して表示', 'ghi', 'ghi')
  })
  it('line * 2', () => {
    cmp('A=「」を尋ねる;B=「」を尋ねる;「{A}:{B}」を表示', 'abc:def', 'abc\ndef\n')
    cmp('標準入力全取得して表示', 'abc\ndef', 'abc\ndef\n')
  })
  it('multiline', () => {
    cmp('A=「」を尋ねる;B=「」を尋ねる;C=「」を尋ねる;「{A}:{B}:{C}」を表示', 'abc:def:ghi', 'abc\ndef\nghi\n')
    cmp('標準入力全取得して表示', 'abc\ndef\nghi', 'abc\ndef\nghi\n')
  })
  it('尋ねるに数値を与える', () => {
    cmp('「」を尋ねて表示', '3', '3')
    cmp('A=「」を尋ねる;(A===3)を表示', 'true', '3')
  })
})
