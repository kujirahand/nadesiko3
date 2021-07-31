// @ts-nocheck
const assert = require('chai').assert

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('ace editor test', () => {
  before(function (done) {
    this.timeout(100000)
    // シンタックスハイライトが終わるまで少し時間がかかる。
    const wait = () => {
      if (window.ok) {
        done()
        return
      }
      setTimeout(() => { wait() }, 100)
    }
    wait()
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
            node.innerText.trim().startsWith('も')
        ),
        null
      )
    })
    it('関数', () => {
      // #editor1内の「表示」が関数として認識されていることを確認する。
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor1'),
          (node) =>
            node.classList.contains('ace_function') &&
            node.innerText.trim().startsWith('表')
        ),
        null
      )
    })
    it('範囲コメント', () => {
      // #editor2内の「範囲コメント」がコメントとして認識されていることを確認する。
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor2'),
          (node) =>
            node.classList.contains('ace_comment') &&
            node.innerText.trim().startsWith('範')
        ),
        null
      )
    })
    it('エディタの値を変更したときにシンタックスハイライトが更新されることを確認', async function () {
      this.timeout(5 * 1000) // このテストはタイムアウトのときのみエラーになる。

      const { editor } = navigator.nako3.setupEditor('editor-input-test')

      // "「」を表示" を打って、"「" が文字列として認識されることを確認
      editor.setValue('「」を表示')
      editor.session.selection.clearSelection()
      while (findDOMElement(document.querySelector('#editor-input-test'), (node) => node.classList.contains('ace_string') && node.innerText.trim().startsWith('「')) === null) {
        await sleep(100)
      }

      // "1を表示" を打って、1が数値として認識されることを確認
      editor.setValue('1を表示'); await sleep(350)
      editor.session.selection.clearSelection()
      while (findDOMElement(document.querySelector('#editor-input-test'), (node) => node.classList.contains('ace_numeric') && node.innerText.trim().startsWith('1')) === null) {
        await sleep(100)
      }
    })
    it('外部ファイルで定義された関数', () => {
      // 「痕跡演算」が関数として認識されることを確認
      assert.notStrictEqual(
        findDOMElement(
          document.querySelector('#editor8'),
          (node) =>
            node.classList.contains('ace_function') &&
            node.innerText.trim().startsWith('痕')
        ),
        null
      )
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
    it('setTimeout内から飛ぶエラーの表示', async function () {
      this.timeout(5 * 1000)
      while (document.querySelector('#editor10 .marker-red') === null) {
        await sleep(100)
      }
    })
  })
  describe('コンパイラの警告の表示', () => {
    it('存在する場合', () => {
      assert.notStrictEqual(document.querySelector('#editor9 .marker-yellow'), null)
    })
  })
  describe('出力のボックス', () => {
    it('コンパイルエラーを表示する', () => {
      assert.strictEqual(document.querySelector('#editor7-output').innerText.trim(), '[実行時エラー]main.nako3(2行目): エラー『1』が発生しました。')
      assert.strictEqual(document.querySelector('#editor8-output').innerText.trim(), '')
      assert.strictEqual(document.querySelector('#editor9-output').innerText.trim(), '[警告]main.nako3(1行目): 変数『a』は定義されていません。\nundefined')
      assert.strictEqual(document.querySelector('#editor11-output').innerText.trim(), '[字句解析エラー]main.nako3(1行目): 展開あり文字列で値の埋め込み{...}が対応していません。')
    })
    it('プログラムの出力を表示する', () => {
      assert.strictEqual(document.querySelector('#editor1-output').innerText.trim(), 'こんにちは')
    })
  })
  describe('code lens', () => {
    it('テストの定義の上に実行ボタンが表示される', () => {
      assert.strictEqual(document.querySelectorAll('#editor12 .ace_codeLens').length, 2)
    })
    it('テストボタンをクリックするとcallbackが呼ばれる', () => {
      assert.strictEqual(window.codeLensClicked, undefined)
      // 1つ目のテスト定義のボタンを押して、「テスト:足す」のボタンが押されたことがcallbackで伝えられることを確認
      document.querySelector('#editor12 .ace_codeLens a').dispatchEvent(new window.CustomEvent('click', { bubbles: true }))
      assert.strictEqual(window.codeLensClicked, '足す')
    })
  })
  describe('テストの実行', () => {
    it('落ちる場合', async () => {
      // 「足す」のテストが落ちることを確認する
      const { promise, logger } = window.editor12.run({ method: 'test', testName: '足す' })
      let log = ''
      logger.addListener('stdout', ({ noColor }) => { log += noColor })
      await promise
      assert(log.includes('失敗 1件'))
    })
    it('通る場合', async () => {
      // 「引く」のテストが通ることを確認する
      const { promise, logger } = window.editor12.run({ method: 'test', testName: '引く' })
      let log = ''
      logger.addListener('stdout', ({ noColor }) => { log += noColor })
      await promise
      assert(log.includes('成功 1件'))
    })
  })
})
