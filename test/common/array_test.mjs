import assert from 'assert'
import { NakoCompiler } from '../../src/nako3.mjs'
import { expect } from 'chai'

describe('array_test', () => {
  const nako = new NakoCompiler()
  const cmp = (/** @type {string} */code, /** @type {string} */res) => {
    nako.logger.debug('code=' + code)
    assert.strictEqual(nako.run(code, '').log, res)
  }
  const cmpNakoFuncs = (/** @type {string} */code, /** @type {Set<string>} */res) => {
    nako.logger.debug('code=' + code)
    nako.run(code, '')
    assert.deepStrictEqual(nako.usedFuncs, res)
  }
  // --- test ---
  it('配列の基本テスト', () => {
    cmp('A=[0,1,2];A[0]を表示', '0')
    cmp('A=[0,1,2];A@1を表示', '1')
  })
  it('二次元配列の参照 A[1][1]', () => {
    cmp('A=[[0,1,2],[3,4,5]];A[1][1]を表示', '4')
  })
  it('二次元配列の参照 A@1,1 #976 #1000', () => {
    cmp('A=[[0,1,2],[3,4,5]];A@1,1を表示', '4')
  })
  it('二次元配列@の参照 #976', () => {
    cmp('A=[[0,1,2],[3,4,5]];A@1@1を表示', '4')
    cmp('A=[[0,1,2],[3,4,5]];A@1,1を表示', '4')
    cmp('A=[[0,1,2],[3,4,5]];N,M=[1,1];A@N,Mを表示', '4')
  })
  it('二次元配列の代入 #976', () => {
    cmp('A=[[0,1,2],[3,4,5]];A[1][1]=100;A[1][1]を表示', '100')
    cmp('A=[[0,1,2],[3,4,5]];N=1;M=1;A@N,M=100;A@N,Mを表示', '100')
    cmp('A=[[0,1,2],[3,4,5]];A[1][1]を表示', '4')
  })
  it('要素から配列を記述する際に明示的な()が必要になる不具合 #1000', () => {
    cmp('Aは[0,1,2];Bは[A[1], A[1], A[2]];B[1]を表示', '1')
  })
})
