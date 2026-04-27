// @ts-nocheck
import { assert } from 'chai'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

describe('ace editor smoke test', () => {
  before(function (done) {
    this.timeout(100000)
    const wait = () => {
      if (window.ok) {
        done()
        return
      }
      setTimeout(() => { wait() }, 100)
    }
    wait()
  })

  it('制御構文をシンタックスハイライトできる', () => {
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

  it('折りたたみボタンを表示できる', () => {
    assert.notStrictEqual(document.querySelector('#editor2 .ace_fold-widget'), null)
  })

  it('実行時エラーをマーカー表示できる', async function () {
    this.timeout(5 * 1000)
    while (document.querySelector('#editor10 .marker-red') === null) {
      await sleep(100)
    }
  })

  it('プログラム出力を表示できる', () => {
    assert.strictEqual(document.querySelector('#editor1-output').innerText.trim(), 'こんにちは')
  })

  it('code lens ボタンを表示できる', () => {
    assert.strictEqual(document.querySelectorAll('#editor12 .ace_codeLens').length, 2)
  })
})
