/* eslint-disable no-undef */
/**
 * nako_gen.mts のパフォーマンスモニタ / 関数呼び出しコード生成のテスト (#2333)
 *
 * `「〜」にパフォーマンスモニタ適用` で生成されるコードと、
 * 実行時に作られる `__self.__performance_monitor` の内容を検証する。
 * nako_gen.mts のリファクタリングで生成コードが壊れていないことを保証するのが目的。
 */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

describe('nako_gen_perf_test', async () => {
  /**
   * なでしこコードを実行して、ログと計測結果を返す
   * @param {string} code
   */
  const run = async (code) => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync(code, 'main.nako3')
    // 非同期命令は runAsync の完了後も動いているので待つ (func_call.mjs と同様)
    if (code.indexOf('秒待') >= 0) { await forceWait(200) }
    return { log: g.log, pm: g.__performance_monitor }
  }

  // 強制的にミリ秒待機
  function forceWait (/** @type {number} */ ms) {
    return /** @type {Promise<void>} */(new Promise((resolve) => {
      setTimeout(() => { resolve() }, ms)
    }))
  }

  describe('計測なしのとき', async () => {
    it('__performance_monitor は作られない', async () => {
      const { log, pm } = await run('「あ」と表示')
      assert.strictEqual(log, 'あ')
      assert.strictEqual(pm, undefined)
    })
  })

  describe('システム関数本体の計測', async () => {
    it('キーは『命令名_body』、typeは『sysbody』', async () => {
      const { log, pm } = await run(
        '「システム関数本体」にパフォーマンスモニタ適用ここから\n' +
        '　「あ」と表示\n' +
        '　1に2を足して表示\n' +
        'ここまで\n')
      assert.strictEqual(log, 'あ\n3')
      assert.strictEqual(pm['表示_body'].type, 'sysbody')
      assert.strictEqual(pm['表示_body'].called, 2)
      assert.strictEqual(pm['足_body'].type, 'sysbody')
      assert.strictEqual(pm['足_body'].called, 1)
    })
  })

  describe('システム関数の計測', async () => {
    it('キーは『命令名_sys』、typeは『system』', async () => {
      const { log, pm } = await run(
        '「システム関数」にパフォーマンスモニタ適用ここから\n' +
        '　「あ」と表示\n' +
        '　S=1に2を足す\n' +
        '　Sを表示\n' +
        'ここまで\n')
      assert.strictEqual(log, 'あ\n3')
      assert.strictEqual(pm['表示_sys'].type, 'system')
      assert.strictEqual(pm['表示_sys'].called, 2)
      assert.strictEqual(pm['足_sys'].type, 'system')
      assert.strictEqual(pm['足_sys'].called, 1)
    })

    it('計測結果には called/totel_usec/min_usec/max_usec が入る', async () => {
      const { pm } = await run(
        '「システム関数」にパフォーマンスモニタ適用ここから\n' +
        '　「あ」と表示\n' +
        'ここまで\n')
      const r = pm['表示_sys']
      assert.deepStrictEqual(Object.keys(r).sort(), ['called', 'max_usec', 'min_usec', 'totel_usec', 'type'].sort())
      assert.ok(r.min_usec <= r.max_usec)
      assert.ok(r.totel_usec >= r.max_usec)
    })

    it('ブロックの外は計測されない', async () => {
      const { log, pm } = await run(
        '「システム関数」にパフォーマンスモニタ適用ここから\n' +
        '　「あ」と表示\n' +
        'ここまで\n' +
        '1に2を足して表示\n')
      assert.strictEqual(log, 'あ\n3')
      assert.strictEqual(pm['表示_sys'].called, 1)
      assert.strictEqual(pm['足_sys'], undefined)
    })
  })

  describe('ユーザ関数の計測', async () => {
    it('キーは関数名、typeは『user』 (#2333)', async () => {
      const { log, pm } = await run(
        '「ユーザ関数」にパフォーマンスモニタ適用ここから\n' +
        '　●(AとBを)テスト足すとは\n' +
        '　　AにBを足して戻す\n' +
        '　ここまで\n' +
        '　1と2をテスト足して表示\n' +
        '　3と4をテスト足して表示\n' +
        'ここまで\n')
      assert.strictEqual(log, '3\n7')
      assert.strictEqual(pm.main__テスト足.type, 'user')
      assert.strictEqual(pm.main__テスト足.called, 2)
    })
  })

  describe('非同期命令の計測 (#2333)', async () => {
    it('システム関数本体: 構文エラーにならず、実行も完了する', async () => {
      const { log, pm } = await run(
        '「システム関数本体」にパフォーマンスモニタ適用ここから\n' +
        '　0.01秒待つ\n' +
        '　「おわり」と表示\n' +
        'ここまで\n')
      assert.strictEqual(log, 'おわり')
      assert.strictEqual(pm.秒待_body.type, 'sysbody')
      assert.strictEqual(pm.秒待_body.called, 1)
    })

    it('システム関数: 構文エラーにならず、実行も完了する', async () => {
      const { log, pm } = await run(
        '「システム関数」にパフォーマンスモニタ適用ここから\n' +
        '　0.01秒待つ\n' +
        '　「おわり」と表示\n' +
        'ここまで\n')
      assert.strictEqual(log, 'おわり')
      assert.strictEqual(pm.秒待_sys.type, 'system')
      assert.strictEqual(pm.秒待_sys.called, 1)
    })
  })

  describe('全てのオプションを同時に適用 (#2333)', async () => {
    it('ユーザ関数・システム関数本体・システム関数を同時に計測できる', async () => {
      const { log, pm } = await run(
        '「全て」にパフォーマンスモニタ適用ここから\n' +
        '　●(Aを)テスト表示とは\n' +
        '　　Aを表示\n' +
        '　ここまで\n' +
        '　「あ」をテスト表示\n' +
        '　1に2を足して表示\n' +
        'ここまで\n')
      assert.strictEqual(log, 'あ\n3')
      assert.strictEqual(pm.main__テスト表示.type, 'user')
      assert.strictEqual(pm.足_body.type, 'sysbody')
      assert.strictEqual(pm.足_sys.type, 'system')
    })
  })

  describe('関数呼び出しコード生成の回帰チェック', async () => {
    it('戻り値のある命令と『それ』', async () => {
      const { log } = await run('1に2を足す\nそれを表示')
      assert.strictEqual(log, '3')
    })

    it('ユーザ関数の呼び出しと戻り値', async () => {
      const { log } = await run(
        '●(AとBを)テスト足すとは\n' +
        '　AにBを足して戻す\n' +
        'ここまで\n' +
        '1と2をテスト足して表示\n')
      assert.strictEqual(log, '3')
    })

    it('無名関数の呼び出し', async () => {
      const { log } = await run(
        'F=関数(a,b)それはa+b;ここまで\n' +
        'F(3,4)を表示\n')
      assert.strictEqual(log, '7')
    })

    it('非同期命令の呼び出し', async () => {
      const { log } = await run('0.01秒待つ\n「おわり」と表示')
      assert.strictEqual(log, 'おわり')
    })
  })
})
