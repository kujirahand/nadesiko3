const assert = require('assert').strict

describe('bundled test', () => {
  it('version', () => {
    const els = document.getElementsByClassName('version-component')
    if (els.length > 0) {
      assert.ok(/日本語プログラミング言語「なでしこ3」/.test(els[0].innerHTML), 'notfound "日本語プログラミング言語「なでしこ3」" in version-component')
    } else {
      assert.fail('no element has version-component class')
    }
  })

  describe('editor', () => {
    let ta = null
    let el = null
    let run = null
    let rslt = null
    it('textarea default', () => {
      const els = document.getElementsByClassName('editor-component')
      if (els.length > 0) {
        el = els[0]
        ta = el.querySelector('.nako3_editor_code')
        if (ta) {
          assert.ok(/「こんにちは！」と表示。/.test(ta.innerText), 'HTML要素が文字列"「こんにちは！」と表示。"を含みません。')
        } else {
          assert.fail('no element has src class and not has src_read')
        }
      } else {
        assert.fail('no element has editor-component class')
      }
    })
    it('run', () => {
      run = Array.from(el.querySelectorAll('button.default_button')).find(e => e.textContent === '実行')
      if (run) {
        const evt = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1
        })
        run.dispatchEvent(evt)

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const rsltHead = Array.from(el.querySelectorAll('.edit_head')).find(e => e.textContent === '実行結果')
              if (rsltHead) {
                rslt = rsltHead.parentNode.querySelector('.info')
                if (rslt) {
                  assert.ok(/こんにちは！.+9/m.test(rslt.innerHTML), '文字列「こんにちは！」と「9」が出力エリアに表示されていません。')
                  resolve()
                } else {
                  assert.fail('.infoが存在しません。')
                }
              } else {
                assert.fail('.edit_headを見つけられませんでした。')
              }
            } catch (err) {
              reject(err)
            }
          }, 500)
        })
      } else {
        assert.fail('no element 実行 button-component class')
      }
    })
  })
})
