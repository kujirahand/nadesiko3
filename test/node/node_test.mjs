/* eslint-disable no-undef */
import assert from 'assert'
import path from 'path'
import fs from 'fs'
import os from 'os'
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
  it('ナデシコバージョン:src/plugin_system.jsを正しく設定しているか？', async () => {
    cmp('ナデシコバージョンを表示', nakoVersion.version)
    cmp('ナデシコ種類を表示', 'cnako3')
  })
  // --- test ---
  it('print simple', async () => {
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  }).timeout(15000)

  const compileAndRun = (tempDir, code) => {
    const nakoFile = path.join(tempDir, 'main.nako3')
    const jsFile = path.join(tempDir, 'main.mjs')
    fs.writeFileSync(nakoFile, code)
    const compileResult = spawnSync(process.execPath, [cnako3, '-c', nakoFile], {
      cwd: tempDir,
      encoding: 'utf8'
    })
    assert.strictEqual(compileResult.status, 0, compileResult.stderr)
    assert.strictEqual(fs.existsSync(jsFile), true, 'main.mjsが生成されるべき')
    const runResult = spawnSync(process.execPath, [jsFile], {
      cwd: tempDir,
      encoding: 'utf8'
    })
    assert.strictEqual(runResult.status, 0, runResult.stderr)
    return runResult.stdout.trim()
  }

  it('cnako3 -cで生成した単純なJSコードをNode.jsで実行できる #1865', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3-compile-simple-'))
    try {
      assert.strictEqual(compileAndRun(tempDir, '1+2を表示。'), '3')
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }).timeout(30000)

  it('cnako3 -cでNode用プラグインをコピーしてファイルコピーを実行できる #1865', function () {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3-compile-file-copy-'))
    try {
      fs.writeFileSync(path.join(tempDir, 'source.txt'), 'plugin-node-ok')
      const output = compileAndRun(
        tempDir,
        '「source.txt」を「copied.txt」へファイルコピー。\n「copied.txt」を読んでトリムして表示。'
      )
      assert.strictEqual(output, 'plugin-node-ok')
      assert.strictEqual(
        fs.existsSync(path.join(tempDir, 'nako3runtime', 'plugin_node.mjs')),
        true,
        'Node用プラグインがnako3runtimeへコピーされるべき'
      )
      assert.strictEqual(fs.readFileSync(path.join(tempDir, 'copied.txt'), 'utf8'), 'plugin-node-ok')
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }).timeout(30000)
})
