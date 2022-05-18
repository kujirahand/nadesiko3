import assert from 'assert'
import { NakoColors } from '../../src/nako_colors.mjs'
import { NakoLogger } from '../../src/nako_logger.mjs'

describe('nako_logger_test', () => {
  it('色付けのテスト', () => {
    const out = NakoColors.convertColorTextFormat(`デフォルト${NakoColors.color.bold}太字${NakoColors.color.red}太字赤${NakoColors.color.reset}デフォルト<script>`)
    assert.strictEqual(out.noColor, 'デフォルト太字太字赤デフォルト<script>')
    assert.strictEqual(out.nodeConsole, 'デフォルト\u001b[1m太字\u001b[31m太字赤\u001b[0mデフォルト<script>\u001b[0m')
    assert.strictEqual(out.html, '<span>デフォルト</span><span style="color: inherit; font-weight: bold;">太字</span><span style="color: red; font-weight: bold;">太字赤</span><span style="color: inherit; font-weight: inherit;">デフォルト&lt;script&gt;</span>')
    assert.deepStrictEqual(out.browserConsole, [
      'デフォルト%c太字%c太字赤%cデフォルト<script>',
      'color: inherit; font-weight: bold;',
      'color: red; font-weight: bold;',
      'color: inherit; font-weight: inherit;'
    ])
  })
  it('ログの取得のテスト', (done) => {
    const logger = new NakoLogger()
    logger.addListener('info', (data) => {
      assert.strictEqual(data.noColor, '[情報]main.nako3(2行目): foo')
      done()
    })
    logger.info('foo', {
      startOffset: 0,
      endOffset: 0,
      line: 1,
      file: 'main.nako3'
    })
  })
})
