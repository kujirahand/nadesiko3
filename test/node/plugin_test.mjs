import assert from 'assert'
import path from 'path'
import { CNako3 } from '../../src/cnako3mod.js'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('plugin_test', () => {
  const nako = new CNako3()
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  nako.silent = true
  const cmp = async (code, res) => {
    nako.logger.debug('code=' + code)
    const ret = await nako.run(code)
    assert.strictEqual(ret.log, res)
  }
  it('「取り込む」', () => {
    const plug = path.join(__dirname, '..', '..', 'src', 'plugin_keigo.js')
    cmp(`!「${plug}」を取り込む。\n拝啓。お世話になっております。礼節レベル取得して表示。`, '1')
  })
})

