/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoLexer } from '../src/nako_lexer.mjs'
import { NakoLogger } from '../src/nako_logger.mjs'
import { NakoPrepare } from '../src/nako_prepare.mjs'

describe('nako_lexer_filenameToModName_test', () => {
  it('拡張子を除去する', () => {
    assert.strictEqual(NakoLexer.filenameToModName('test.nako3'), 'test')
    assert.strictEqual(NakoLexer.filenameToModName('foo.nako'), 'foo')
  })

  it('モジュール名に使えない記号を置換する', () => {
    assert.strictEqual(NakoLexer.filenameToModName('foo-bar.nako3'), 'foo_bar')
    assert.strictEqual(NakoLexer.filenameToModName('foo_bar.nako3'), 'foo_bar')
    assert.strictEqual(NakoLexer.filenameToModName('my lib.nako3'), 'my_lib')
    assert.strictEqual(NakoLexer.filenameToModName('a.b.nako3'), 'a_b')
  })

  it('文字列リテラルへ埋め込めない記号を置換する', () => {
    assert.strictEqual(
      NakoLexer.filenameToModName('悪意』;悪意コード;『.nako3'),
      '悪意__悪意コード__'
    )
  })

  it('改行を置換する', () => {
    assert.strictEqual(
      NakoLexer.filenameToModName('改行\n含む.nako3'),
      '改行_含む'
    )
  })

  it('空の名前はmainにする', () => {
    assert.strictEqual(NakoLexer.filenameToModName('.nako3'), 'main')
    assert.strictEqual(NakoLexer.filenameToModName(''), 'main')
  })

  it('Unicode文字を保持する', () => {
    assert.strictEqual(
      NakoLexer.filenameToModName('日本語モジュール.nako3'),
      '日本語モジュール'
    )
    assert.strictEqual(NakoLexer.filenameToModName('123abc.nako3'), '123abc')
  })

  it('パスを除去する', () => {
    assert.strictEqual(
      NakoLexer.filenameToModName('C:\\dir\\foo-bar.nako3'),
      'foo_bar'
    )
    assert.strictEqual(
      NakoLexer.filenameToModName('/home/user/my lib.nako3'),
      'my_lib'
    )
  })

  it('NFDの結合文字をNFCで合成する', () => {
    assert.strictEqual(
      NakoLexer.filenameToModName('か\u3099.nako3'),
      'が'
    )
    assert.strictEqual(
      NakoLexer.filenameToModName('cafe\u0301.nako3'),
      'café'
    )
  })

  it('NFCで合成できない結合文字を保持する', () => {
    assert.strictEqual(
      NakoLexer.filenameToModName('a\u3099.nako3'),
      'a\u3099'
    )
  })

  it('記号のみの名前は現行仕様を維持する', () => {
    assert.strictEqual(NakoLexer.filenameToModName('---.nako3'), '___')
  })

  it('正規化されたモジュール名で関数を登録する', () => {
    const lex = new NakoLexer(new NakoLogger())
    const pre = NakoPrepare.getInstance()
    const code = '●AAAとは\n「あ」を表示\nここまで。\n'
    const code2 = pre.convert(code).map((v) => v.text).join('')
    const tok = lex.tokenize(code2, 0, 'foo-bar.nako3')
    const funclist = new Map()

    NakoLexer.preDefineFunc(tok, lex.logger, funclist)

    assert.strictEqual(funclist.get('foo_bar__AAA').type, 'func')
  })
})
