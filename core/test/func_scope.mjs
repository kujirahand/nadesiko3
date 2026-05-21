/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('func_scope', async () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.getLogger().debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }

  it('ローカル関数が外側の引数を参照できる #2268', async () => {
    await cmp(`
curry_add = 関数(あ)
  inner = 関数(い)
    それはあ + い
  ここまで
  innerを戻す
ここまで
curry_add(1)(2)を表示
`, '3')
  })

  it('戻り値のローカル関数を「それ」から呼び出しても外側の引数を参照できる #2268', async () => {
    await cmp(`
curry_add = 関数(あ)
  inner = 関数(い)
    それはあ + い
  ここまで
  innerを戻す
ここまで
curry_add(1)
それ(2)を表示
`, '3')
  })

  it('戻り値のローカル関数を変数に代入しても外側の引数を参照できる #2268', async () => {
    await cmp(`
curry_add = 関数(あ)
  inner = 関数(い)
    それはあ + い
  ここまで
  innerを戻す
ここまで
curry_add(1)
それをFに代入
F(2)を表示
`, '3')
  })

  it('カリー化した関数を変数に保持しても外側の引数を参照できる #2268', async () => {
    await cmp(`
curry_add = 関数(あ)
  inner = 関数(い)
    それはあ + い
  ここまで
  innerを戻す
ここまで
inc = curry_add(1)
inc(2)を表示
`, '3')
  })

  it('ローカル関数が外側のローカル変数を参照できる #2268', async () => {
    await cmp(`
make_add = 関数(あ)
  baseとは変数
  base = あ + 10
  inner = 関数(い)
    それはbase + い
  ここまで
  innerを戻す
ここまで
add11 = make_add(1)
add11(2)を表示
`, '13')
  })
})
