/* global __html__ */
import { CompareUtil, waitTimer, assert } from './compare_util'

export default (nako) => {
  const cu = new CompareUtil(nako)

  describe('DOMイベント', () => {
    describe('汎用命令', () => {
      const createMouseEvent = (type, t) => {
        const box = t.target.getBoundingClientRect()
        const x = 30
        const y = 10
        if (MouseEvent && MouseEvent.length > 0) {
          return new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            button: t.btn || 0,
            buttons: t.btns || 1,
            clientX: box.left + x,
            clientY: box.top + y,
            screenX: window.screenLeft + box.left + x,
            screenY: window.screenTop + box.top + y,
            pageX: window.scrollX + box.left + x,
            pageY: window.scrollY + box.top + y
          })
        } else {
          const evt = new UIEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
          })
          evt.button = t.btn || 0,
          evt.buttons = t.btns || 1,
          evt.clientX = box.left + x,
          evt.clientY = box.top + y,
          evt.screenX = window.screenLeft + box.left + x,
          evt.screenY = window.screenTop + box.top + y,
          evt.pageX = window.scrollX + box.left + x,
          evt.pageY = window.scrollY + box.top + y
          return evt
        }
      }

      const check_event_set = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_form.html']

        const code = `
要素は${selectmethod}
要素の「onclick」に「ボタンクリック」をDOMイベント設定する。
●ボタンクリックとは
「C:設定」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('button')
        if (e) {
          const evt = createMouseEvent('click', { target: e })
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["C:設定"]')
      }

      const check_event_fire = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_form.html']

        const code = `
要素は${selectmethod}
要素の「click」がDOMイベント発火した時には、
「C:設定」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('button')
        if (e) {
          const evt = createMouseEvent('click', { target: e })
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["C:設定"]')
      }

      const check_event_add = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_form.html']

        const code = `
要素は${selectmethod}
要素の「click」に「ボタンクリック」をDOMイベント追加する。
●ボタンクリックとは
「C:追加」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('button')
        if (e) {
          const evt = createMouseEvent('click', { target: e })
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["C:追加"]')
      }

      const check_event_remove = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_form.html']

        const code = `
要素は${selectmethod}
要素の「click」に「ボタンクリック」をDOMイベント追加する。
要素の「click」から「ボタンクリック」をDOMイベント削除する。
●ボタンクリックとは
「C:追加」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('button')
        if (e) {
          const evt = createMouseEvent('click', { target: e })
          e.dispatchEvent(evt)
        } else {
          assert.fail('要素が見つからないためイベント発火に失敗しました。')
        }

        assert.ok(!cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '[]')
      }

      it('イベント設定', () => {
        check_event_set('「#button」')
      })
      it('イベント設定 - dom', () => {
        check_event_set('「button」をDOM要素ID取得')
      })

      it('イベント発火した時', () => {
        check_event_fire('「#button」')
      })
      it('イベント発火した時 - dom', () => {
        check_event_fire('「button」をDOM要素ID取得')
      })

      it('イベント追加', () => {
        check_event_add('「#button」')
      })
      it('イベント追加 - dom', () => {
        check_event_add('「button」をDOM要素ID取得')
      })

      it('イベント削除', () => {
        check_event_remove('「#button」')
      })
      it('イベント削除 - dom', () => {
        check_event_remove('「button」をDOM要素ID取得')
      })
    })

    describe('読み込み時', () => {
      const check_img_load = async (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_form.html']

        const code = `
IMGは「img」のDOM要素作成
IMG["id"]は「img」
親は「form」をDOM要素ID取得
親にIMGをDOM子要素追加
要素は${selectmethod}
要素を読み込んだ時には、
「L:{IMG["naturalWidth"]},{IMG["naturalHeight"]}」を報告する。
ここまで。
IMG["src"]は「/turtle.png」
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        await waitTimer(1.0)

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["L:64,64"]')
      }

      it('読み込み時', async () => {
        await check_img_load('「#img」')
      })
      it('読み込み時 - dom', async () => {
        await check_img_load('「img」をDOM要素ID取得')
      })
      it('読み込み時 - image', async () => {
        const code = `
要素は「new Image()」をJS実行
要素を読み込んだ時には、
「I:{要素["naturalWidth"]},{要素["naturalHeight"]}」を報告する。
ここまで。
要素["src"]は「/turtle.png」
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        await waitTimer(1.0)

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["I:64,64"]')
      })
    })

    describe('フォーム', () => {
      const createSubmitEvent = (t) => {
        if (SubmitEvent && SubmitEvent.length > 0) {
          return new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
            submitter: t.submitter
          })
        } else {
          const evt = new Event('submit', {
            bubbles: true,
            cancelable: true
          })
          evt.submitter = t.submitter
          return evt
        }
      }

      const check_form_submit = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_form.html']

        const code = `
要素は${selectmethod}
要素をフォーム送信した時には、
WINDOW["event"]をDOMイベント処理停止する。
「SUBMITED」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('form')
        if (e) {
          e.addEventListener('submit', (event) => {
            event.preventDefault()
          })

          const btn = document.getElementById('submit')
          let evt = createSubmitEvent({ submitter: btn })
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["SUBMITED"]')
      }

      it('フォーム送信', () => {
        check_form_submit('「#form」')
      })

      it('フォーム送信 - dom', () => {
        check_form_submit('「form」をDOM要素ID取得')
      })
    })

    describe('キーボード', () => {
      const createKeyboardEvent = (type, t) => {
        const box = t.target.getBoundingClientRect()
        const { x, y } = t
        if (KeyboardEvent && KeyboardEvent.length > 0) {
          return new KeyboardEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            key: t.key || 0,
            code: t.code || 0
          })
        } else {
          const evt = new UIEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
          })
          evt.key = t.key || '',
          evt.code = t.code || ''
          return evt
        }
      }

      const check_event_key = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_scrolldiv.html']
        window.scrollX = 50
        window.scrollY = 50

        const code = `
