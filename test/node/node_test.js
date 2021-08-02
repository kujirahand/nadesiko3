const assert = require('assert')
const child_process = require('child_process')
const path = require('path')
const fs = require('fs')

const cnako3 = path.join(__dirname, '../../src/cnako3.js')
const packagejson = require('../../package.json')
const debug = false

describe('node_test(cnako)', () => {
  const cmp = (code, exRes) => {
    const result = child_process.execSync(`node ${cnako3} -e "${code}"`).toString().replace(/\s+$/, '')
    if (debug) {
      console.log('code=' + code)
      console.log('result=' + result)
    }
    assert.strictEqual(result, exRes)
  }
  // --- バージョンチェック ---
  it('ナデシコバージョン:src/plugin_system.jsを正しく設定しているか？', () => {
    cmp('ナデシコバージョンを表示', packagejson.version)
    cmp('ナデシコ種類を表示', 'cnako3')
  })
  // --- test ---
  it('print simple', () => {
    cmp('3を表示', '3')
    cmp('1+2*3を表示', '7')
    cmp('A=30;「--{A}--」を表示', '--30--')
  }).timeout(15000)

  it('単独で実行できるプログラムの出力 - Node.js', function () {
    if (process.env.NODE_ENV === 'test') { return this.skip() }
    const stderr = child_process.spawnSync('node', [cnako3, '-c', path.join(__dirname, 'add_test.nako3')]).stderr
    try {
      if (stderr) { console.error(stderr.toString()) }
      const p = child_process.spawnSync('node', [path.join(__dirname, 'add_test.js')])
      if (p.stderr) { console.error(p.stderr.toString()) }
      assert.strictEqual(p.stdout.toString(), '3\n')
    } finally {
      fs.unlinkSync(path.join(__dirname, 'add_test.js'))
    }
  })
})
