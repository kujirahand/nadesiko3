import assert from 'assert'

import PluginNode from '../../src/plugin_node.mjs'
import PluginBrowserAjax from '../../src/plugin_browser_ajax.mjs'

const plugins = [
  ['Node.js版', PluginNode],
  ['ブラウザ版', PluginBrowserAjax]
]

describe('AJAX内容取得', () => {
  for (const [runtime, plugin] of plugins) {
    const ajaxContent = plugin['AJAX内容取得'].fn

    it(`${runtime}で指定形式の内容を取得できる`, async () => {
      const body = { name: 'body' }
      const response = {
        body,
        text: async () => 'text',
        json: async () => ({ name: 'json' }),
        blob: async () => ({ name: 'blob' }),
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer
      }

      assert.strictEqual(await ajaxContent(response, 'TEXT'), 'text')
      assert.deepStrictEqual(await ajaxContent(response, 'JSON'), { name: 'json' })
      assert.deepStrictEqual(await ajaxContent(response, 'BLOB'), { name: 'blob' })
      assert.deepStrictEqual(
        new Uint8Array(await ajaxContent(response, 'ARRAY')),
        new Uint8Array([1, 2, 3])
      )
      assert.strictEqual(ajaxContent(response, 'BODY'), body)
    })

    it(`${runtime}で未知の形式を指定すると入力エラーになる`, () => {
      const response = { body: {} }
      assert.throws(
        () => ajaxContent(response, 'UNKNOWN'),
        /『AJAX内容取得』で未対応の形式「UNKNOWN」が指定されました/
      )
    })
  }
})
