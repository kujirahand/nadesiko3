/**
 * nadesiko v3 parser (demo version)
 */
const { opPriority, keizokuJosi, valueTypes } = require('./nako_parser_const')

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
  check2 (a) {
    for (let i = 0; i < a.length; i++) {
      const idx = i + this.index
      if (this.tokens.length <= idx) return false
      if (a[i] === '*') continue // ワイルドカード(どんなタイプも許容)
      const t = this.tokens[idx]
      if (t.type !== a[i]) return false
    }
    return true
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
      if (type instanceof Array) {
        if (!this.checkTypes(type)) return rollback()
        y[i] = this.get()
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
    if (!josiList) return this.stack.pop()
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

  yIFCond () { // もしの条件の取得
    // 「もし、AがBならば」という記述方法の確認
    const a = this.yGetArg()
    if (!a) return null
    if (a.josi === 'が') {
      if (this.check2(['*', 'ならば'])) {
        const b = this.get()
        const naraba = this.get()
        return {
          type: 'op',
          operator: (naraba.value !== 'でなければ') ? 'noteq' : 'eq',
          left: a,
          right: b,
          line: a.line,
          josi: ''
        }
      }
    }
    // 「Aでなければ」を確認
    if (this.check('ならば')) {
      const naraba = this.get()
      if (naraba.value === 'でなければ') {
        return {
          type: 'not',
          value: a,
          line: a.line,
          josi: ''
        }
      }
    }
    return a
  }

  yIF () {
    if (!this.check('もし')) return null
    const mosi = this.get() // skip もし
    const cond = this.yIFCond()
    if (cond === null) throw new NakoSyntaxError('もし文で条件指定のエラー。', mosi.line)
    let trueBlock = null
    let falseBlock = null
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
    const args = []
    // stack=[1,+,2,*,3]
    while (!this.isEOF()) {
      if (this.checkTypes(valueTypes)) {
        let t = this.yValue()
        args.push(t)
        const op = this.peek()
        if (op && opPriority[op.type]) {
          args.push(this.get())
          continue
        }
        break
      }
      break
    }
    if (args.length === 0) return null
    if (args.length === 1) return args[0]
    return this.infixToAST(args)
  }
  infixToPolish (list) {
    // 中間記法から逆ポーランドに変換
    const priority = (t) => {
      if (opPriority[t.type]) return opPriority[t.type]
      return 10
    }
    const stack = []
    const polish = []
    while (list.length > 0) {
      const t = list.shift()
      while (stack.length > 0) { // 優先順位を見て移動する
        const sTop = stack[stack.length - 1]
        if (priority(t) > priority(sTop)) break
        polish.push(stack.pop())
      }
      stack.push(t)
    }
    // 残った要素を積み替える
    while (stack.length > 0) polish.push(stack.pop())
    return polish
  }
  infixToAST (list) {
    // 逆ポーランドを構文木に
    const josi = list[list.length - 1].josi
    const polish = this.infixToPolish(list)
    const stack = []
    for (const t of polish) {
      if (!opPriority[t.type]) { // 演算子ではない
        stack.push(t)
        continue
      }
      const b = stack.pop()
      const a = stack.pop()
      const op = {
        type: 'op',
        operator: t.type,
        left: a,
        right: b,
        line: a.line,
        josi: josi
      }
      stack.push(op)
    }
    return stack.pop()
  }

  yGetArgParen (func) { // C言語風呼び出しでカッコの中を取得
    let isClose = false
    const si = this.stack.length
    while (!this.isEOF()) {
      if (this.check(')')) {
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
    const a = []
    while (si < this.stack.length) {
      const v = this.popStack()
      a.unshift(v)
    }
    return a
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
      if (this.check2(['func', '('])) { // C言語風
        const t = this.yValue()
        if (t.type === 'func' && (t.josi === '' || keizokuJosi.indexOf(t.josi) >= 0)) {
          t.josi = ''
          return t // 関数なら値とする
        }
      }
      if (this.check('func')) {
        const t = this.get()
        const f = t.meta
        const args = []
        let numCount = 0
        for (const arg of f.josi) {
          const popArg = this.popStack(arg)
          args.push(popArg)
          if (popArg === null) numCount++
        }
        // 1つだけなら、変数「それ」で補完される
        if (numCount >= 2) throw new NakoSyntaxError(`関数『${t.value}』の引数指定エラー`, t.line)
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
      const t = this.yGetArg()
      if (t) {
        this.pushStack(t)
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
    const t = this.yGetArg()
    if (!t) return null
    // 関数の呼び出しがある場合
    if (this.skipFuncInCalc === false && t.josi !== '') {
      this.pushStack(t)
      return this.yCall()
    }
    return t
  }
  yValue () {
    // プリミティブな値
    if (this.checkTypes(['number', 'string'])) {
      return this.get()
    }
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
    // 変数
    const word = this.yValueWord()
    if (word) return word
    // 関数(...)
    if (this.check2(['func', '('])) {
      const f = this.peek()
      if (this.accept(['func', '(', this.yGetArgParen, ')'])) {
        return {
          type: 'func',
          name: this.y[0].value,
          args: this.y[2],
          line: this.y[0].line,
          josi: this.y[3].josi
        }
      } else {
        throw new NakoSyntaxError('C風関数呼び出しのエラー', f.line)
      }
    }
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
