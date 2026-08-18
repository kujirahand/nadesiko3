/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { NakoSyntaxError } from '../src/nako_errors.mjs'

describe('const', async () => {
  /** 正常に実行できることを確認する */
  const cmp = async (/** @type {string} */code, /** @type {string} */res) => {
    const nako = new NakoCompiler()
    assert.strictEqual((await nako.runAsync(code, 'main.nako3')).log, res)
  }
  /** 定数の書き換えがエラーになることを確認する */
  const cmpError = (/** @type {string} */code, /** @type {string} */msg) => {
    const nako = new NakoCompiler()
    assert.throws(
      () => nako.runSync(code, 'main.nako3'),
      (err) => {
        assert(err instanceof NakoSyntaxError)
        if (!err.message.includes(msg)) {
          throw new Error(`${JSON.stringify(err.message)} が ${JSON.stringify(msg)} を含みません。`)
        }
        return true
      }
    )
  }

  // --- 定数の書き換えはエラー ---
  it('定数への代入はエラー', () => {
    cmpError('定数 A=100\nA=200', '定数『A』は既に定義済みなので、値を代入することはできません。')
  })
  it('定数をループ変数に指定するとエラー #2400', () => {
    cmpError(
      '定数 ココア=100\nココアで1から5まで繰り返す\n　　ココアを表示\nここまで',
      '定数『ココア』はループ変数に指定できません。')
  })
  it('定数を『増繰り返す』のループ変数に指定するとエラー #2400', () => {
    cmpError(
      '定数 A=100\nAで1から5まで2ずつ増やして繰り返す\n　　Aを表示\nここまで',
      '定数『A』はループ変数に指定できません。')
  })
  it('定数を『反復』のループ変数に指定するとエラー #2400', () => {
    cmpError(
      '定数 A=100\nAで[1,2,3]を反復\n　　Aを表示\nここまで',
      '定数『A』は『反復』のループ変数に指定できません。')
  })
  it('定数を増やすとエラー #2400', () => {
    cmpError('定数 A=100\nAを1だけ増やす', '定数『A』は既に定義済みなので、値を増減することはできません。')
  })
  it('定数を減らすとエラー #2400', () => {
    cmpError('定数 A=100\nAを1だけ減らす', '定数『A』は既に定義済みなので、値を増減することはできません。')
  })
  it('関数内のローカル定数をループ変数に指定するとエラー #2400', () => {
    cmpError(
      '●テスト\n　　定数 A=1\n　　Aで1から3まで繰り返す\n　　　　Aを表示\n　　ここまで\nここまで\nテスト',
      '定数『A』はループ変数に指定できません。')
  })
  it('複数変数の代入文で定数を上書きするとエラー #2406', () => {
    cmpError(
      '定数 A = 10\n変数[A, B] = [20, 30]\nAを表示',
      '定数『A』は既に定義済みなので、値を代入することはできません。')
  })
  it('『A, B = [1,2]』の書式で定数を上書きするとエラー #2406', () => {
    cmpError(
      '定数 A = 10\nA, B = [20, 30]\nAを表示',
      '定数『A』は既に定義済みなので、値を代入することはできません。')
  })
  it('複数定数の代入文で定数を上書きするとエラー #2406', () => {
    cmpError(
      '定数 A = 10\n定数[A, B] = [20, 30]\nAを表示',
      '定数『A』は既に定義済みなので、値を代入することはできません。')
  })
  it('関数内の複数変数の代入文で定数を上書きするとエラー #2406', () => {
    cmpError(
      '●テスト\n　　定数 A=1\n　　変数[A,B]=[2,3]\nここまで\nテスト',
      '定数『A』は既に定義済みなので、値を代入することはできません。')
  })
  it('複数定数をループ変数に指定するとエラー #2400', () => {
    cmpError(
      '定数[A,B]=[1,2]\nAで1から3まで繰り返す\n　　Aを表示\nここまで',
      '定数『A』はループ変数に指定できません。')
  })

  // --- 通常の変数は従来通り動く(回帰テスト) ---
  it('変数はループ変数に指定できる', async () => {
    await cmp('X=100\nXで1から3まで繰り返す\n　　Xを表示\nここまで\nXを表示', '1\n2\n3\n3')
  })
  it('変数は『反復』のループ変数に指定できる', async () => {
    await cmp('Y=0\nYで[10,20]を反復\n　　Yを表示\nここまで', '10\n20')
  })
  it('複数変数の代入文は二重定義を許容する #1027', async () => {
    await cmp('変数[A,B]=[1,2]\n変数[A,B]=[3,4]\n「{A}:{B}」を表示', '3:4')
  })
  it('変数は増減できる', async () => {
    await cmp('Z=1\nZを1だけ増やす\nZを表示\nZを1だけ減らす\nZを表示', '2\n1')
  })
  it('定数はループ内で参照できる', async () => {
    await cmp('定数 A=10\n1から3まで繰り返す\n　　Aを表示\nここまで\nAを表示', '10\n10\n10\n10')
  })
  it('プラグインの定数と同名でない変数はループ変数に指定できる', async () => {
    await cmp('PIで1から2まで繰り返す\n　　PIを表示\nここまで', '1\n2')
  })
})
