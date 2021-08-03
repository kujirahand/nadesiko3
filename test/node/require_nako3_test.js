const assert = require('assert')
const { NakoImportError } = require('../../src/nako_errors')
const CNako3 = require('../../src/cnako3')
const path = require('path')

describe('require_nako3_test', () => {
  const nako = new CNako3()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  nako.silent = true
  const cmp = (code, res) => {
    nako.logger.debug('code=' + code)
    const ret = nako.run(code, 'main.nako3')
    assert.strictEqual(ret.log, res)
  }
  it('「ファイルを取り込む」', () => {
    cmp('!「' + __dirname + '/requiretest.nako3」を取り込む。\n痕跡を表示。3と5を痕跡演算して、表示。', '5\n8')
  })
  it('CNakoの相対インポート', () => {
    cmp('!「' + __dirname + '/relative_import_test_2.nako3」を取り込む。', '1\n2')
  })
  it('「回」が1回だけ分割されることを確認する', () => {
    cmp('！「' + __dirname + '/kai_test.nako3」を取り込む', '')
  })
  it('.jsと.nako3を同時に読み込む - .jsが先の場合', () => {
    const nako = new CNako3()
    const code =
      '!「plugin_csv」を取り込む。\n' +
      `!「${__dirname}/requiretest.nako3」を取り込む。\n`
    nako.loadDependencies(code, 'main.nako3', '')
    nako.run(code, 'main.nako3') // エラーが飛ばないことを確認
  })
  it('.jsと.nako3を同時に読み込む - .nako3が先の場合', () => {
    const nako = new CNako3()
    const code =
      `!「${__dirname}/requiretest.nako3」を取り込む。\n` +
      '!「plugin_csv」を取り込む。\n'
    nako.loadDependencies(code, 'main.nako3', '')
    nako.run(code, 'main.nako3') // エラーが飛ばないことを確認
  })
  it('.jsファイルの投げたエラーを表示', () => {
    const nako = new CNako3()
    const code = `!「${__dirname}/plugin_broken.js.txt」を取り込む`
    nako.loadDependencies(code, 'main.nako3', '')
    assert.throws(
      () => nako.run(code, 'main.nako3'),
      (err) => {
        assert(err instanceof NakoImportError)
        assert(err.message.includes('テスト'))
        assert.strictEqual(err.line, 0) // 1行目
        assert.strictEqual(err.file, 'main.nako3')
        return true
      }
    )
  })
  it('『プラグイン名』のテスト。(#956)', () => {
    const fname = __dirname + path.sep + 'requiretest_name.nako3'
    cmp('!「' + fname + '」を取り込む。リクエスト名前取得して表示。', fname)
  })
})
