class NakoTest {
  constructor () {
    /** @type {{ name: string, f: () => void }[]} */
    this.tests = []
  }

  /** @param {any} a, @param {any} b */
  static assertStrictEqual (a, b) {
    if (a !== b) {
      throw new Error('')
    }
  }

  /** @param {unknown} a */
  static inspect (a) {
    switch (typeof a) {
      case 'bigint': return `bigint値『${a}』`
      case 'boolean': return a + ''
      case 'function': return `関数『${a.name}』`
      case 'number': return `数値${a}`
      case 'object':
        if (a === null) {
          return a + ''
        }
        try {
          return `オブジェクト『${JSON.stringify(a)}』`
        } catch (e) { // 循環参照など
          return `オブジェクト『${a}』`
        }
      case 'string': return `文字列『${a}』`
      case 'symbol': return `シンボル『${a.toString()}』`
      case 'undefined': return a + ''
    }
  }
}

module.exports = NakoTest
