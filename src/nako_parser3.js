/**
 * nadesiko v3 parser (demo version)
 */
const {opPriority, keizokuJosi} = require('./nako_parser_const')
const {NakoParserBase, NakoSyntaxError} = require('./nako_parser_base')
const operatorList = []
for (const key in opPriority) operatorList.push(key)

class NakoParser extends NakoParserBase {
  /**
   * @param tokens 字句解析済みのトークンの配列
   * @return AST(構文木)
   */
  parse (tokens) {
    this.reset()
    this.tokens = tokens
    // 解析開始
    const node = this.startParser()
    return node
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
      const n = this.ySentence()
      if (!n) break
      blocks.push(n)
      if (line < 0) line = n.line
    }
    if (blocks.length === 0) {
      throw new NakoSyntaxError('構文解析に失敗:' + this.nodeToStr(this.peek()), line)
    }
    return {type: 'block', block: blocks, line}
  }

  ySentence () {
    // 最初の語句が決まっている構文
    if (this.check('eol')) return this.get()
    if (this.check('embed_code')) return this.get()
    if (this.check('もし')) return this.yIF()
    if (this.check('エラー監視')) return this.yTryExcept()
    if (this.accept(['抜ける'])) return {type: 'break', line: this.y[0].line, josi: ''}
    if (this.accept(['続ける'])) return {type: 'continue', line: this.y[0].line, josi: ''}
    if (this.accept(['require', 'string', '取込'])) return {type: 'require', value: this.y[1].value, line: this.y[0].line, josi: ''}
    // 先読みして初めて確定する構文
    if (this.accept([this.yLet])) return this.y[0]
    if (this.accept([this.yDefFunc])) return this.y[0]
    if (this.accept([this.yCall])) return this.y[0] // 関数呼び出しの他、各種構文の実装
    return null
  }

  yBlock () {
    const blocks = []
    let line = -1
    if (this.check('ここから')) this.get()
    while (!this.isEOF()) {
      if (this.checkTypes(['違えば', 'ここまで', 'エラー'])) break
      if (!this.accept([this.ySentence])) break
      blocks.push(this.y[0])
      if (line < 0) line = this.y[0].line
    }
    return {type: 'block', block: blocks, line}
  }

  yDefFuncReadArgs () {
    if (!this.check('(')) return null
    const a = []
    this.get() // skip '('
    while (!this.isEOF()) {
      if (this.check(')')) {
        this.get() // skip ''
        break
      }
      a.push(this.get())
      if (this.check('comma')) this.get()
    }
    return a
  }

  yDefFunc () {
    if (!this.check('def_func')) return null
    const def = this.get() // ●
    let defArgs = []
    if (this.check('(')) {
      defArgs = this.yDefFuncReadArgs() // // lexerでも解析しているが再度詳しく
    }
    const funcName = this.get()
    if (funcName.type !== 'func') {
      throw new NakoSyntaxError('関数の宣言でエラー『' + this.nodeToStr(funcName) + '』', funcName.line)
    }
    if (this.check('(')) {
      defArgs = this.yDefFuncReadArgs()
    }
    if (this.check('とは')) this.get()
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
    const defFuncNode = {
      type: 'def_func',
      name: funcName,
      args: defArgs,
      block,
      line: def.line,
      josi: ''
    }
    return defFuncNode
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
    // True Block
    if (this.check('eol')) {
      trueBlock = this.yBlock()
      if (this.check('ここまで')) this.get()
    } else {
      trueBlock = this.ySentence()
    }
    while (this.check('eol')) {
      this.get() // skip EOL
    }
    // Flase Block
    if (this.check('違えば')) {
      this.get() // skip 違えば
      if (this.check('eol')) {
        falseBlock = this.yBlock()
        if (this.check('ここまで')) this.get()
      } else {
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
    // 値を一つ読む
    let value1 = this.yValue()
    if (value1 === null) return null
    // 計算式がある場合を考慮
    const args = [value1]
    while (!this.isEOF()) {
      // 演算子がある？
      const op = this.peek()
      if (op && opPriority[op.type]) {
        args.push(this.get())
        // 演算子後の値を取得
        const v = this.yValue()
        if (v === null) throw new NakoSyntaxError(`計算式で演算子『${op.value}』後に値がありません`, value1.line)
        args.push(v)
        continue
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
    if (list.length === 0) return null
    // 逆ポーランドを構文木に
    const josi = list[list.length - 1].josi
    const line = list[list.length - 1].line
    const polish = this.infixToPolish(list)
    const stack = []
    for (const t of polish) {
      if (!opPriority[t.type]) { // 演算子ではない
        stack.push(t)
        continue
      }
      const b = stack.pop()
      const a = stack.pop()
      if (a === undefined || b === undefined) {
        if (this.debug) {
          console.log('--- 計算式(逆ポーランド) ---')
          console.log(polish)
        }
        throw new NakoSyntaxError('計算式でエラー', line)
      }
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
        if (this.check('comma')) this.get()
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
    if (num === null) num = {type: 'word', value: 'それ', josi: '', line: kai.line}
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

  yMumeiFunc () { // 無名関数の定義
    if (!this.check('def_func')) return null
    const def = this.get()
    let args = []
    // 関数の引数定義は省略できる
    if (this.check('(')) {
      args = this.yDefFuncReadArgs()
    }
    const block = this.yBlock()
    if (this.check('ここまで')) this.get()
    return {
      type: 'func_obj',
      args,
      block,
      meta: def.meta,
      line: def.line,
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
        if (!word || (word.type !== 'word' && word.type !== 'func')) throw new NakoSyntaxError('代入文で代入先の変数が見当たりません。', dainyu.line)
        // 関数の代入的呼び出しか？
        if (word.type === 'func') {
          return {type: 'func', name: word.name, args: [value], setter: true, line: dainyu.line, josi: ''}
        }
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
      // C言語風関数
      if (this.check2([['func', 'word'], '(']) && this.peek().josi === '') { // C言語風
        const t = this.yValue()
        if (t.type === 'func' && (t.josi === '' || keizokuJosi.indexOf(t.josi) >= 0)) {
          t.josi = ''
          return t // 関数なら値とする
        }
        this.pushStack(t)
        if (this.check('comma')) this.get()
        continue
      }
      // なでしこ式関数
      if (this.check('func')) {
        const t = this.get()
        const f = t.meta
        // (関数)には ... 構文 ... https://github.com/kujirahand/nadesiko3/issues/66
        let funcObj = null
        if (t.josi === 'には') {
          funcObj = this.yMumeiFunc()
          if (funcObj === null) throw new NakoSyntaxError('『Fには』構文がありましたが、関数定義が見当たりません。', t.line)
        }
        const args = []
        let nullCount = 0
        for (const arg of f.josi) {
          let popArg = this.popStack(arg)
          if (popArg === null) {
            nullCount++
            popArg = funcObj
          }
          args.push(popArg)
        }
        // 1つだけなら、変数「それ」で補完される
        if (nullCount >= 2) throw new NakoSyntaxError(`関数『${t.value}』の引数が不足しています。`, t.line)
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
      throw new NakoSyntaxError(`${names}を読みましたが使い方が分かりません。プラグインが不足しているか、別の関数で利用してください。`, line)
    }
    return this.popStack([])
  }

  yLet () {
    // 関数への代入的呼び出しの場合
    if (this.check2(['func', 'eq'])) {
      if (this.accept(['func', 'eq', this.yCalc])) {
        return {
          type: 'func',
          name: this.y[0].value,
          args: [this.y[2]],
          setter: true,
          line: this.y[0].line
        }
      } else {
        const word = this.peek()
        const name = word.name
        throw new NakoSyntaxError(`『${name}』への代入文で計算式に書き間違いがあります。`, word.line)
      }
    }
    // 通常の変数
    if (this.check2(['word', 'eq'])) {
      if (this.accept(['word', 'eq', this.yCalc])) {
        return {
          type: 'let',
          name: this.y[0],
          value: this.y[2],
          line: this.y[0].line
        }
      } else {
        const word = this.peek()
        const name = word.value
        throw new NakoSyntaxError(`『${name}』への代入文で計算式に書き間違いがあります。`, word.line)
      }
    }
    if (this.check2(['word', '@'])) {
      // 一次元配列
      if (this.accept(['word', '@', this.yValue, 'eq', this.yCalc])) {
        return {
          type: 'let_array',
          name: this.y[0],
          index: [this.y[2]],
          value: this.y[4],
          line: this.y[0].line
        }
      }
      // 二次元配列
      if (this.accept(['word', '@', this.yValue, '@', this.yValue, 'eq', this.yCalc])) {
        return {
          type: 'let_array',
          name: this.y[0],
          index: [this.y[2], this.y[4]],
          value: this.y[6],
          line: this.y[0].line
        }
      }
      // 三次元配列
      if (this.accept(['word', '@', this.yValue, '@', this.yValue, '@', this.yValue, 'eq', this.yCalc])) {
        return {
          type: 'let_array',
          name: this.y[0],
          index: [this.y[2], this.y[4], this.y[6]],
          value: this.y[8],
          line: this.y[0].line
        }
      }
    }
    if (this.check2(['word', '['])) {
      // 一次元配列
      if (this.accept(['word', '[', this.yCalc, ']', 'eq', this.yCalc])) {
        return {
          type: 'let_array',
          name: this.y[0],
          index: [this.y[2]],
          value: this.y[5],
          line: this.y[0].line
        }
      }
      // 二次元配列
      if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', 'eq', this.yCalc])) {
        return {
          type: 'let_array',
          name: this.y[0],
          index: [this.y[2], this.y[5]],
          value: this.y[8],
          line: this.y[0].line
        }
      }
      // 三次元配列
      if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', '[', this.yCalc, ']', 'eq', this.yCalc])) {
        return {
          type: 'let_array',
          name: this.y[0],
          index: [this.y[2], this.y[5], this.y[8]],
          value: this.y[11],
          line: this.y[0].line
        }
      }
    }
    // ローカル変数定義
    if (this.accept(['word', 'とは'])) {
      const word = this.y[0]
      if (!this.checkTypes(['変数', '定数'])) {
        throw new NakoSyntaxError('ローカル変数『' + word.value + '』の定義エラー', word.line)
      }
      const vtype = this.get() // 変数
      // 初期値がある？
      let value = null
      if (this.check('eq')) {
        this.get()
        value = this.yCalc()
      }
      return {
        type: 'def_local_var',
        name: word,
        vartype: vtype.type,
        value,
        line: word.line
      }
    }
    // ローカル変数定義（その２）
    if (this.accept(['変数', 'word', 'eq', this.yCalc])) {
      return {
        type: 'def_local_var',
        name: this.y[1],
        vartype: '変数',
        value: this.y[3],
        line: this.y[0].line
      }
    }
    if (this.accept(['定数', 'word', 'eq', this.yCalc])) {
      return {
        type: 'def_local_var',
        name: this.y[1],
        vartype: '定数',
        value: this.y[3],
        line: this.y[0].line
      }
    }
    return null
  }

  yCalc () {
    if (this.check('eol')) return null
    // 値を一つ読む
    const t = this.yGetArg()
    if (!t) return null
    // 助詞がある？ つまり、関数呼び出しがある？
    if (t.josi === '') return t // 値だけの場合
    // 関数の呼び出しがあるなら、スタックに載せて関数読み出しを呼ぶ
    this.pushStack(t)
    const t1 = this.yCall()
    // それが連文か確認
    if (t1.josi !== 'して') return t1 // 連文ではない
    // 連文なら右側を読んで左側とくっつける
    const t2 = this.yCalc()
    if (!t2) return t1
    return {
      type: 'renbun',
      left: t1,
      right: t2,
      josi: t2.josi,
      line: t1.line
    }
  }

  yValueKakko () {
    if (!this.check('(')) return null
    const t = this.get() // skip '('
    // const v = this.yGetArg()
    const v = this.yCalc()
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
    if (this.check2(['-', 'number']) || this.check2(['-', 'word']) || this.check2(['-', 'func'])) {
      const m = this.get() // skip '-'
      const v = this.yValue()
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
      const v = this.yValue()
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
    // 一語関数
    const splitType = operatorList.concat(['eol', ')', ']'])
    if (this.check2(['func', splitType])) {
      const f = this.get()
      const fobj = {
        type: 'func',
        name: f.value,
        args: [],
        line: f.line,
        josi: f.josi
      }
      return fobj
    }
    // C風関数呼び出し FUNC(...)
    if (this.check2([['func', 'word'], '(']) && this.peek().josi === '') {
      const f = this.peek()
      if (this.accept([['func', 'word'], '(', this.yGetArgParen, ')'])) {
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
    // 無名関数(関数オブジェクト)
    if (this.check('def_func')) return this.yMumeiFunc()
    // 変数
    const word = this.yValueWord()
    if (word) return word
    // その他
    return null
  }

  yValueWord () {
    if (this.check('word')) {
      const word = this.get()
      if (this.skipRefArray) return word
      if (word.josi === '' && this.checkTypes(['@', '['])) {
        const list = []
        let josi = ''
        while (!this.isEOF()) {
          let idx = null
          if (this.accept(['@', this.yValue])) {
            idx = this.y[1]
            josi = idx.josi
          }
          if (this.accept(['[', this.yCalc, ']'])) {
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
    const firstToken = this.peek()
    while (!this.isEOF()) {
      while (this.check('eol')) this.get()
      if (this.check('}')) break
      if (this.accept(['word', ':', this.yCalc])) {
        this.y[0].type = 'string' // キー名の文字列記号省略の場合
        a.push({
          key: this.y[0],
          value: this.y[2]
        })
      } else if (this.accept(['string', ':', this.yCalc])) {
        a.push({
          key: this.y[0],
          value: this.y[2]
        })
      } else if (this.check('word')) {
        const w = this.get()
        w.type = 'string'
        a.push({
          key: w,
          value: w
        })
      } else if (this.checkTypes(['string', 'number'])) {
        const w = this.get()
        a.push({
          key: w,
          value: w
        })
      } else {
        throw new NakoSyntaxError('辞書オブジェクトの宣言で末尾の『}』がありません。', firstToken.line)
      }
      if (this.check('comma')) this.get()
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
    if (this.check('eol')) this.get()
    const v1 = this.yCalc()
    if (v1 === null) return null
    if (this.check('comma')) this.get()
    const a = [v1]
    while (!this.isEOF()) {
      if (this.check('eol')) this.get()
      if (this.check(']')) break
      const v2 = this.yCalc()
      if (v2 === null) break
      if (this.check('comma')) this.get()
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

  yTryExcept () {
    if (!this.check('エラー監視')) return null
    const kansi = this.get() // skip エラー監視
    const block = this.yBlock()
    if (!this.check2(['エラー', 'ならば'])) {
      throw new NakoSyntaxError(
        'エラー構文で『エラーならば』がありません。' +
        '『エラー監視..エラーならば..ここまで』を対で記述します。',
        kansi.line)
    }
    this.get() // skip エラー
    this.get() // skip ならば
    const errBlock = this.yBlock()
    if (this.check('ここまで')) this.get()
    return {
      type: 'try_except',
      block,
      errBlock,
      line: kansi.line,
      josi: ''
    }
  }
}

module.exports = NakoParser
