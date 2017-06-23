/**
 * nadesiko v3 parser (demo version)
 */
const operatorTypes = [
  '+', '-', '*', '/', '%',
  'EQ', 'NOTEQ', 'GT', 'GTEQ', 'LT', 'LTEQ',
  'AND', 'OR'
]

class NakoParser {
  constructor () {
    this.index = 0
    this.tokens = []
    this.stack = []
    this.funclist = {}
    this.indexStack = []
    this.y = []
  }
  setFuncList (funclist) {
    this.funclist = funclist
  }
  parse (tokens) {
    this.index = 0
    this.tokens = tokens
    return this.startParser()
  }
  isEOF () {
    return (this.index >= this.tokens.length)
  }
  check (ttype) {
    return (this.tokens[this.index].type === ttype)
  }
  checkTypes (a) {
    const type = this.tokens[this.index].type
    return (a.indexOf(type) >= 0)
  }
  accept (types) {
    const y = []
    const tmpIndex = this.index
    const rollback = () => {
      console.log('accept=rollback', types, this.tokens[this.index])
      this.index = tmpIndex
      return false
    }
    console.log('accept=try', types)
    for (let i = 0; i < types.length; i++) {
      if (this.isEOF()) return rollback()
      const type = types[i]
      if (typeof type === 'string') {
        const token = this.get()
        if (token.type !== type) return rollback()
        y[i] = token
        continue
      }
      if (typeof type === 'function') {
        const f = type.bind(this)
        const r = f(null)
        if (r === null) return rollback()
        y[i] = r
        continue
      }
      throw new Error('System Error : accept broken')
    }
    this.y = y
    console.log('accept=ok', types, y)
    return true
  }
  get () {
    if (this.isEOF()) return null
    return this.tokens[this.index++]
  }
  unget () {
    if (this.index > 0) this.index--
  }
  peek () {
    if (this.isEOF()) return null
    return this.tokens[this.index]
  }
  pushIndex () {
    this.indexStack.push(this.index)
  }
  rollbackIndex () {
    if (this.indexStack.length === 0) {
      throw new Error('System Error: no indexStack')
    }
    this.index = this.indexStack.pop()
    return false
  }
  parseTokens () {
    while (this.index < this.tokens.length) {
      if (!this.parseToken()) break
      this.index++
    }
  }
  startParser () {
    return this.ySentenceList(null)
  }
  ySentenceList () {
    const blocks = []
    if (this.accept([this.ySentence])) {
      blocks.push(this.y[0])
    } else {
      return false
    }
    while (!this.isEOF()) {
      if (!this.accept([this.ySentence])) break
      blocks.push(this.y[0])
    }
    return {type: 'block', block: blocks}
  }
  ySentence () {
    if (this.accept(['EOL'])) return this.y[0]
    if (this.accept([this.yLet])) return this.y[0]
    if (this.accept([this.yCall])) return this.y[0]
    return null
  }
  popStack (josiList) {
    // 末尾から josiList にマッチする助詞を探す
    for (let i = 0; i < this.stack.length; i++) {
      const bi = this.stack.length - i - 1
      const t = this.stack[bi]
      if (josiList.length === 0 || josiList.indexOf(t.josi) >= 0) {
        this.stack.splice(bi, 1) // remove stack
        console.log('POP :', t)
        return t
      }
    }
    // 該当する助詞が見つからなかった場合
    return null
  }
  pushStack (item) {
    console.log('PUSH:', item)
    this.stack.push(item)
  }
  yGetArg () {
    if (this.checkTypes(['NUMBER', 'STRING', 'WORD'])) {
      let t = this.get()
      if (this.checkTypes(operatorTypes)) {
        this.unget()
        t = this.yCalc(null)
      }
      return t
    }
    return null
  }

  yGetArgParen (func) { // C言語風呼び出しで(...)の引数をスタックに載せる
    this.get() // skip '('
    let isClose = false
    while (!this.isEOF()) {
      if (this.check(')')) {
        this.get() // skip ')'
        isClose = true
        break
      }
      const v = this.yGetArg()
      if (v) {
        this.pushStack(v)
        continue
      }
      break
    }
    if (!isClose) throw new Error(`C風関数『${func.value}』でカッコが閉じていません`)
  }
  yCall () {
    if (this.isEOF()) return null
    while (!this.isEOF()) {
      // 関数
      if (this.check('FUNC')) {
        const t = this.get()
        const f = t.meta
        const args = []
        if (this.check('(')) { // C言語風関数呼び出し
          this.yGetArgParen(t)
          for (let i = 0; i < f.josi.length; i++) {
            const popArg = this.popStack([])
            if (!popArg) throw new Error(`関数『${t.value}』の引数指定エラー`)
            args.unshift(popArg)
          }
        } else { // なでしこ風関数呼び出し
          let numCount = 0
          for (const arg of f.josi) {
            const popArg = this.popStack(arg)
            args.push(popArg)
            if (popArg === null) numCount++
          }
          // 1つだけなら、変数「それ」で補完される
          if (numCount >= 2) throw new Error(`関数『${t.value}』の引数指定エラー`)
        }
        this.pushStack({type: 'FUNC', name: t.value, args: args, josi: t.josi, line: t.line})
        continue
      }
      // 引数
      const value = this.yGetArg()
      if (value) {
        this.pushStack(value)
        continue
      }
      break
    }
    return this.popStack([])
  }

