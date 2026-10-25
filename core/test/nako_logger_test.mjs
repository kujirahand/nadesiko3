/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoColors } from '../src/nako_colors.mjs'
import { NakoLogger } from '../src/nako_logger.mjs'
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
  it('no-ANSI 経路でも HTML を escapeHTML する', () => {
    // text === noColor のとき span を付けず escape のみ
    const out = NakoColors.convertColorTextFormat('<script>x</script>')
    assert.strictEqual(out.noColor, '<script>x</script>')
    assert.strictEqual(out.nodeConsole, '<script>x</script>')
    assert.strictEqual(out.html, '&lt;script&gt;x&lt;/script&gt;')
    assert.deepStrictEqual(out.browserConsole, ['<script>x</script>'])
  })
  it('no-ANSI 経路で & < > " \' の5文字をすべて escapeHTML する (#2628)', () => {
    // イベントハンドラ付きタグ (実攻撃に近い入力) で " の置換も固定する
    const attack = '<img src=x onerror="alert(1)">'
    const out1 = NakoColors.convertColorTextFormat(attack)
    assert.strictEqual(out1.html, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    // ' と & (& を最初に置換するため、既存のエンティティ文字列も二重に escape される)
    const out2 = NakoColors.convertColorTextFormat('a&b \'c\' &lt;')
    assert.strictEqual(out2.html, 'a&amp;b &#039;c&#039; &amp;lt;')
    // escape するのは html だけで、他の出力は原文のまま
    assert.strictEqual(out1.noColor, attack)
    assert.strictEqual(out1.nodeConsole, attack)
    assert.deepStrictEqual(out1.browserConsole, [attack])
    assert.strictEqual(out2.noColor, 'a&b \'c\' &lt;')
    assert.strictEqual(out2.nodeConsole, 'a&b \'c\' &lt;')
    assert.deepStrictEqual(out2.browserConsole, ['a&b \'c\' &lt;'])
  })
  it('no-ANSI 経路で特殊文字がなければ html は原文のまま (span を付けない) (#2628)', () => {
    const out = NakoColors.convertColorTextFormat('通常のログ 123')
    assert.strictEqual(out.html, '通常のログ 123')
    assert.strictEqual(out.noColor, '通常のログ 123')
    // 空文字列も同じ経路
    assert.strictEqual(NakoColors.convertColorTextFormat('').html, '')
  })
  it('ログの取得のテスト', () => {
    const logger = new NakoLogger()
    logger.addListener('info', (data) => {
      assert.strictEqual(data.noColor, '[情報]main.nako3(2行目): foo')
    })
    logger.info('foo', {
      startOffset: 0,
      endOffset: 0,
      line: 1,
      file: 'main.nako3'
    })
  })
  it('複数のリスナーのテスト1', () => {
    const logger = new NakoLogger()
    let logStr = ''
    logger.addListener('info', (data) => { logStr += 'i' })
    logger.addListener('error', (data) => { logStr += 'e' })
    logger.addListener('stdout', (data) => { logStr += 's' })
    logger.error('foo', { startOffset: 0, endOffset: 0, line: 1, file: 'main.nako3' })
    assert.strictEqual(logStr, 'ie')
  })
  it('複数リスナーのテスト2', () => {
    const logger = new NakoLogger()
    let logStr = ''
    logger.addListener('info', (data) => { logStr += 'i' })
    logger.addListener('error', (data) => { logStr += 'e' })
    logger.addListener('stdout', (data) => { logStr += 's' })
    logger.info('foo', { startOffset: 0, endOffset: 0, line: 1, file: 'main.nako3' })
    assert.strictEqual(logStr, 'i')
  })
  it('複数リスナーのテスト3', () => {
    const logger = new NakoLogger()
    let logStr = ''
    logger.addListener('info', (data) => { logStr += 'i' })
    logger.addListener('error', (data) => { logStr += 'e' })
    logger.addListener('stdout', (data) => { logStr += 's' })
    logger.stdout('foo', { startOffset: 0, endOffset: 0, line: 1, file: 'main.nako3' })
    assert.strictEqual(logStr, 'ies')
  })
  it('複数リスナーのテスト4', () => {
    const logger = new NakoLogger()
    let logStr = ''
    logger.addListener('info', (data) => { logStr += 'i' })
    logger.addListener('error', (data) => { logStr += 'e' })
    logger.addListener('stdout', (data) => { logStr += 's' })
    logger.stdout('foo', { startOffset: 0, endOffset: 0, line: 1, file: 'main.nako3' })
    assert.strictEqual(logStr, 'ies')
  })
  it('複数リスナーのテスト5', () => {
    const logger = new NakoLogger()
    let logStr = ''
    logger.addListener('all', (data) => { logStr += 'a' })
    logger.addListener('info', (data) => { logStr += 'i' })
    logger.addListener('error', (data) => { logStr += 'e' })
    logger.addListener('stdout', (data) => { logStr += 's' })
    logger.info('foo', { startOffset: 0, endOffset: 0, line: 1, file: 'main.nako3' })
    assert.strictEqual(logStr, 'ai')
  })
})
