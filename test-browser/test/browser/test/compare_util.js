import { assert } from 'chai'

class CompareUtil {
  constructor (nako) {
    this._nako = nako
  }

  _runAndGetLog (code) {
    // 旧ブラウザテストは各ケースで単一ログ出力を期待するため、毎回ログを初期化する
    if (this.nako && this.nako.logger && typeof this.nako.logger.clear === 'function') {
      this.nako.logger.clear()
    }
    return this.nako.runSync(code, 'main.nako3', { resetAll: true, resetEnv: true }).log
  }

  cmp (code, res) {
    this.nako.logger.debug('code=' + code)
    assert.strictEqual(this._runAndGetLog(code), res)
  }

  cmpex (code, err, res) {
    this.nako.logger.debug('code=' + code)
    assert.throws(() => { this._runAndGetLog(code) }, err, res)
  }

  get nako () {
    return this._nako
  }
}

const waitTimer = (second) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, second * 1000)
  })
}

/**
 * 5秒たつかfがエラーを投げなくなるまで繰り返す。呼び出すときは必ずawaitすること。
 * @type {<T>(f: () => Promise<T>) => Promise<T>}
 */
const retry = async (f) => {
  const startTime = Date.now()
  while (true) {
    try {
      return await f()
    } catch (err) {
      if (Date.now() - startTime < 5000) {
        await waitTimer(0.1)
        continue
      }
      throw err
    }
  }
}

export { CompareUtil, waitTimer, assert, retry }
