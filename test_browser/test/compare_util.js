const assert = require('assert').strict

class CompareUtil {
  constructor (nako) {
    this._nako = nako
  }

  cmp (code, res) {
    if (this.nako.debug) {
      console.log('code=' + code)
    }
    assert.equal(this.nako.runReset(code).log, res)
  }

  cmpex (code, err, res) {
    if (this.nako.debug) {
      console.log('code=' + code)
    }
    assert.throws(() => { this.nako.runReset(code) }, err, res)
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

export { CompareUtil, waitTimer, assert }
