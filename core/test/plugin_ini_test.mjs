/* eslint-disable no-undef */
import { describe, it } from 'node:test'
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'

// eslint-disable-next-line no-undef
describe('plugin_ini_test', () => {
  const cmp = async (/** @type {string} */ code, /** @type {string} */ res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    const g = await nako.runAsync(code)
    assert.strictEqual(g.log, res)
  }
  // エラーになること(メッセージの一部も確認)
  const err = async (/** @type {string} */ code, /** @type {string} */ msg) => {
    const nako = new NakoCompiler()
    await assert.rejects(async () => { await nako.runAsync(code) }, (e) => {
      assert.ok(String(e.message).includes(msg), 'メッセージ: ' + e.message)
      return true
    })
  }
  // 辞書を渡してINI変換した結果の文字列をそのまま得る(末尾の改行を確認するため)
  const encode = async (/** @type {any} */ dict) => {
    const nako = new NakoCompiler()
    let out = null
    nako.addFunc('テスト辞書', [], () => dict, true)
    nako.addFunc('結果保存', ['を'], (/** @type {any} */ v) => { out = v }, true)
    await nako.runAsync('テスト辞書のINI変換して結果保存')
    return out
  }
  // INI文字列を引数として渡して取得する(改行や特殊文字をそのまま渡すため)
  const parse = async (/** @type {string} */ ini, /** @type {string} */ expr) => {
    const nako = new NakoCompiler()
    nako.addFunc('テストINI', [], () => ini, true)
    const g = await nako.runAsync('a=テストINIのINI取得。' + expr)
    return g.log
  }

  // --- INI取得 ---
  it('INI取得 - セクションと最上位キー', async () => {
    const r = await parse('top=1\n[a]\nx=2\ny=3\n[b]\nz=4\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"top":"1","a":{"x":"2","y":"3"},"b":{"z":"4"}}')
  })
  it('INI取得 - 値は文字列のまま (007)', async () => {
    await cmp('a=『[s]\nid=007\nn=3\nb=true』のINI取得。aをJSONエンコードして表示', '{"s":{"id":"007","n":"3","b":"true"}}')
  })
  it('INI取得 - コメント', async () => {
    const r = await parse('; c1\n# c2\n  ; c3\n\t# c4\nk=v ; not comment\nh=a#b\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"k":"v ; not comment","h":"a#b"}')
  })
  it('INI取得 - 引用符で囲んだ値', async () => {
    const r = await parse('a="  x ; y # z = w "\nb=  plain  \nc=""\nd="x\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, JSON.stringify({ a: '  x ; y # z = w ', b: 'plain', c: '', d: '"x' }))
  })
  it('INI取得 - 重複キーとセクションのマージ', async () => {
    const r = await parse('k=1\nk=2\n[s]\na=1\n[t]\nb=1\n[s]\na=9\nc=3\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"k":"2","s":{"a":"9","c":"3"},"t":{"b":"1"}}')
  })
  it('INI取得 - 空の値', async () => {
    const r = await parse('k=\n[s]\nj =  \n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"k":"","s":{"j":""}}')
  })
  it('INI取得 - 値に=を含む', async () => {
    const r = await parse('url=a=b=c\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"url":"a=b=c"}')
  })
  it('INI取得 - BOMとCRLF', async () => {
    const r = await parse('﻿[s]\r\nk=v\r\n; c\r\nj=w\r\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"s":{"k":"v","j":"w"}}')
    const r2 = await parse('﻿k=v\r\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r2, '{"k":"v"}')
  })
  it('INI取得 - 日本語と大文字小文字の保持', async () => {
    const r = await parse('[Sec]\nKey=A\nkey=b\n[sec]\nx=1\n[設定]\n名前=けもの\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"Sec":{"Key":"A","key":"b"},"sec":{"x":"1"},"設定":{"名前":"けもの"}}')
  })
  it('INI取得 - セクション名の先頭が ; や #', async () => {
    const r = await parse('[;sec]\nk=v\n[#sec]\nj=w\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{";sec":{"k":"v"},"#sec":{"j":"w"}}')
  })
  it('INI取得 - 空白除去はGoのTrimSpaceと同じ文字集合 (U+0085を除去)', async () => {
    const r = await parse('\u0085k=v\u0085\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"k":"v"}')
  })
  it('INI取得 - 空入力', async () => {
    await cmp('a=「」のINI取得。aをJSONエンコードして表示', '{}')
  })

  // --- INI変換 ---
  it('INI変換 - 基本 (数値・真偽値を含む)', async () => {
    const out = await encode({
      sec: { a: 'x', n: 3, f: 1.5, b: true, c: false },
      top: 't',
      s2: { k: '日本語' }
    })
    assert.strictEqual(out, 'top=t\n\n[sec]\na=x\nn=3\nf=1.5\nb=true\nc=false\n\n[s2]\nk=日本語\n')
  })
  it('INI変換 - スカラーが先・セクションが後', async () => {
    assert.strictEqual(await encode({ s: { k: 'v' }, top: 't' }), 'top=t\n\n[s]\nk=v\n')
  })
  it('INI変換 - セクションのみ', async () => {
    assert.strictEqual(await encode({ s: { k: 'v' } }), '[s]\nk=v\n')
  })
  it('INI変換 - 空辞書', async () => {
    assert.strictEqual(await encode({}), '')
    await cmp('a={};aのINI変換してJSONエンコードして表示', '""')
  })
  it('INI変換 - 前後に空白がある値や引用符で囲まれた値は引用符で囲む', async () => {
    assert.strictEqual(await encode({ a: '  p  ', b: '"q"' }), 'a="  p  "\nb=""q""\n')
  })

  // --- 往復 ---
  it('往復 - 辞書→INI変換→INI取得', async () => {
    const nako = new NakoCompiler()
    const src = {
      top: 't',
      空白: '  padded  ',
      quoted: '"q"',
      empty: '',
      s: { a: 'x ; y # z = w', 名前: 'けもの', e: '' }
    }
    nako.addFunc('テスト辞書', [], () => src, true)
    const g = await nako.runAsync('テスト辞書のINI変換してINI取得してJSONエンコードして表示')
    assert.deepStrictEqual(JSON.parse(g.log), src)
  })
  it('往復 - INI取得→INI変換→INI取得', async () => {
    const src = 'top=1\n[a]\nx=hello world\ny="  sp  "\n[b]\nz=\n'
    const nako = new NakoCompiler()
    nako.addFunc('テストINI', [], () => src, true)
    const g1 = await nako.runAsync('テストINIのINI取得してJSONエンコードして表示')
    const g2 = await nako.runAsync('テストINIのINI取得してINI変換してINI取得してJSONエンコードして表示')
    assert.strictEqual(g2.log, g1.log)
  })

  // --- エラー ---
  it('INI取得 - 閉じていない括弧', async () => {
    await err('「[sec」のINI取得', 'INI取得に失敗しました。1行目: セクションの括弧が閉じていません。')
  })
  it('INI取得 - セクション名に ] を含む', async () => {
    await err('『[a]b]』のINI取得', 'セクション名に「]」は使えません。')
  })
  it('INI取得 - セクションの後に余分な文字', async () => {
    await err('『[a] extra』のINI取得', 'セクションの括弧が閉じていません。')
  })
  it('INI取得 - 空のセクション名', async () => {
    await err('『[]』のINI取得', 'セクション名が空です。')
    await err('『[  ]』のINI取得', 'セクション名が空です。')
  })
  it('INI取得 - =のない行', async () => {
    await err('『k=v\nbroken』のINI取得', '2行目: 「=」がありません。')
  })
  it('INI取得 - キーが空', async () => {
    await err('『=v』のINI取得', 'キーが空です。')
  })
  it('INI取得 - キーとセクションの重複', async () => {
    await err('『s=1\n[s]』のINI取得', 'セクション「s」が同名のキーと重複しています。')
  })
  it('INI取得 - セクションの再出現はエラーにならない', async () => {
    const r = await parse('[s]\nx=1\n[t]\n[s]\n', 'aをJSONエンコードして表示')
    assert.strictEqual(r, '{"s":{"x":"1"},"t":{}}')
  })
  it('INI変換 - 辞書以外はエラー', async () => {
    await err('「abc」のINI変換', 'INI変換に失敗しました。変換できるのは辞書のみです。')
    await err('[1,2]のINI変換', '変換できるのは辞書のみです。')
  })
  it('INI変換 - 深い入れ子', async () => {
    await err('a={"s":{"t":{"k":"v"}}};aのINI変換', '「s.t」は2段より深い入れ子です。')
  })
  it('INI変換 - 配列の値', async () => {
    await err('a={"s":{"k":[1,2]}};aのINI変換', '「s.k」は配列でINIでは表せません。')
    await err('a={"k":[1,2]};aのINI変換', '「k」は配列でINIでは表せません。')
  })
  it('INI変換 - 値が空(null/undefined)', async () => {
    const nako = new NakoCompiler()
    nako.addFunc('テスト辞書', [], () => ({ s: { k: null } }), true)
    await assert.rejects(async () => { await nako.runAsync('テスト辞書のINI変換') }, /「s.k」の値が空\(null\/undefined\)です。/)
  })
  it('INI変換 - 改行を含む値', async () => {
    await err('a={"k":"x{改行}y"};aのINI変換', '「k」の値に改行が含まれています。')
  })
  it('INI変換 - 表せないキーとセクション名', async () => {
    await err('a={"a=b":"v"};aのINI変換', 'キー「a=b」はINIで表せません。')
    await err('a={"":"v"};aのINI変換', 'キー「」はINIで表せません。')
    await err('a={"#k":"v"};aのINI変換', 'キー「#k」はINIで表せません。')
    await err('a={"a]b":{"k":"v"}};aのINI変換', 'セクション名「a]b」はINIで表せません。')
  })

  // --- スタンドアロン生成 ---
  it('スタンドアロン生成コードに plugin_ini が含まれる', () => {
    const nako = new NakoCompiler()
    const js = nako.compileStandalone('a=「k=1」のINI取得。a["k"]を表示', 'main.nako3')
    assert.ok(js.includes('plugin_ini.mjs'), '生成コードが plugin_ini.mjs を import する')
    assert.ok(js.includes('nako3runtime_plugin_ini'), '生成コードに plugin_ini の登録名が含まれる')
  })

  // --- マニュアルのサンプル相当 ---
  it('マニュアル - INI取得して整形JSONで表示', async () => {
    await cmp('データ=『[window]\ntitle=Hello\nwidth=640』\nデータをINI取得して、JSONエンコード整形して表示', JSON.stringify({ window: { title: 'Hello', width: '640' } }, null, 2))
  })
  it('マニュアル - INI変換', async () => {
    await cmp('a={"name":"なでしこ","setting":{"foo":3,"on":真}};aをINI変換してJSONエンコードして表示', JSON.stringify('name=なでしこ\n\n[setting]\nfoo=3\non=true\n'))
  })
  it('マニュアル - widthを整数変換して2倍にする', async () => {
    await cmp('データ=『[window]\ntitle=Hello\nwidth=640』\n設定=データをINI取得。\nW=設定["window"]["width"]を整数変換。\n(W*2)を表示', '1280')
  })
  it('マニュアル - INI変換→INI取得の往復で007が保たれる', async () => {
    await cmp('a={"id":"007"};b=aをINI変換してINI取得。b["id"]を表示', '007')
  })
})
