/**
 * nadesiko v3 parser (demo version)
 */
const operatorTypes = [
  '+', '-', '*', '/', '%', '^', '&',
  'eq', 'noteq', 'gt', 'gteq', 'lt', 'lteq',
  'and', 'or'
]
const keizokuJosi = [
  'いて', 'えて', 'きて', 'けて', 'して', 'って', 'にて', 'みて', 'めて', 'ねて'
]

class NakoSyntaxError extends Error {
  constructor (msg, line) {
    const title = `[文法エラー](${line}): ${msg}`
    super(title)
  }
}

class NakoParser {
  constructor () {
    this.debug = false
    this.index = 0
    this.tokens = []
    this.stack = []
    this.funclist = {}
    this.indexStack = []
    this.y = []
    this.skipFuncInCalc = false
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
      // console.log('accept=rollback', types, this.tokens[this.index])
      this.index = tmpIndex
      return false
    }
    // console.log('accept=try', types)
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
    // console.log('accept=ok', types, y)
    return true
  }
  get () {
    if (this.isEOF()) return null
    return this.tokens[this.index++]
  }
  unget () {
    if (this.index > 0) this.index--
  }
  peek (i = 0) {
    if (this.isEOF()) return null
    return this.tokens[this.index + i]
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
    return this.ySentenceList()
  }
  ySentenceList () {
    const blocks = []
    let line = -1
    while (!this.isEOF()) {
      if (!this.accept([this.ySentence])) break
      blocks.push(this.y[0])
      if (line < 0) line = this.y[0].line
    }
    if (blocks.length === 0) {
      throw new NakoSyntaxError('構文解析に失敗:' + this.nodeToStr(this.peek()), line)
    }
    return { type: 'block', block: blocks, line }
  }
  yBlock () {
    const blocks = []
    let line = -1
    while (!this.isEOF()) {
      if (this.checkTypes(['違えば', 'ここまで'])) break
      if (!this.accept([this.ySentence])) break
      blocks.push(this.y[0])
      if (line < 0) line = this.y[0].line
    }
    return { type: 'block', block: blocks, line }
  }
  ySentence () {
    if (this.check('eol')) return this.get()
    if (this.check('embed_code')) return this.get()
    if (this.accept([this.yLet])) return this.y[0]
    if (this.accept([this.yIF])) return this.y[0]
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
        // console.log('POP :', t)
        return t
      }
    }
    // 該当する助詞が見つからなかった場合
    return null
  }

  pushStack (item) {
    // console.log('PUSH:', item)
    this.stack.push(item)
  }

  yIF () {
    if (!this.check('もし')) return null
    const mosi = this.get() // skip もし
    const cond = this.yCalc()
    if (cond === null) throw new NakoSyntaxError('もし文で条件指定のエラー。', mosi.line)
    // TODO: 特別構文の確認 - もし、NがBならば
    let trueBlock = null
    let falseBlock = null
    if (this.check('ならば')) this.get() // skip ならば
    if (this.check('eol')) { // BLOCK
      this.get() // skip eol
      trueBlock = this.yBlock()
      if (this.check('違えば')) {
        this.get()
        falseBlock = this.yBlock()
      }
      if (this.check('ここまで')) this.get()
    } else {
      trueBlock = this.ySentence()
      if (this.check('違えば')) {
        this.get()
        falseBlock = this.ySentence()
      }
    }
    return {
      type: 'if',
      expr: cond,
      block: trueBlock,
      false_block: falseBlock,
      josi: '',
      line: mosi.line
    }
  }

  yGetArg () {
    if (this.checkTypes(['number', 'string', 'word'])) {
      let t = this.yValue()
      if (this.checkTypes(operatorTypes)) {
        this.unget()
        t = this.yCalcNoFunc()
      }
      return t
    }
    if (this.checkTypes(['(', '{', '[', '-'])) {
      return this.yCalcNoFunc()
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
    if (!isClose) throw new NakoSyntaxError(`C風関数『${func.value}』でカッコが閉じていません`, func.line)
  }

  yCall () {
    if (this.isEOF()) return null
    while (!this.isEOF()) {
      // 代入
      if (this.check('代入')) {
        const dainyu = this.get()
        const value = this.popStack(['を'])
        const word = this.popStack(['へ', 'に'])
        if (!word || word.type !== 'word') throw NakoSyntaxError('代入文で代入先の変数が見当たりません。', dainyu.line)
        return {type: 'let', name: word, value: value, line: dainyu.line, josi: ''}
      }
      // 関数
      if (this.check('func')) {
        const t = this.get()
        const f = t.meta
        const args = []
        if (this.check('(')) { // C言語風関数呼び出し
          this.yGetArgParen(t)
          for (let i = 0; i < f.josi.length; i++) {
            const popArg = this.popStack([])
            if (!popArg) throw new NakoSyntaxError(`関数『${t.value}』の引数指定エラー`, t.line)
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
          if (numCount >= 2) throw new NakoSyntaxError(`関数『${t.value}』の引数指定エラー`, t.line)
        }
        const funcNode = {type: 'func', name: t.value, args: args, josi: t.josi, line: t.line}
        // 言い切りならそこで一度切る
        if (t.josi === '') {
          return funcNode
        }
        // **して、** の場合も一度切る
        if (keizokuJosi.indexOf(t.josi) >= 0) {
          funcNode.josi = ''
          return funcNode
        }
        // 続き
        this.pushStack(funcNode)
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
    // 助詞が余ってしまった場合
    if (this.stack.length > 0) {
      let names = ''
      let line = 0
      this.stack.forEach(n => {
        const name = this.nodeToStr(n)
        names += name
        line = n.line
      })
      if (this.debug) {
        console.log('--- stack dump ---')
        console.log(JSON.stringify(this.stack, null, 2))
        console.log('peek: ', JSON.stringify(this.peek(), null, 2))
      }
      throw new NakoSyntaxError(`余剰単語${names}があります`, line)
    }
    return this.popStack([])
  }

  nodeToStr (node) {
    if (!node) return `(NULL)`
    let name = node.name
    if (node.type === 'op') {
      name = '演算子[' + node.operator + ']'
    }
    if (!name) name = node.value
    if (typeof name !== 'string') name = node.type
    if (this.debug) name += '→' + JSON.stringify(node, null, 2)
    return `『${name}』`
  }

  yLet () {
    if (this.accept(['word', 'eq', this.yCalc])) {
      return {
        type: 'let',
        name: this.y[0],
        value: this.y[2],
        line: this.y[0].line
      }
    }
    if (this.accept(['word', '@', this.yValue, 'eq', this.yCalc])) {
      return {
        type: 'let_array',
        name: this.y[0],
        index: [this.y[2]],
        value: this.y[4],
        line: this.y[0].line
      }
    }
    if (this.accept(['word', '[', this.yCalc, ']', 'eq', this.yCalc])) {
      return {
        type: 'let_array',
        name: this.y[0],
        index: [this.y[2]],
        value: this.y[5],
        line: this.y[0].line
      }
    }
    return null
  }

  yCalcNoFunc () {
    const tmp = this.skipFuncInCalc
    this.skipFuncInCalc = true
    const t = this.yCalc()
    this.skipFuncInCalc = tmp
    return t
  }
  yCalc () {
    if (this.check('eol')) return null
    const t = this.yLoOp()
    if (!t) return null
    // 関数の呼び出しがある場合
    if (this.skipFuncInCalc === false && t.josi !== '') {
      this.pushStack(t)
      return this.yCall()
    }
    return t
  }
  yLoOp () {
    if (!this.accept([this.yCmpOp])) return null
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['and', this.yCmpOp])) {
        p = {type: 'op', operator: 'and', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      if (this.accept(['or', this.yCmpOp])) {
        p = {type: 'op', operator: 'or', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yCmpOp () {
    if (!this.accept([this.yPlusMinus])) return null
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['eq', this.yPlusMinus])) {
        p = {type: 'op', operator: 'eq', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      if (this.accept(['noteq', this.yPlusMinus])) {
        p = {type: 'op', operator: 'noteq', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yPlusMinus () {
    if (!this.accept([this.yMulDiv])) return null
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
      if (this.accept(['&', this.yMulDiv])) {
        p = {type: 'op', operator: '&', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yMulDiv () {
    if (!this.accept([this.yPriCalc])) return null
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
      if (this.accept(['%', this.yPriCalc])) {
        p = {type: 'op', operator: '/', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yPriCalc () {
    if (!this.accept([this.yValue])) return null
    let p = this.y[0]
    while (!this.isEOF()) {
      if (this.accept(['^', this.yValue])) {
        p = {type: 'op', operator: '^', left: p, right: this.y[1], josi: this.y[1].josi}
        continue
      }
      break
    }
    return p
  }
  yValue () {
    // 丸括弧
    if (this.accept(['(', this.yCalc, ')'])) {
      this.y[1].josi = this.y[2].josi
      return this.y[1]
    }
    // マイナス記号
    if (this.check('-')) {
      const m = this.get() // skip '-'
      const v = this.yCalcNoFunc()
      return {
        type: 'op',
        operator: '*',
        left: {type: 'number', value: -1, line: m.line},
        right: v,
        josi: v.josi,
        line: m.line
      }
    }
    // NOT
    if (this.check('not')) {
      const m = this.get() // skip '!'
      const v = this.yCalcNoFunc()
      return {
        type: 'not',
        value: v,
        josi: v.josi,
        line: m.line
      }
    }
    // JSON object
    const a = this.yJSONArray()
    if (a) return a
    const o = this.yJSONObject()
    if (o) return o
    // プリミティブな値
    if (this.checkTypes(['number', 'string'])) {
      return this.get()
    }
    // 変数
    const word = this.yValueWord()
    if (word) return word
    // 埋め込み文字列
    if (this.check('embed_code')) return this.get()
    // その他
    return null
  }
  yValueWord () {
    if (this.check('word')) {
      const word = this.get()
      if (this.checkTypes(['@', '['])) {
        const list = []
        let josi = ''
        while (!this.isEOF()) {
          let idx = null
          if (this.accept(['@', this.yCalcNoFunc])) {
            idx = this.y[1]
            josi = idx.josi
          }
          if (this.accept(['[', this.yCalcNoFunc, ']'])) {
            idx = this.y[1]
            josi = this.y[2].josi
          }
          if (idx === null) break
          list.push(idx)
        }
        if (list.length === 0) throw new NakoSyntaxError(`配列『${word.value}』アクセスで指定ミス`, word.line)
        return {
          type: 'ref_array',
          name: word,
          index: list,
          josi: josi,
          line: word.line
        }
      }
      return word
    }
    return null
  }
  yJSONObjectValue () {
    const a = []
    while (!this.isEOF()) {
      if (this.check('}')) break
      if (this.accept(['word', ':', this.yCalc])) {
        a.push({
          key: this.y[0],
          value: this.y[2]
        })
      } else if (this.accept(['string', ':', this.yCalc])) {
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
    if (this.accept(['{', '}'])) {
      return {
        type: 'json_obj',
        value: [],
        josi: this.y[1].josi,
        line: this.y[0].line
      }
    }
    if (this.accept(['{', this.yJSONObjectValue, '}'])) {
      return {
        type: 'json_obj',
        value: this.y[1],
        josi: this.y[2].josi,
        line: this.y[0].line
      }
    }
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
    if (this.accept(['[', ']'])) {
      return {
        type: 'json_array',
        value: [],
        josi: this.y[1].josi,
        line: this.y[0].line
      }
    }
    if (this.accept(['[', this.yJSONArrayValue, ']'])) {
      return {
        type: 'json_array',
        value: this.y[1],
        josi: this.y[2].josi,
        line: this.y[0].line
      }
    }
    return null
  }
}

module.exports = NakoParser
