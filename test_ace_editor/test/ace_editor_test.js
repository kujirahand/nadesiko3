const assert = require('assert').strict

/** @type {(node: HTMLElement, f: (node: HTMLElement) => boolean) => HTMLElement | null} */
const findDOMElement = (node, f) => {
  if (f(node)) { return node }
  for (const child of node.children) {
    const v = findDOMElement(child, f)
    if (v) {
      return v
    }
  }
  return null
}

describe('ace editor test', () => {
  before((done) => {
    // シンタックスハイライトが終わるまで少し時間がかかる。
    setTimeout(() => { done() }, 200);
  })
  describe('シンタックスハイライト', () => {
    it('制御構文', () => {
      // #editor1内の「もし」が .ace_keyword.ace_control でシンタックスハイライトされていることを確認する。
      // innerTextが「も」で始まり、ace_keywordとace_controlクラスが付いているタグが存在すれば良い。
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor1'),
          (node) =>
            node.classList.contains('ace_keyword') &&
            node.classList.contains('ace_control') &&
            node.innerText.trim().startsWith('も'),
        ),
        null,
      )
    })
    it('関数', () => {
      // #editor1内の「表示」が関数として認識されていることを確認する。
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor1'),
          (node) =>
            node.classList.contains('ace_function') &&
            node.innerText.trim().startsWith('表'),
        ),
        null,
      )
    })
    it('範囲コメント', () => {
      // #editor2内の「範囲コメント」がコメントとして認識されていることを確認する。
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor2'),
          (node) =>
            node.classList.contains('ace_comment') &&
            node.innerText.trim().startsWith('範'),
        ),
        null,
      )
    })
    it('エディタの値を変更したときにシンタックスハイライトが更新されることを確認', async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const { editor } = navigator.nako3.setupEditor("editor-input-test"); await sleep(350)

      // "「」を表示" を打って、"「" が文字列として認識されることを確認
      editor.setValue('「」を表示'); await sleep(350)
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor-input-test'),
          (node) =>
            node.classList.contains('ace_string') &&
            node.innerText.trim().startsWith('「'),
        ),
        null,
      )
      editor.session.selection.clearSelection()

      // "1を表示" を打って、1が数値として認識されることを確認
      editor.setValue('1を表示'); await sleep(350)
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor-input-test'),
          (node) =>
            node.classList.contains('ace_numeric') &&
            node.innerText.trim().startsWith('1'),
        ),
        null,
      )
      editor.session.selection.clearSelection()
    })
  })
  describe('行の折りたたみ', () => {
    it('存在する場合', () => {
      // #editor2に折りたたみ用のボタンが生成されていることを確認する。
      // 折りたたみ用のボタンのHTMLタグには .ace_fold-widget クラスが付いている。
      assert.notStrictEqual(document.querySelector('#editor2 .ace_fold-widget'), null)
    })
    it('存在しない場合', () => {
      // #editor3に折りたたみ用のボタンが生成されていないことを確認する。
      assert.strictEqual(document.querySelector('#editor3 .ace_fold-widget'), null)
    })
  })
  describe('コンパイルエラーの表示', () => {
    it('存在する場合', () => {
      // #editor4, 7 に赤線が引かれていることを確認する。
      assert.notStrictEqual(document.querySelector('#editor4 .marker-red'), null)
      assert.notStrictEqual(document.querySelector('#editor7 .marker-red'), null)
    })
    it('存在しない場合', () => {
      // #editor1, 2, 3 に赤線が引かれていないことを確認する。
      assert.strictEqual(document.querySelector('#editor1 .marker-red'), null)
      assert.strictEqual(document.querySelector('#editor2 .marker-red'), null)
      assert.strictEqual(document.querySelector('#editor3 .marker-red'), null)
    })
  })
})
