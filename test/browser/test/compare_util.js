const assert = require('chai').assert

class CompareUtil {
  constructor (nako) {
    this._nako = nako
  }

  cmp (code, res) {
    this.nako.logger.debug('code=' + code)
    assert.strictEqual(this.nako.run(code).log, res)
  }

  cmpex (code, err, res) {
    this.nako.logger.debug('code=' + code)
    assert.throws(() => { this.nako.run(code) }, err, res)
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
