import PluginBrowser from '../../src/plugin_browser.mjs'
import { PluginUtHelper } from '../../utils/plugin_ut_helper.js'

describe('plugin_browser_color', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  it('RGB', () => {
    cu.cmpifn('RGB', [255, 255, 255], '#FFffFf')
    cu.cmpifn('RGB', [0, 0, 0], '#000000')
    cu.cmpifn('RGB', [22, 25, 255], '#1619FF')
  })
  it('色混ぜる', () => {
    cu.cmpifn('色混', [[255, 255, 255]], '#ffFFff')
  })
  it('色混ぜる - no args', () => {
    cu.cmpfnex('色混', [], 'Error', '『色混ぜる』の引数には配列を指定します')
  })
  it('色混ぜる - no enoough args', () => {
    cu.cmpfnex('色混', [[1, 2]], 'Error', '『色混ぜる』の引数には[RR,GG,BB]形式の配列を指定します')
  })
})
