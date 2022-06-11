import { CompareUtil, waitTimer, assert } from './compare_util.js'

const htmlPath = 'test/html/'

export default (nako) => {
  const cu = new CompareUtil(nako)

  describe('DOMパーツ', () => {
    describe('親要素設定', () => {
      const check_parent_set = (selectmethod) => {
        document.body.innerHTML = __html__[htmlPath+'div_basic.html']

        const code = `
要素は${selectmethod}
要素にDOM親要素設定を報告する。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        assert.ok(cr.isCalled, 'イベント呼び出し')
        const msg = cr.messages[0]
        assert.strictEqual((typeof msg).toLowerCase(), 'object')
        assert.strictEqual(msg.tagName.toUpperCase(), 'DIV')
      }
      it('親要素設定 - ID', () => {
        check_parent_set('「main」')
      })
      it('親要素設定 - query', () => {
        check_parent_set('「#main」')
      })
      it('親要素設定 - dom', () => {
        check_parent_set('「main」をDOM要素ID取得')
      })
    })

    describe('パーツ一般', () => {
      const check_createparts = (code, rslt) => {
        document.body.innerHTML = __html__[htmlPath+'div_basic.html']

        const cr = window.cr
        cr.reset()
        nako.run(code)

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), rslt)
      }

      it('ボタン作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は「あいう」のボタン作成
要素["tagName"]を報告する。
要素のDOMテキスト取得を報告する。
`
        check_createparts(code, '["BUTTON","あいう"]')
      })

      it('エディタ作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は「とめ」のエディタ作成
要素["tagName"]を報告する。
要素["type"]を報告する。
要素のDOMテキスト取得を報告する。
`
        check_createparts(code, '["INPUT","text","とめ"]')
      })

      it('テキストエリア作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は「ながいよ」のテキストエリア作成
要素["tagName"]を報告する。
要素のDOMテキスト取得を報告する。
`
        check_createparts(code, '["TEXTAREA","ながいよ"]')
      })

      it('ラベル作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は「こも」のラベル作成
要素["tagName"]を報告する。
要素のDOMテキスト取得を報告する。
`
        check_createparts(code, '["SPAN","こも"]')
      })

      it('改行作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は改行作成
要素["tagName"]を報告する。
`
        check_createparts(code, '["BR"]')
      })

      it('チェックボックス作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は「くりっくみー」のチェックボックス作成
要素["tagName"]を報告する。
要素["type"]を報告する。
`
        check_createparts(code, '["INPUT","checkbox"]')
      })
/*
      it('セレクトボックス作成', () => {
        const code = `
「#main」にDOM親要素設定する。
要素は[「１２３」,「４５６」,「７８９」]のセレクトボックス作成
要素["tagName"]を報告する。
要素["options"]["length"]を報告する。
要素["options"]を反復する。
これはそれ
これを報告する。
「{これ["value"]},{これ["text"]}」を報告する。
ここまで。
`
        check_createparts(code, '["SELECT",3,"１２３","４５６","７８９"]')
      })*/
    })
  })
}
