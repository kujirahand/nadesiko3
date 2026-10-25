/* eslint-disable no-undef */
// PR #2629 の回帰テスト。
// 「もし」文の入れ子深さの上限 (64) について、境界値 (64は可・65は不可) と
// エラー経路 (条件解析エラー・深さ超過の後に同じコンパイラを再利用しても
// 深さが残留しないこと) を検証する。
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { NakoSyntaxError } from '../src/nako_errors.mjs'

const FILENAME = 'main.nako3'

function createNestedIfCode(depth) {
  const lines = []

  for (let level = 0; level < depth; level++) {
    lines.push(`${'　'.repeat(level)}もし1ならば`)
  }

  lines.push(`${'　'.repeat(depth)}「OK」を表示`)

  for (let level = depth - 1; level >= 0; level--) {
    lines.push(`${'　'.repeat(level)}ここまで`)
  }

  return `${lines.join('\n')}\n`
}

/** 深さ depth の入れ子の最内側の「もし」の条件を不正にしたコードを返す */
function createNestedBadCondCode(depth) {
  const lines = []
  for (let level = 0; level < depth - 1; level++) {
    lines.push(`${'　'.repeat(level)}もし1ならば`)
  }
  lines.push(`${'　'.repeat(depth - 1)}もし@@@ならば`)
  lines.push(`${'　'.repeat(depth)}「OK」を表示`)
  for (let level = depth - 1; level >= 0; level--) {
    lines.push(`${'　'.repeat(level)}ここまで`)
  }
  return `${lines.join('\n')}\n`
}

function createSiblingIfCode(count) {
  return Array.from({ length: count }, () => (
    'もし1ならば\n「OK」を表示\nここまで\n'
  )).join('')
}

function assertTooDeepError(action) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof NakoSyntaxError)
    assert.match(error.message, /入れ子が深すぎます/)
    assert.match(error.message, /上限 64/)
    return true
  })
}

describe('nako_parser_nested_if_test', () => {
  it('深さ64の入れ子「もし」が実行できる', async () => {
    const nako = new NakoCompiler()
    const result = await nako.runAsync(createNestedIfCode(64), FILENAME)

    assert.strictEqual(result.log, 'OK')
  })

  it('深さ65の入れ子「もし」はNakoSyntaxErrorになる', () => {
    const nako = new NakoCompiler()

    assertTooDeepError(() => nako.parse(createNestedIfCode(65), FILENAME))
  })

  it('深さ100の入れ子「もし」もNakoSyntaxErrorになる', () => {
    const nako = new NakoCompiler()

    assertTooDeepError(() => nako.parse(createNestedIfCode(100), FILENAME))
  })

  it('浅い深さ2の入れ子「もし」が従来どおり実行できる', async () => {
    const nako = new NakoCompiler()
    const result = await nako.runAsync(createNestedIfCode(2), FILENAME)

    assert.strictEqual(result.log, 'OK')
  })

  it('条件解析エラーの後も同じパーサーで深さ64を解析できる', () => {
    const nako = new NakoCompiler()
    const invalidCode = 'もし@@@ならば\n「OK」を表示\nここまで\n'

    assert.throws(
      () => nako.parse(invalidCode, FILENAME),
      (error) => {
        assert.ok(error instanceof NakoSyntaxError)
        assert.match(error.message, /『もし』文の条件で次のエラーがあります/)
        return true
      }
    )

    assert.doesNotThrow(() => nako.parse(createNestedIfCode(64), FILENAME))
  })

  it('入れ子の内側での条件解析エラーの後も同じパーサーで深さ64を解析できる', () => {
    const nako = new NakoCompiler()

    assert.throws(
      () => nako.parse(createNestedBadCondCode(10), FILENAME),
      (error) => {
        assert.ok(error instanceof NakoSyntaxError)
        assert.match(error.message, /『もし』文の条件で次のエラーがあります/)
        return true
      }
    )

    assert.doesNotThrow(() => nako.parse(createNestedIfCode(64), FILENAME))
  })

  it('深さ超過エラーの後も同じパーサーで通常のコードを解析できる', () => {
    const nako = new NakoCompiler()

    assertTooDeepError(() => nako.parse(createNestedIfCode(65), FILENAME))
    assert.doesNotThrow(() => nako.parse('「OK」を表示\n', FILENAME))
    assert.doesNotThrow(() => nako.parse(createNestedIfCode(64), FILENAME))
  })

  it('兄弟の「もし」文を100個並べてもエラーにならない', () => {
    const nako = new NakoCompiler()

    assert.doesNotThrow(() => nako.parse(createSiblingIfCode(100), FILENAME))
  })
})
