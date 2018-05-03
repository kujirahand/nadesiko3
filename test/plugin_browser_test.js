const assert = require('assert')
const NakoCompiler = require('../src/nako3')
const PluginBrowser = require('../src/plugin_browser')

describe('plugin_browser_test', () => {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginBrowser', 'plugin_browser.js', PluginBrowser)
  nako.debug = false
  const cmp = (code, res) => {
    if (nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(nako.runReset(code).log, res)
  }
  // --- test ---
  it('RGB', () => {
    cmp('CODE=RGB(255,255,255);CODEを大文字変換して表示', '#FFFFFF')
    cmp('CODE=RGB(0,255,255);CODEを大文字変換して表示', '#00FFFF')
    cmp('CODE=RGB(0,0,0);CODEを大文字変換して表示', '#000000')
  })
  it('URLパラメータ解析', () => {
    cmp('「http://hoge.com/」のURLパラメータ解析してJSONエンコードして表示', '{}')
    cmp('「https://nadesi.com/?a=3&b=5」のURLパラメータ解析;それ["a"]を表示;それ["b"]を表示。', '3\n5')
  })
})
