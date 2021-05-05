const assert = require('assert')
const NakoCompiler = require('../../src/nako3')
const { expect } = require('chai')

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
  it('二次元配列の参照', () => {
    cmp('A=[[0,1,2],[3,4,5]];A[1][1]を表示', '4')
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
})
