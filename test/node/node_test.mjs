/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import { execSync, spawnSync } from 'child_process'
import nakoVersion from '../../src/nako_version.mjs'

// __dirname のために
import url from 'url'
const debug = false
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// PATH
const cnako3 = path.join(__dirname, '../../src/cnako3.mjs')

// eslint-disable-next-line no-undef
describe('node_test(cnako)', () => {
  const cmp = (/** @type {string} */ code, /** @type {string} */ exRes) => {
    const result = execSync(`node ${cnako3} -e "${code}"`).toString().replace(/\s+$/, '')
    if (debug) {
      console.log('code=' + code)
      console.log('result=' + result)
    }
    assert.strictEqual(result, exRes)
  }
  // --- バージョンチェック ---
  it('ナデシコバージョン:src/plugin_system.jsを正しく設定しているか？', () => {
    cmp('ナデシコバージョンを表示', nakoVersion.version)
    cmp('ナデシコ種類を表示', 'cnako3')
  })
  // --- test ---
  it('print simple', () => {
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  }).timeout(15000)

  it('単独で実行できるプログラムの出力(macの時のみ) - Node.js', function () {
    // [memo] なでしこが生成するコードも ESM ("".mjs") です
    // testフォルダはmjsがデフォルト
    // /tmp を使うので、windowsならテストしない macの時だけテスト
    if (process.platform !== 'darwin') { return this.skip() }
    const nakofileOrg = path.join(__dirname, 'add_test.nako3')
    const nakofile = path.join('/tmp', 'add_test.nako3')
    const jsfile = path.join('/tmp', 'add_test.mjs')
    fs.copyFileSync(nakofileOrg, nakofile)
    if (process.env.NODE_ENV === 'test') { return this.skip() }
    const stderr = spawnSync('node', [cnako3, '-c', nakofile]).stderr
    try {
      if (stderr) { console.error(stderr.toString()) }
      const p = spawnSync('node', [jsfile])
      if (p.stderr) { console.error(p.stderr.toString()) }
      assert.strictEqual(p.stdout.toString(), '3\n')
    } finally {
      if (fs.existsSync(jsfile)) { fs.unlinkSync(jsfile) }
    }
  })
})
