/* eslint-disable no-undef */
import assert from 'assert'
import app from '../../src/commander_ja.mjs'

// eslint-disable-next-line no-undef
describe('commnder_ja', () => {
  it('version', () => {
    app.reset()
    const c1 = app
      .version('1.1.1', '-v,--version')
      .option('-a,--aaa')
      .parseStr(['node.js', 'cnako3.js', '-v'])
    assert.strictEqual(c1, '1.1.1')

    app.reset()
    const c2 = app
      .version('1.2.3', '-v,--version')
      .option('-a,--aaa')
      .parseStr(['node.js', 'cnako3.js', '--version'])
    assert.strictEqual(c2, '1.2.3')
  })
  it('help', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .usage('[opt] test')
      .option('-a,--aaa', 'hoge')
    const helpStr = app.getHelp()
    const c1 = app.parseStr(['node.js', 'cnako3.js', '-h'])
    const a = helpStr.replace(/\s$/g, '')
    const b = c1.replace(/\s$/g, '')
    assert.strictEqual(a, b)
  })
  it('args no params', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .title('hoge')
      .usage('[opt] test')
      .option('-a,--aaa')
    app.parseStr(['node.js', 'cnako3.js', 'aaa', 'bbb'])
    assert.strictEqual(app.args[0], 'aaa')
    assert.strictEqual(app.args[1], 'bbb')
  })
  it('args has params1', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .title('hoge')
      .usage('[opt] test')
      .option('-a,--aaa')
    app.parseStr(['node.js', 'cnako3.js', '-a'])
    assert.strictEqual(app.aaa, true)
  })
  it('args has params2', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .title('hoge')
      .usage('[opt] test')
      .option('-a, --aaa')
    app.parseStr(['node.js', 'cnako3.js', '-a', 'bbb'])
    assert.strictEqual(app.aaa, true)
    assert.strictEqual(app.args[0], 'bbb')
  })
  it('args has params3', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .title('hoge')
      .usage('[opt] test')
      .option('-e, --eval [source]', 'eval source')
    app.parseStr(['node.js', 'cnako3.js', '-e', 'hoge'])
    assert.strictEqual(app.eval, 'hoge')
  })
  it('args has params4', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .usage('[opt] test')
      .option('-e, --eval [source]', 'eval source')
    app.parseStr(['node.js', 'cnako3.js', '-e'])
    assert.strictEqual(app.eval, '')
  })
  it('args has params5', () => {
    app.reset()
    app.version('1.2.3', '-v,--version')
      .usage('[opt] test')
      .option('-e, --eval [source]', 'eval source')
      .option('-E, --Eval [source]', 'Eval source')
    app.parseStr(['node.js', 'cnako3.js', '-E', '-e', '-d', 'hoge', 'fuga'])
    assert.strictEqual(app.eval, 'hoge')
    assert.strictEqual(app.Eval, 'fuga')
  })
})
