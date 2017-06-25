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
    const b = this.ySentenceList()
    const c = this.get()
    if (c && c.type !== 'eof') {
      throw new NakoSyntaxError('構文エラー:' + this.nodeToStr(c), c.line)
    }
    return b
  }
  ySentenceList () {
    const blocks = []
    let line = -1
    while (!this.isEOF()) {
      if (!this.accept([this.ySentence])) break
      // console.log('ySentenceList=', this.nodeToStr(this.y[0]))
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
    if (this.check('ここから')) this.get()
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
    if (this.accept(['抜ける'])) return {type: 'break', line: this.y[0].line, josi: ''}
    if (this.accept(['続ける'])) return {type: 'continue', line: this.y[0].line, josi: ''}
    if (this.accept([this.yLet])) return this.y[0]
    if (this.accept([this.yIF])) return this.y[0]
    if (this.accept([this.yDefFunc])) return this.y[0]
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

  yDefFunc () {
    if (!this.check('def_func')) return null
    const readArgs = () => { // lexerでも解析しているが再度詳しく
      const a = []
      this.get() // skip '('
      while (!this.isEOF()) {
        if (this.check(')')) {
          this.get()
          break
        }
        a.push(this.get())
      }
      return a
    }
    const def = this.get() // ●
    let defArgs = []
    if (this.check('(')) {
      defArgs = readArgs()
    }
    const funcName = this.get()
    console.log('funcName=', funcName)
    if (funcName.type !== 'func') {
      throw new NakoSyntaxError('関数の宣言でエラー『' + this.nodeToStr(funcName) + '』', funcName.line)
    }
    if (this.check('(')) {
      defArgs = readArgs()
    }
    let block = null
    let multiline = false
    if (this.check('ここから')) multiline = true
    if (this.check('eol')) multiline = true
    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) this.get()
    } else {
      block = this.ySentence()
    }
    return {
      type: 'def_func',
      name: funcName,
      args: defArgs,
      block,
      line: def.line,
      josi: ''
    }
  }

  yIFCond () { // もしの条件の取得
    let a = this.yGetArg()
    if (!a) return null
    // console.log('yIFCond=', a, this.peek())
    // チェック : AがBならば
    if (a.josi === 'が') {
      const tmpI = this.index
      const b = this.yGetArg()
      const naraba = this.get()
      if (b && naraba && naraba.type === 'ならば') {
        return {
          type: 'op',
          operator: (naraba.value === 'でなければ') ? 'noteq' : 'eq',
          left: a,
          right: b,
          line: a.line,
          josi: ''
        }
      }
      this.index = tmpI
    }
    if (a.josi !== '') {
      // もし文で関数呼び出しがある場合
      this.stack.push(a)
      a = this.yCall()
    }
    // (ならば|でなければ)を確認
    if (!this.check('ならば')) {
      throw new NakoSyntaxError('もし文で『ならば』がないか、条件が複雑過ぎます。『' + this.nodeToStr(this.peek()) + '』の直前に『ならば』を書いてください。', a.line)
    }
    const naraba = this.get()
    if (naraba.value === 'でなければ') {
      a = {
        type: 'not',
        value: a,
        line: a.line,
        josi: ''
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
      if (this.check('eol')) this.get() // skip eol
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

  yRepeatTime () {
    if (!this.check('回')) return null
    const kai = this.get()
    let num = this.popStack([])
    let multiline = false
    let block = null
    if (num === null) num = { type: 'word', value: 'それ', josi: '', line: kai.line }
    if (this.check('ここから')) {
      this.get()
      multiline = true
    } else if (this.check('eol')) {
      this.get()
      multiline = true
    }
    if (multiline) { // multiline
      block = this.yBlock()
      if (this.check('ここまで')) this.get()
    } else { // singleline
      block = this.ySentence()
    }
    return {
      type: 'repeat_times',
      value: num,
      block: block,
      line: kai.line,
      josi: ''
    }
  }

  yWhile () {
    if (!this.check('間')) return null
    const aida = this.get()
    const cond = this.popStack([])
    if (cond === null) throw new NakoSyntaxError('『間』で条件がありません。', cond.line)
    if (!this.checkTypes(['ここから', 'eol'])) {
      throw new NakoSyntaxError('『間』の直後は改行が必要です', cond.line)
    }
    const block = this.yBlock()
    if (this.check('ここまで')) this.get()
    return {
      type: 'while',
      cond,
      block,
      josi: '',
      line: aida.line
    }
  }

  yFor () {
    if (!this.check('繰り返す')) return null
    const kurikaesu = this.get()
    const vTo = this.popStack(['まで'])
    const vFrom = this.popStack(['から'])
    const word = this.popStack(['を', 'で'])
    if (vFrom === null || vTo === null) {
      throw new NakoSyntaxError('『繰り返す』文でAからBまでの指定がありません。', kurikaesu.line)
    }
    let multiline = false
    if (this.check('ここから')) {
      multiline = true
      this.get()
    } else if (this.check('eol')) {
      multiline = true
      this.get()
    }
    let block = null
    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) this.get()
    } else {
      block = this.ySentence()
    }
    return {
      type: 'for',
      from: vFrom,
      to: vTo,
      word,
      block,
      line: kurikaesu.line,
      josi: ''
    }
  }

  yReturn () {
    if (!this.check('戻る')) return null
    const modoru = this.get()
    const v = this.popStack(['で', 'を'])
    return {
      type: 'return',
      value: v,
      line: modoru.line,
      josi: ''
    }
  }

  yForEach () {
    if (!this.check('反復')) return null
    const hanpuku = this.get()
    const target = this.popStack(['を'])
    const name = this.popStack(['で'])
    let block = null
    let multiline = false
    if (this.check('ここから')) {
      multiline = true
      this.get()
    } else if (this.check('eol')) {
      multiline = true
    }
    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) this.get()
    } else {
      block = this.ySentence()
    }
    return {
      type: 'foreach',
      name,
      target,
      block,
      line: hanpuku.line,
      josi: ''
    }
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
      // 制御構文
      if (this.check('ここから')) this.get()
      if (this.check('回')) return this.yRepeatTime()
      if (this.check('間')) return this.yWhile()
      if (this.check('繰り返す')) return this.yFor()
      if (this.check('反復')) return this.yForEach()
      // 戻す
      if (this.check('戻る')) return this.yReturn()
      // 関数
      if (this.check2(['func', '('])) { // C言語風
        const t = this.yValue()
        if (t.type === 'func' && (t.josi === '' || keizokuJosi.indexOf(t.josi) >= 0)) {
          t.josi = ''
          return t // 関数なら値とする
        }
        this.pushStack(t)
        continue
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
          funcNode.josi = 'して'
          return funcNode
        }
        // 続き
        this.pushStack(funcNode)
        continue
      }
      // 値のとき → スタックに載せる
      const t = this.yGetArg()
      if (t) {
        this.pushStack(t)
        continue
      }
      break
    } // end of while
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

  yValueKakko () {
    if (!this.check('(')) return null
    const t = this.get() // skip '('
    const v = this.yGetArg()
    if (v === null) {
      const v2 = this.get()
      throw new NakoSyntaxError('(...)の解析エラー。『' + this.nodeToStr(v2) + '』の近く', t.line)
    }
    if (!this.check(')')) {
      throw new NakoSyntaxError('(...)の解析エラー。『' + this.nodeToStr(v) + '』の近く', t.line)
    }
    const closeParent = this.get() // skip ')'
    v.josi = closeParent.josi
    return v
  }

  yValue () {
    // プリミティブな値
    if (this.checkTypes(['number', 'string'])) {
      return this.get()
    }
    // 丸括弧
    if (this.check('(')) return this.yValueKakko()
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
        const fobj = {
          type: 'func',
          name: this.y[0].value,
          args: this.y[2],
          line: this.y[0].line,
          josi: this.y[3].josi
        }
        return fobj
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
      if (word.josi === '' && this.checkTypes(['@', '['])) {
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
