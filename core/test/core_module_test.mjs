/* eslint-disable no-undef */
import assert from 'assert'
import core from '../index.mjs'
// eslint-disable-next-line no-undef
describe('core_module_test', () => {
  const cmp = async (code, res) => {
    const nako = new core.NakoCompiler()
    nako.getLogger().debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  it('hello', async () => {
    await cmp('「こんにちは」と表示', 'こんにちは')
  })
  it('calc', async () => {
    await cmp('3+5*2と表示', '13')
  })
  it('funccall', async () => {
    await cmp('MID("123456789",3,2)を表示', '34')
  })
  it('ナデシコバージョン', async () => {
    await cmp('ナデシコバージョンを表示', core.version.version)
  })
})