  yLet () {
    if (this.accept(['WORD', 'EQ', this.yCalc])) {
      return {type: 'let', name: this.y[0], value: this.y[2]}
    }
    if (this.accept(['WORD', '@', this.yCalc, 'EQ', this.yCalc])) {
      return {type: 'let_array', name: this.y[0], index: this.y[1], value: this.y[4]}
    }
    if (this.accept(['WORD', '[', this.yCalc, ']', 'EQ', this.yCalc])) {
      return {type: 'let_array', name: this.y[0], index: this.y[1], value: this.y[5]}
    }
    return null
  }

  yCalc () {
    if (this.accept([this.yLoOp])) return this.y[0]
    return null
  }
  yLoOp () {
    if (!this.accept([this.yCmpOp])) return false
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['AND', this.yCmpOp])) {
        p = {type: 'op', operator: 'and', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      if (this.accept(['OR', this.yCmpOp])) {
        p = {type: 'op', operator: 'or', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yCmpOp () {
    if (!this.accept([this.yPlusMinus])) return false
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['EQ', this.yPlusMinus])) {
        p = {type: 'op', operator: 'eq', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      if (this.accept(['NOTEQ', this.yPlusMinus])) {
        p = {type: 'op', operator: 'noteq', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yPlusMinus () {
    if (!this.accept([this.yMulDiv])) return false
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['+', this.yMulDiv])) {
        p = {type: 'op', operator: '+', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      if (this.accept(['-', this.yMulDiv])) {
        p = {type: 'op', operator: '-', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yMulDiv () {
    if (!this.accept([this.yPriCalc])) return false
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['*', this.yPriCalc])) {
        p = {type: 'op', operator: '*', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      if (this.accept(['/', this.yPriCalc])) {
        p = {type: 'op', operator: '/', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yPriCalc () {
    if (this.accept([this.yValue])) return this.y[0]
    return null
  }
  yJSONObjectValue () {
    const a = []
    while (!this.isEOF()) {
      if (this.check('}')) break
      if (this.accept(['WORD', ':', this.yCalc])) {
        a.push({
          key: this.y[0],
          value: this.y[2]
        })
      } else if (this.accept(['STRING', ':', this.yCalc])) {
        a.push({
          key: this.y[0],
          value: this.y[2]
        })
      }
      if (this.check(',')) this.get() // skip ','
    }
    return a
  }
  yJSONObject () {
    if (this.accept(['{', '}'])) return {type: 'json_object', value: [], line: this.y[0].line}
    if (this.accept(['{', this.yJSONObjectValue, '}'])) return {type: 'json_object', value: this.y[1], line: this.y[0].line}
    return null
  }
  yJSONArrayValue () {
    const v = this.yCalc()
    if (v === null) return null
    const a = [v]
    while (!this.isEOF()) {
      if (this.check(']')) break
      if (this.check(',')) this.get() // skip ','
      const v2 = this.yCalc()
      if (v2 === null) break
      a.push(v2)
    }
    return a
  }
  yJSONArray () {
    if (this.accept(['[', ']'])) return {type: 'json_array', value: [], line: this.y[0].line}
    if (this.accept(['[', this.yJSONArrayValue, ']'])) return {type: 'json_array', value: this.y[1], line: this.y[0].line}
    return null
  }
  yValue () {
    if (this.accept(['(', this.yCalc, ')'])) return this.y[1]
    const a = this.yJSONArray()
    if (a) return a
    const o = this.yJSONObject()
    if (o) return o
    if (this.checkTypes(['NUMBER', 'STRING', 'WORD'])) {
      const n = this.peek()
      if (n.josi !== '') { // 助詞が空でない→関数の呼び出しがある
        return this.yCall()
      }
      return this.get()
    }
    return null
  }
}

module.exports = NakoParser