要素は${selectmethod}
要素をキー押した時には、
「D:{押キー}」を報告する。
ここまで。
要素をキー離した時には、
「U:{押キー}」を報告する。
ここまで。
要素をキータイピングした時には、
「P:{押キー}」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('tgt')
        if (e) {
          const targetOffsets = [
            { target: e, key: 'A', code: 'D' },
            { target: e, key: 'C', code: 'E' },
            { target: e, key: 'Q', code: 'W' }
          ]

          let evt = createKeyboardEvent('keydown', targetOffsets[0])
          e.dispatchEvent(evt)

          evt = createKeyboardEvent('keyup', targetOffsets[1])
          e.dispatchEvent(evt)

          evt = createKeyboardEvent('keypress', targetOffsets[2])
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["D:A","U:C","P:Q"]')
      }

      it('キーボード押・話・押下', () => {
        check_event_key('「#tgt」')
      })
      it('キーボード押・話・押下 -  dom', () => {
        check_event_key('「tgt」をDOM要素ID取得')
      })
    })

    describe('マウス', () => {
      const createMouseEvent = (type, t) => {
        const box = t.target.getBoundingClientRect()
        const { x, y } = t
        if (MouseEvent && MouseEvent.length > 0) {
          return new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            button: t.btn || 0,
            buttons: t.btns || 0,
            clientX: box.left + x,
            clientY: box.top + y,
            screenX: window.screenLeft + box.left + x,
            screenY: window.screenTop + box.top + y,
            pageX: window.scrollX + box.left + x,
            pageY: window.scrollY + box.top + y
          })
        } else {
          const evt = new UIEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
          })
          evt.button = t.btn || 0,
          evt.buttons = t.btns || 0,
          evt.clientX = box.left + x,
          evt.clientY = box.top + y,
          evt.screenX = window.screenLeft + box.left + x,
          evt.screenY = window.screenTop + box.top + y,
          evt.pageX = window.scrollX + box.left + x,
          evt.pageY = window.scrollY + box.top + y
          return evt
        }
      }

      const check_event_mouse = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_scrolldiv.html']
        window.scrollX = 50
        window.scrollY = 50

        const code = `
要素は${selectmethod}
要素をクリックした時には、
「C:」を報告する。
ここまで。
要素をマウス押した時には、
「D:{マウスX},{マウスY}」を報告する。
ここまで。
要素をマウス移動した時には、
「M:{マウスX},{マウスY}」を報告する。
ここまで。
要素をマウス離した時には、
「U:{マウスX},{マウスY}」を報告する。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('tgt')
        if (e) {
          const targetOffsets = [
            { target: e, x:  0, y:  0, btn: 0, btns: 1 },
            { target: e, x: 30, y: 35, btn: 1, btns: 3 },
            { target: e, x: 30, y: 40, btn: 0, btns: 3 },
            { target: e, x: 20, y: 35, btn: 1, btns: 2 }
          ]

          let evt = createMouseEvent('click', targetOffsets[0])
          e.dispatchEvent(evt)

          evt = createMouseEvent('mousedown', targetOffsets[1])
          e.dispatchEvent(evt)

          evt = createMouseEvent('mousemove', targetOffsets[2])
          e.dispatchEvent(evt)

          evt = createMouseEvent('mouseup', targetOffsets[3])
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["C:","D:30,35","M:30,40","U:20,35"]')
      }

      it('マウス押・離・クリック', () => {
        check_event_mouse('「#tgt」')
      })
      it('マウス押・離・クリック - dom', () => {
        check_event_mouse('「tgt」をDOM要素ID取得')
      })
    })

    describe('タッチ', () => {
      const createTouches = (infos) => {
        const touches = []
        const createTouchFactory = () => {
          if (Touch && TouchEvent && Touch.length > 0 && TouchEvent.length > 0) {
            return (params) => {
              return new Touch(params)
            }
          } else {
            return (params) => {
              return params
            }
          }
        }
        const createTouch = createTouchFactory()

        infos.forEach(t => {
          const box = t.target.getBoundingClientRect()
          const { x, y } = t
          const params = {
            identifier: t.id,
            target: t.target,
            clientX: box.left + x,
            clientY: box.top + y,
            screenX: window.screenLeft + box.left + x,
            screenY: window.screenTop + box.top + y,
            pageX: window.scrollX + box.left + x,
            pageY: window.scrollY + box.top + y,
            radiusX: t.r || 1.0,
            radiusY: t.r || 1.0
          }
          touches.push(createTouch(params))
        })
        return touches
      }
      const createTouchEvent = (type, touches) => {
        if (Touch && TouchEvent && Touch.length > 0 && TouchEvent.length > 0) {
          return new TouchEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            changedTouches: touches.changed,
            targetTouches: touches.target,
            touches: touches.all
          })
        } else {
          const evt = new UIEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
          })
          evt.changedTouches = touches.changed
          evt.targetTouches = touches.target
          evt.touches = touches.all
          return evt
        }
      }
      const check_event_touch = (selectmethod) => {
        document.body.innerHTML = __html__['test/html/event_dom_scrolldiv.html']
        window.scrollX = 50
        window.scrollY = 50

        const code = `
