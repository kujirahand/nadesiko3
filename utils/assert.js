const chai = require('chai')

function wrappedAssert (chai) {
  const assert = chai.assert

  const assertThrows = assert.throws
  assert.throws = function (fn, error, message) {
    if (arguments.length == 2 && typeof error === 'object' && error !== null) {
      if (typeof error.name === 'string') {
        return assertThrows(fn, eval(error.name), error.message)
      } else {
        return assertThrows(fn, error.name, error.message)
      }
    }
    return assertThrows.apply(null, arguments)
  }

  const assertStrict = {}

  Object.keys(assert).forEach(function (key) {
    assertStrict[key] = assert[key]
  })

  assertStrict.equal = assertStrict.strictEqual
  assertStrict.notEqual = assertStrict.notStrictEqual

  assert.strict = assertStrict

  return assert
}

const assert = wrappedAssert(chai)

module.exports = assert