要素は${selectmethod}
要素をタッチ開始した時には、
「S:{タッチX},{タッチY}」を報告する。
タッチ配列を反復する。
これはそれ
「{これ[0]},{これ[1]}」を報告する。
ここまで。
ここまで。
要素をタッチ終了した時には、
「E:{タッチX},{タッチY}」を報告する。
タッチ配列を反復する。
これはそれ
「{これ[0]},{これ[1]}」を報告する。
ここまで。
ここまで。
要素をタッチした時には、
「M:{タッチX},{タッチY}」を報告する。
タッチ配列を反復する。
これはそれ
「{これ[0]},{これ[1]}」を報告する。
ここまで。
ここまで。
要素をタッチキャンセルした時には、
「C:{タッチX},{タッチY}」を報告する。
タッチ配列を反復する。
これはそれ
「{これ[0]},{これ[1]}」を報告する。
ここまで。
ここまで。
`
        const cr = window.cr
        cr.reset()
        nako.run(code)

        const e = document.getElementById('tgt')
        if (e) {
          const targetOffsets = [
            { target: e, id: 42, x: 20, y: 30, r: 5 },
            { target: e, id: 43, x: 30, y: 35, r: 2 },
            { target: e, id: 42, x: 25, y: 35, r: 3 },
            { target: e, id: 42, x: 20, y: 35, r: 1 },
            { target: e, id: 43, x: 30, y: 35, r: 5 }
          ]
          const touchesList = createTouches(targetOffsets)

          let evt = createTouchEvent('touchstart', {
            changed: [ touchesList[0], touchesList[1] ],
            target: [ touchesList[0], touchesList[1] ],
            all: [ touchesList[0], touchesList[1] ]
          })
          e.dispatchEvent(evt)

          evt = createTouchEvent('touchmove', {
            changed: [ touchesList[2] ],
            target: [ touchesList[2], touchesList[1] ],
            all: [ touchesList[2], touchesList[1] ]
          })
          e.dispatchEvent(evt)

          evt = createTouchEvent('touchcancel', {
            changed: [ touchesList[3] ],
            target: [ touchesList[1] ],
            all: [ touchesList[1] ]
          })
          e.dispatchEvent(evt)

          evt = createTouchEvent('touchend', {
            changed: [ touchesList[4] ],
            target: [],
            all: []
          })
          e.dispatchEvent(evt)
        }

        assert.ok(cr.isCalled, 'イベント呼び出し')
        assert.strictEqual(cr.getMessageAsJson(), '["S:20,30","20,30","30,35","M:25,35","25,35","C:20,35","20,35","E:30,35","30,35"]')
      }

      it('タッチ開始・終了・移動・キャンセル', () => {
        check_event_touch('「#tgt」')
      })
      it('タッチ開始・終了・移動・キャンセル - dom', () => {
        check_event_touch('「tgt」をDOM要素ID取得')
      })
    })
  })
}
