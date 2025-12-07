/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * nadesiko v3 parser
 */
import { opPriority, RenbunJosi, operatorList } from './nako_parser_const.mjs'
import { NakoParserBase } from './nako_parser_base.mjs'
import { NakoSyntaxError } from './nako_errors.mjs'
import { NakoLexer } from './nako_lexer.mjs'
import { FuncListItemType, FuncArgs, NewEmptyToken, SourceMap } from './nako_types.mjs'
import { NodeType, Ast, AstEol, AstBlocks, AstOperator, AstConst, AstLet, AstLetArray, AstIf, AstWhile, AstAtohantei, AstFor, AstForeach, AstSwitch, AstRepeatTimes, AstDefFunc, AstCallFunc, AstStrValue, AstDefVar, AstDefVarList } from './nako_ast.mjs'
import { Token, TokenDefFunc, TokenCallFunc } from './nako_token.mjs'

/**
 * 構文解析を行うクラス
 */
export class NakoParser extends NakoParserBase {
  /**
   * 構文解析を実行する
   */
  parse (tokens: Token[], filename: string): Ast {
    this.reset()
    this.tokens = tokens
    this.modName = NakoLexer.filenameToModName(filename)
    this.modList.push(this.modName)

    // 解析処理 - 先頭から解析開始
    const result = this.startParser()

    // 関数毎に非同期処理が必要かどうかを判定する
    this.isModifiedNodes = false
    this._checkAsyncFn(result)
    while (this.isModifiedNodes) {
      this.isModifiedNodes = false
      this._checkAsyncFn(result)
    }

    return result
  }

  /** パーサーの一番最初に呼び出す構文規則 */
  startParser (): Ast {
    const b: Ast = this.ySentenceList()
    const c: Token|null = this.get()
    if (c && c.type !== 'eof') {
      this.logger.debug(`構文解析でエラー。${this.nodeToStr(c, { depth: 1 }, true)}の使い方が間違っています。`, c)
      throw NakoSyntaxError.fromNode(`構文解析でエラー。${this.nodeToStr(c, { depth: 1 }, false)}の使い方が間違っています。`, c)
    }
    return b
  }

  /** 何もしない
   * @returns {Ast}
   */
  yNop (): Ast {
    return {
      type: 'nop',
      josi: '',
      ...this.peekSourceMap(),
      end: this.peekSourceMap()
    }
  }

  /** 複数文を返す */
  ySentenceList (): AstBlocks {
    const blocks = []
    let line = -1
    const map = this.peekSourceMap()
    while (!this.isEOF()) {
      const n: Ast|null = this.ySentence()
      if (!n) { break }
      blocks.push(n)
      if (line < 0) { line = n.line }
    }
    if (blocks.length === 0) {
      const token = this.peek() || this.tokens[0]
      this.logger.debug('構文解析に失敗:' + this.nodeToStr(this.peek(), { depth: 1 }, true), token)
      throw NakoSyntaxError.fromNode('構文解析に失敗:' + this.nodeToStr(this.peek(), { depth: 1 }, false), token)
    }
    return { type: 'block', blocks, josi: '', ...map, end: this.peekSourceMap() }
  }

  /** 余剰スタックのレポートを作る */
  makeStackBalanceReport (): string {
    const words: string[] = []
    this.stack.forEach((t) => {
      let w = this.nodeToStr(t, { depth: 1 }, false)
      if (t.josi) { w += t.josi }
      words.push(w)
    })
    const desc = words.join(',')
    // 最近使った関数の使い方レポートを作る #1093
    let descFunc = ''
    const chA = 'A'.charCodeAt(0)
    for (const f of this.recentlyCalledFunc) {
      descFunc += ' - '
      let no = 0
      const josiA: FuncArgs | undefined = (f).josi
      if (josiA) {
        for (const arg of josiA) {
          const ch = String.fromCharCode(chA + no)
          descFunc += ch
          if (arg.length === 1) { descFunc += arg[0] } else { descFunc += `(${arg.join('|')})` }
          no++
        }
      }
      descFunc += String(f.name) + '\n'
    }
    this.recentlyCalledFunc = []
    return `未解決の単語があります: [${desc}]\n次の命令の可能性があります:\n${descFunc}`
  }

  yEOL (): AstEol | null {
    // 行末のチェック #1009
    const eol = this.get()
    if (!eol) { return null }
    // 余剰スタックの確認
    if (this.stack.length > 0) {
      const report = this.makeStackBalanceReport()
      throw NakoSyntaxError.fromNode(report, eol)
    }
    this.recentlyCalledFunc = []
    return {
      type: 'eol',
      comment: eol.value,
      line: eol.line,
      column: eol.column,
      file: eol.file
    }
  }

  /** @returns {Ast | null} */
  ySentence (): Ast | null {
    const map: SourceMap = this.peekSourceMap()

    // 最初の語句が決まっている構文
    if (this.check('eol')) { return this.yEOL() }
    if (this.check('もし')) { return this.yIF() }
    if (this.check('後判定')) { return this.yAtohantei() }
    if (this.check('エラー監視')) { return this.yTryExcept() }
    if (this.accept(['抜ける'])) { return { type: 'break', josi: '', ...map, end: this.peekSourceMap() } }
    if (this.accept(['続ける'])) { return { type: 'continue', josi: '', ...map, end: this.peekSourceMap() } }
    if (this.check('??')) { return this.yDebugPrint() }
    // 実行モードの指定
    if (this.accept(['DNCLモード'])) { return this.yDNCLMode(1) }
    if (this.accept(['DNCL2モード'])) { return this.yDNCLMode(2) }
    if (this.accept(['not', 'string', 'モード設定'])) { return this.ySetGenMode(this.y[1].value) }
    if (this.accept(['not', 'モジュール公開既定値', 'eq', 'string'])) { return this.yExportDefault(this.y[3].value) }
    if (this.accept(['not', '厳チェック'])) { return this.ySetMode('厳しくチェック') } // (#1698)
    // (memo) 現状「取込」はプリプロセス段階(NakoCompiler.listRequireStatements)で処理される
    // if (this.accept(['require', 'string', '取込'])) { return this.yRequire() }
    // <廃止された構文>
    if (this.check('逐次実行')) { return this.yTikuji() } // 廃止 #1611
    if (this.accept(['not', '非同期モード'])) { return this.yASyncMode() }
    // </廃止された構文>

    if (this.check2(['func', 'eq'])) {
      const word: Token = this.get() || NewEmptyToken()
      throw NakoSyntaxError.fromNode(`関数『${word.value}』に代入できません。`, word)
    }

    // 先読みして初めて確定する構文
    if (this.accept([this.ySpeedMode])) { return this.y[0] }
    if (this.accept([this.yPerformanceMonitor])) { return this.y[0] }
    if (this.accept([this.yLet])) { return this.y[0] }
    if (this.accept([this.yDefTest])) { return this.y[0] }
    if (this.accept([this.yDefFunc])) { return this.y[0] }

    // 関数呼び出しの他、各種構文の実装
    if (this.accept([this.yCall])) {
      const c1 = this.y[0]
      const nextToken = this.peek()
      if (nextToken && nextToken.type === 'ならば') {
        const map = this.peekSourceMap()
        const cond = c1
        this.get() // skip ならば
        // もし文の条件として関数呼び出しがある場合
        return this.yIfThen(cond, map)
      } else if (RenbunJosi.indexOf(c1.josi || '') >= 0) { // 連文をblockとして接続する(もし構文などのため)
        if (this.stack.length >= 1) { // スタックの余剰をチェック
          const report = this.makeStackBalanceReport()
          throw NakoSyntaxError.fromNode(report, c1)
        }
        const c2 = this.ySentence()
        if (c2 !== null) {
          return {
            type: 'block',
            blocks: [c1, c2],
            josi: c2.josi,
            ...map,
            end: this.peekSourceMap()
          } as AstBlocks
        }
      }
      return c1
    }
    return null
  }

  /** [廃止] 非同期モード #11 @returns {Ast} */
  yASyncMode (): Ast {
    this.logger.error('『非同期モード』構文は廃止されました(https://nadesi.com/v3/doc/go.php?1028)。', this.peek())
    const map = this.peekSourceMap()
    return { type: 'eol', ...map, end: this.peekSourceMap() }
  }

  /** set DNCL mode */
  yDNCLMode (ver: number): Ast {
    const map = this.peekSourceMap()
    if (ver === 1) {
      // 配列インデックスは1から
      this.arrayIndexFrom = 1
      // 配列アクセスをJSと逆順で指定する
      this.flagReverseArrayIndex = true
    } else {
      // ver2はPythonに近いとのこと
    }
    // 配列代入時自動で初期化チェックする
    this.flagCheckArrayInit = true
    return { type: 'eol', ...map, end: this.peekSourceMap() }
  }

  /** @returns {Ast} */
  ySetGenMode (mode: string): Ast {
    const map = this.peekSourceMap()
    this.genMode = mode
    return { type: 'eol', ...map, end: this.peekSourceMap() }
  }

  /** @returns {Ast} */
  yExportDefault (mode: string): Ast {
    const map = this.peekSourceMap()
    this.isExportDefault = mode === '公開'
    this.moduleExport.set(this.modName, this.isExportDefault)
    return { type: 'eol', ...map, end: this.peekSourceMap() }
  }

  /** @returns {AstStrValue} */
  ySetMode (mode: string): AstStrValue {
    const map = this.peekSourceMap()
    return { type: 'run_mode', value: mode, ...map, end: this.peekSourceMap() }
  }

  /** @returns {AstBlocks} */
  yBlock (): AstBlocks {
    const map = this.peekSourceMap()
    const blocks = []
    if (this.check('ここから')) { this.get() }
    while (!this.isEOF()) {
      if (this.checkTypes(['違えば', 'ここまで', 'エラー'])) { break }
      if (!this.accept([this.ySentence])) { break }
      blocks.push(this.y[0])
    }
    return { type: 'block', blocks, josi: '', ...map, end: this.peekSourceMap() }
  }

  yDefFuncReadArgs (): Ast[]|null {
    if (!this.check('(')) { return null }
    const a: Ast[] = []
    this.get() // skip '('
    while (!this.isEOF()) {
      if (this.check(')')) {
        this.get() // skip ''
        break
      }
      const t = this.get()
      if (t) { a.push(t as any) } // Token to Ast
      if (this.check('comma')) { this.get() }
    }
    return a
  }

  yDefTest (): Ast|null {
    return this.yDefFuncCommon('def_test')
  }

  yDefFunc (): Ast|null {
    return this.yDefFuncCommon('def_func')
  }

  /** ユーザー関数の定義
   * @returns {AstDefFunc | null}
  */
  yDefFuncCommon (type: NodeType): AstDefFunc | null {
    if (!this.check(type)) { // yDefFuncから呼ばれれば def_func なのかをチェックする
      return null
    }
    const map = this.peekSourceMap()
    // 関数定義トークンを取得(このmetaに先読みした関数の型などが入っている)
    // (ref) NakoLexer.preDefineFunc
    const defToken: Token|null = this.get() // 'def_func' or 'def_test'
    if (!defToken) { return null }
    const def = defToken as TokenDefFunc

    let isExport: boolean = this.isExportDefault
    if (this.check('{')) {
      this.get()
      const funcAttribute: Token|null = this.get()
      if (this.check('}')) { this.get() } else { throw NakoSyntaxError.fromNode('関数の属性の指定が正しくありません。『{』と『}』で囲む必要があります。', def) }
      if (funcAttribute != null) {
        if (funcAttribute.value === '公開') { isExport = true }
        if (funcAttribute.value === '非公開') { isExport = false }
        if (funcAttribute.value === 'エクスポート') { isExport = true }
      }
    }

    let defArgs: Ast[] = []
    if (this.check('(')) { defArgs = this.yDefFuncReadArgs() || [] } // // lexerでも解析しているが再度詳しく

    const funcName: Token|null = this.get()
    if (!funcName || funcName.type !== 'func') {
      this.logger.debug(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, true) + 'の宣言でエラー。', funcName)
      throw NakoSyntaxError.fromNode(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, false) + 'の宣言でエラー。', def)
    }

    if (this.check('(')) {
      // 関数引数の二重定義
      if (defArgs.length > 0) {
        this.logger.debug(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, true) + 'の宣言で、引数定義は名前の前か後に一度だけ可能です。', funcName)
        throw NakoSyntaxError.fromNode(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, false) + 'の宣言で、引数定義は名前の前か後に一度だけ可能です。', funcName)
      }
      defArgs = this.yDefFuncReadArgs() || []
    }

    if (this.check('とは')) { this.get() }
    let block: Ast = this.yNop()
    let multiline = false
    let asyncFn = false
    if (this.check('ここから')) { multiline = true }
    if (this.check('eol')) { multiline = true }
    try {
      this.funcLevel++
      this.usedAsyncFn = false
      // ローカル変数を生成
      const backupLocalvars = this.localvars
      this.localvars = new Map([['それ', { type: 'var', value: '' }]])

      if (multiline) {
        this.saveStack()
        // 関数の引数をローカル変数として登録する
        for (const arg of defArgs) {
          if (!arg) { continue }
          if (!(arg as AstStrValue).value) { continue }
          const fnName: string = (arg as AstStrValue).value
          this.localvars.set(fnName, { 'type': 'var', 'value': '' })
        }
        block = this.yBlock()
        // 「ここまで」のチェック
        if (this.check('ここまで')) {
          this.get() // skip 'ここまで'
        } else {
          // 「ここまで」が見当たらない
          const nextWordO = this.peek()
          let nextWord = JSON.stringify(nextWordO)
          if (nextWordO && nextWordO.type && nextWordO.value) { nextWord = nextWordO.value }
          throw NakoSyntaxError.fromNode(`『ここまで』がありません。関数定義の末尾に必要です。『${nextWord}』の前に『ここまで』を記述してください。`, def)
        }
        this.loadStack()
      } else {
        this.saveStack()
        block = this.ySentence() || this.yNop()
        this.loadStack()
      }
      this.funcLevel--
      asyncFn = this.usedAsyncFn
      this.localvars = backupLocalvars
    } catch (err: any) {
      this.logger.debug(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, true) +
        'の定義で以下のエラーがありました。\n' + String(err.message), def)
      throw NakoSyntaxError.fromNode(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, false) +
        'の定義で以下のエラーがありました。\n' + String(err.message), def)
    }
    const func = this.funclist.get(funcName.value)
    if (func && !func.asyncFn && asyncFn) {
      func.asyncFn = asyncFn
    }
    return {
      type,
      name: funcName.value,
      args: defArgs,
      blocks: [block],
      asyncFn,
      isExport,
      josi: '',
      meta: def.meta,
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** 「もし」文の条件を取得 */
  yIFCond (): Ast {
    const map = this.peekSourceMap()
    let a: Ast | null = this.yGetArg()
    if (!a) {
      throw NakoSyntaxError.fromNode(
        '「もし」文の条件式に間違いがあります。' + this.nodeToStr(this.peek(), { depth: 1 }, false), map)
    }
    // console.log('@@yIFCond=', a)
    // チェック : Aならば
    if (a.josi === 'ならば') { return a }
    if (a.josi === 'でなければ') {
      a = { type: 'not', operator: 'not', blocks: [a], josi: '', ...map, end: this.peekSourceMap() } as AstOperator
      return a
    }
    // チェック : AがBならば --- 「関数B(A)」のとき
    if ((a.josi !== '') && (this.check('func'))) {
      // もし文で関数呼び出しがある場合
      this.stack.push(a)
      a = this.yCall()
    } else
    // チェック : AがBならば --- 「A = B」のとき
      if (a.josi === 'が') {
        const tmpI = this.index
        const b = this.yGetArg()
        if (!b) {
          throw NakoSyntaxError.fromNode(
            'もし文の条件「AがBならば」でBがないか条件が複雑過ぎます。' +
          this.nodeToStr(this.peek(), { depth: 1 }, false), map)
        }
        if (this.check('ならば')) {
          const naraba = this.get() || { 'value': 'ならば' }
          b.josi = naraba.value
        }
        if (b && (b.josi === 'ならば' || b.josi === 'でなければ')) {
          return {
            type: 'op',
            operator: (b.josi === 'でなければ') ? 'noteq' : 'eq',
            blocks: [a, b],
            josi: '',
            ...map,
            end: this.peekSourceMap()
          } as AstOperator
        }
        this.index = tmpI
      }
    // もし文で追加の関数呼び出しがある場合
    if (!this.check('ならば')) {
      this.stack.push(a)
      a = this.yCall()
    }
    // (ならば|でなければ)を確認
    if (!this.check('ならば')) {
      const smap: Ast = a || this.yNop()
      this.logger.debug(
        'もし文で『ならば』がないか、条件が複雑過ぎます。' + this.nodeToStr(this.peek(), { depth: 1 }, false) + 'の直前に『ならば』を書いてください。', smap)
      throw NakoSyntaxError.fromNode(
        'もし文で『ならば』がないか、条件が複雑過ぎます。' + this.nodeToStr(this.peek(), { depth: 1 }, false) + 'の直前に『ならば』を書いてください。', smap)
    }
    const naraba = this.get()
    // 否定形のチェック
    if (naraba && naraba.value === 'でなければ') {
      a = {
        type: 'not',
        operator: 'not',
        blocks: [a],
        josi: '',
        ...map,
        end: this.peekSourceMap()
      } as AstOperator
    }
    if (!a) {
      throw NakoSyntaxError.fromNode(
        '「もし」文の条件式に間違いがあります。' + this.nodeToStr(this.peek(), { depth: 1 }, false), map)
    }
    return a
  }

  /** もし文
   * @returns {AstIf | null} */
  yIF (): AstIf | null {
    const map = this.peekSourceMap()
    // 「もし」があれば「もし」文である
    if (!this.check('もし')) { return null }
    const mosi:Token|null = this.get() // skip もし
    if (mosi == null) { return null }
    while (this.check('comma')) { this.get() } // skip comma
    // 「もし」文の条件を取得
    let expr: Ast | null = null
    try {
      expr = this.yIFCond()
    } catch (err: any) {
      throw NakoSyntaxError.fromNode('『もし』文の条件で次のエラーがあります。\n' + String(err.message), mosi)
    }
    return this.yIfThen(expr, map)
  }

  /** 「もし」文の「もし」以降の判定 ... 「もし」がなくても条件分岐は動くようになっている
   * @returns {AstIf | null}
  */
  yIfThen (expr: Ast, map: SourceMap): AstIf | null {
    // 「もし」文の 真偽のブロックを取得
    let trueBlock: Ast = this.yNop()
    let falseBlock: Ast = this.yNop()
    let tanbun = false

    // True Block
    if (this.check('eol')) {
      trueBlock = this.yBlock()
    } else {
      const block: Ast|null = this.ySentence()
      if (block) { trueBlock = block }
      tanbun = true
    }

    // skip EOL
    while (this.check('eol')) { this.get() }

    // Flase Block
    if (this.check('違えば')) {
      this.get() // skip 違えば
      while (this.check('comma')) { this.get() }
      if (this.check('eol')) {
        falseBlock = this.yBlock()
      } else {
        const block: Ast|null = this.ySentence()
        if (block) { falseBlock = block }
        tanbun = true
      }
    }

    if (tanbun === false) {
      if (this.check('ここまで')) {
        this.get()
      } else {
        throw NakoSyntaxError.fromNode('『もし』文で『ここまで』がありません。', map)
      }
    }
    return {
      type: 'if',
      blocks: [expr, trueBlock, falseBlock],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  ySpeedMode (): AstBlocks | null {
    const map: SourceMap = this.peekSourceMap()
    if (!this.check2(['string', '実行速度優先'])) {
      return null
    }
    const optionNode: Token|null = this.get()
    this.get()
    let val = ''
    if (optionNode && optionNode.value) { val = optionNode.value } else { return null }

    const options: {[key: string]: boolean} = { 行番号無し: false, 暗黙の型変換無し: false, 強制ピュア: false, それ無効: false }
    for (const name of val.split('/')) {
      // 全て有効化
      if (name === '全て') {
        for (const k of Object.keys(options)) {
          options[k] = true
        }
        break
      }

      // 個別に有効化
      if (Object.keys(options).includes(name)) {
        options[name] = true
      } else {
        // 互換性を考えて、警告に留める。
        this.logger.warn(`実行速度優先文のオプション『${name}』は存在しません。`, optionNode)
      }
    }

    let multiline = false
    if (this.check('ここから')) {
      this.get()
      multiline = true
    } else if (this.check('eol')) {
      multiline = true
    }

    let block: Ast = this.yNop()
    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) { this.get() }
    } else {
      block = this.ySentence() || block
    }

    return {
      type: 'speed_mode',
      options,
      blocks: [block],
      josi: '',
      ...map
    }
  }

  yPerformanceMonitor (): AstBlocks | null {
    const map = this.peekSourceMap()
    if (!this.check2(['string', 'パフォーマンスモニタ適用'])) {
      return null
    }
    const optionNode = this.get()
    if (!optionNode) { return null }
    this.get()

    const options: {[key: string]: boolean} = { ユーザ関数: false, システム関数本体: false, システム関数: false }
    for (const name of optionNode.value.split('/')) {
      // 全て有効化
      if (name === '全て') {
        for (const k of Object.keys(options)) {
          options[k] = true
        }
        break
      }

      // 個別に有効化
      if (Object.keys(options).includes(name)) {
        options[name] = true
      } else {
        // 互換性を考えて、警告に留める。
        this.logger.warn(`パフォーマンスモニタ適用文のオプション『${name}』は存在しません。`, optionNode)
      }
    }

    let multiline = false
    if (this.check('ここから')) {
      this.get()
      multiline = true
    } else if (this.check('eol')) {
      multiline = true
    }

    let block: Ast = this.yNop()
    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) { this.get() }
    } else {
      block = this.ySentence() || block
    }

    return {
      type: 'performance_monitor',
      options,
      blocks: [block],
      josi: '',
      ...map
    }
  }

  /** [廃止] #1611 「逐次実行」構文 @returns {Ast | null} */
  yTikuji (): Ast|null {
    if (!this.check('逐次実行')) { return null }
    const tikuji = this.getCur() // skip
    this.logger.error('『逐次実行』構文は廃止されました(https://nadesi.com/v3/doc/go.php?944)。', tikuji)
    return { type: 'eol', ...this.peekSourceMap(), end: this.peekSourceMap() }
  }

  /**
   * 1つ目の値を与え、その後に続く計算式を取得し、優先規則に沿って並び替えして戻す
   * @param {Ast} firstValue
   */
  yGetArgOperator (firstValue: Ast): Ast|null {
    const args:Ast[] = [firstValue]
    while (!this.isEOF()) {
      // 演算子がある？
      let op = this.peek()
      if (op && opPriority[op.type]) {
        op = this.getCur()
        args.push(op as any) // Token to Ast
        // 演算子後の値を取得
        const v = this.yValue()
        if (v === null) {
          throw NakoSyntaxError.fromNode(
            `計算式で演算子『${op.value}』後に値がありません`,
            firstValue)
        }
        args.push(v)
        continue
      }
      break
    }
    if (args.length === 0) { return null }
    if (args.length === 1) { return args[0] }
    return this.infixToAST(args)
  }

  /**
   * 範囲(関数)を返す
   * @param kara
   * @returns {AstCallFunc | null}
   */
  yRange (kara: Ast): AstCallFunc | null {
    // 範囲オブジェクト?
    if (!this.check('…')) { return null }
    const map = this.peekSourceMap()
    this.get() // skip '…'
    const made = this.yValue()
    if (!kara || !made) {
      throw NakoSyntaxError.fromNode('範囲オブジェクトの指定エラー。『A…B』の書式で指定してください。', map)
    }
    const meta = this.funclist.get('範囲')
    if (!meta) { throw new Error('関数『範囲』が見つかりません。plugin_systemをシステムに追加してください。') }
    return {
      type: 'func',
      name: '範囲',
      blocks: [kara, made],
      josi: made.josi,
      meta,
      asyncFn: false,
      ...map,
      end: this.peekSourceMap()
    }
  }

  /**
   * 表示(関数)を返す 「??」のエイリアスで利用 (#1745)
   */
  yDebugPrint (): AstCallFunc | null {
    const map = this.peekSourceMap()
    const t = this.get() // skip '??'
    if (!t || t.value !== '??') {
      throw NakoSyntaxError.fromNode('『??』で指定してください。', map)
    }
    const arg: Ast|null = this.yCalc()
    if (!arg) {
      throw NakoSyntaxError.fromNode('『??(計算式)』で指定してください。', map)
    }
    const meta = this.funclist.get('ハテナ関数実行')
    if (!meta) { throw new Error('関数『ハテナ関数実行』が見つかりません。plugin_systemをシステムに追加してください。') }
    return {
      type: 'func',
      name: 'ハテナ関数実行',
      blocks: [arg],
      josi: '',
      meta,
      asyncFn: false,
      ...map,
      end: this.peekSourceMap()
    }
  }

  yGetArg (): Ast|null {
    // 値を一つ読む
    const value1 = this.yValue()
    if (value1 === null) { return null }
    // 範囲オブジェクト？
    if (this.check('…')) { return this.yRange(value1) }
    // 計算式がある場合を考慮
    return this.yGetArgOperator(value1)
  }

  infixToPolish (list: Ast[]): Ast[] {
    // 中間記法から逆ポーランドに変換
    const priority = (t: Ast) => {
      if (opPriority[t.type]) { return opPriority[t.type] }
      return 10
    }
    const stack: Ast[] = []
    const polish: Ast[] = []
    while (list.length > 0) {
      const t = list.shift()
      if (!t) { break }
      while (stack.length > 0) { // 優先順位を見て移動する
        const sTop = stack[stack.length - 1]
        if (priority(t) > priority(sTop)) { break }
        const tpop = stack.pop()
        if (!tpop) {
          this.logger.error('計算式に間違いがあります。', t)
          break
        }
        polish.push(tpop)
      }
      stack.push(t)
    }
    // 残った要素を積み替える
    while (stack.length > 0) {
      const t = stack.pop()
      if (t) { polish.push(t) }
    }
    return polish
  }

  /** @returns {Ast | null} */
  infixToAST (list: Ast[]): Ast | null {
    if (list.length === 0) { return null }
    // 逆ポーランドを構文木に
    const josi = list[list.length - 1].josi
    const node = list[list.length - 1]
    const polish = this.infixToPolish(list)
    /** @type {Ast[]} */
    const stack = []
    for (const t of polish) {
      if (!opPriority[t.type]) { // 演算子ではない
        stack.push(t)
        continue
      }
      const b:Ast|undefined = stack.pop()
      const a:Ast|undefined = stack.pop()
      if (a === undefined || b === undefined) {
        this.logger.debug('--- 計算式(逆ポーランド) ---\n' + JSON.stringify(polish))
        throw NakoSyntaxError.fromNode('計算式でエラー', node)
      }
      /** @type {AstOperator} */
      const op: AstOperator = {
        type: 'op',
        operator: t.type,
        blocks: [a, b],
        josi,
        startOffset: a.startOffset,
        endOffset: a.endOffset,
        line: a.line,
        column: a.column,
        file: a.file
      }
      stack.push(op)
    }
    const ans = stack.pop()
    if (!ans) { return null }
    return ans
  }

  yGetArgParen (y: Ast[]): Ast[] { // C言語風呼び出しでカッコの中を取得
    let isClose = false
    const si = this.stack.length
    while (!this.isEOF()) {
      if (this.check(')')) {
        isClose = true
        break
      }
      // カッコを用いた関数呼び出しの中で助詞を用いた関数呼び出しを有効にする #2000
      const v = this.yCalc()
      if (v) {
        this.pushStack(v)
        if (this.check('comma')) { this.get() }
        continue
      }
      break
    }
    if (!isClose) {
      throw NakoSyntaxError.fromNode(`C風関数『${(y[0] as AstStrValue).value}』でカッコが閉じていません`, y[0])
    }
    const a: Ast[] = []
    while (si < this.stack.length) {
      const v = this.popStack()
      if (v) { a.unshift(v) }
    }
    return a
  }

  /** @returns {AstRepeatTimes | null} */
  yRepeatTime (): AstRepeatTimes | null {
    const map = this.peekSourceMap()
    if (!this.check('回')) { return null }
    this.get() // skip '回'
    if (this.check('comma')) { this.get() } // skip comma
    if (this.check('繰返')) { this.get() } // skip 'N回、繰り返す' (#924)
    const num = this.popStack([]) || { type: 'word', value: 'それ', josi: '', ...map, end: this.peekSourceMap() } as Ast
    let multiline = false
    let block: Ast = this.yNop()
    if (this.check('comma')) { this.get() }
    if (this.check('ここから')) {
      this.get()
      multiline = true
    } else if (this.check('eol')) {
      multiline = true
    }
    if (multiline) { // multiline
      block = this.yBlock()
      if (this.check('ここまで')) { this.get() } else { throw NakoSyntaxError.fromNode('『ここまで』がありません。『回』...『ここまで』を対応させてください。', map) }
    } else {
      // singleline
      const b = this.ySentence()
      if (b) { block = b }
    }
    return {
      type: 'repeat_times',
      blocks: [num, block],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** @returns {AstWhile | null} */
  yWhile (): AstWhile | null { // 「＊の間」文
    const map = this.peekSourceMap()
    if (!this.check('間')) { return null }
    this.get() // skip '間'
    while (this.check('comma')) { this.get() } // skip ','
    if (this.check('繰返')) { this.get() } // skip '繰り返す' #927
    const expr = this.popStack()
    if (expr === null) {
      throw NakoSyntaxError.fromNode('『間』で条件がありません。', map)
    }
    if (this.check('comma')) { this.get() }
    if (!this.checkTypes(['ここから', 'eol'])) {
      throw NakoSyntaxError.fromNode('『間』の直後は改行が必要です', map)
    }
    const block = this.yBlock()
    if (this.check('ここまで')) {
      this.get()
    } else {
      throw NakoSyntaxError.fromNode('『ここまで』がありません。『間』...『ここまで』を対応させてください。', map)
    }
    return {
      type: 'while',
      blocks: [expr, block],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** @returns {AstAtohantei | null} */
  yAtohantei (): AstAtohantei |null {
    const map = this.peekSourceMap()
    if (this.check('後判定')) { this.get() } // skip 後判定
    if (this.check('繰返')) { this.get() } // skip 繰り返す
    if (this.check('ここから')) { this.get() }
    const block = this.yBlock()
    if (this.check('ここまで')) { this.get() }
    if (this.check('comma')) { this.get() }
    let cond = this.yGetArg() // 条件
    let bUntil = false
    const t = this.peek()
    if (t && t.value === 'なる' && (t.josi === 'まで' || t.josi === 'までの')) {
      this.get() // skip なるまで
      bUntil = true
    }
    if (this.check('間')) { this.get() } // skip 間
    if (bUntil) { // 条件を反転する
      cond = {
        type: 'not',
        operator: 'not',
        blocks: [cond],
        josi: '',
        ...map,
        end: this.peekSourceMap()
      } as AstOperator
    }
    if (!cond) { cond = { type: 'number', value: 1, josi: '', ...map, end: this.peekSourceMap() } as AstConst }
    return {
      type: 'atohantei',
      blocks: [cond, block],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** @returns {AstFor | null} */
  yFor (): AstFor | null {
    const errorForArguments = '『繰り返す』文でAからBまでの指定がありません。'
    let flagDown = true // AからBまでの時、A>=Bを許容するかどうか
    let flagUp = true // AからBまでの時、A<=Bを許容するかどうか
    let loopDirection : null | 'up' | 'down' = null // ループの方向を一方向に限定する
    const map = this.peekSourceMap()
    if (this.check('繰返') || this.check('増繰返') || this.check('減繰返')) {
      // pass
    } else {
      return null
    }
    const kurikaesu: Token = this.getCur() // skip 繰り返す
    // スタックに(増や|減ら)してがある？
    const incdec = this.stack.pop()
    if (incdec) {
      if (incdec.type === 'word' && (incdec.value === '増' || incdec.value === '減')) {
        if (incdec.value === '増') { flagDown = false } else { flagUp = false }
        const w = String(incdec.value) + kurikaesu.type
        if (w === '増繰返') {
          kurikaesu.type = '増繰返'
        } else if (w === '減繰返') {
          kurikaesu.type = '減繰返'
        } else {
          throw Error('[System Error] 増繰り返し | 減繰り返しのエラー。')
        }
      } else {
        // 普通の繰り返しの場合
        this.stack.push(incdec) // 違ったので改めて追加
      }
    }
    let vInc: Ast = this.yNop()
    if (kurikaesu.type === '増繰返' || kurikaesu.type === '減繰返') {
      vInc = this.popStack(['ずつ']) || this.yNop()
      if (kurikaesu.type === '増繰返') { flagDown = false } else { flagUp = false }
      loopDirection = kurikaesu.type === '増繰返' ? 'up' : 'down'
    }
    const vTo = this.popStack(['まで', 'を']) // 範囲オブジェクトの場合もあり
    const vFrom = this.popStack(['から']) || this.yNop()
    const vWord: Ast|null = this.popStack(['を', 'で'])
    let wordStr = ''
    if (vWord !== null) { // 変数
      if (vWord.type !== 'word') {
        throw NakoSyntaxError.fromNode('『(変数名)をAからBまで繰り返す』で指定してください。', vWord)
      }
      wordStr = (vWord as AstStrValue).value
    }
    if (vFrom === null || vTo === null) {
      // 『AからBの範囲を繰り返す』構文のとき (#1704)
      if (vFrom == null && vTo && (vTo.type === 'func' && vTo.name === '範囲')) {
        // ok
      } else {
        throw NakoSyntaxError.fromNode(errorForArguments, kurikaesu)
      }
    }
    if (this.check('comma')) { this.get() } // skip comma
    let multiline = false
    if (this.check('ここから')) {
      multiline = true
      this.get()
    } else if (this.check('eol')) {
      multiline = true
      this.get()
    }
    let block: Ast = this.yNop()
    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) {
        this.get()
      } else {
        throw NakoSyntaxError.fromNode('『ここまで』がありません。『繰り返す』...『ここまで』を対応させてください。', map)
      }
    } else {
      const b = this.ySentence()
      if (b) { block = b }
    }

    if (!block) { block = this.yNop() }

    return {
      type: 'for',
      blocks: [vFrom, vTo, vInc, block],
      flagDown,
      flagUp,
      loopDirection,
      word: wordStr,
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** @returns {AstBlocks | null} */
  yReturn (): AstBlocks | null {
    const map = this.peekSourceMap()
    if (!this.check('戻る')) { return null }
    this.get() // skip '戻る'
    const v = this.popStack(['で', 'を']) || this.yNop()
    if (this.stack.length > 0) {
      throw NakoSyntaxError.fromNode('『戻』文の直前に未解決の引数があります。『(式)を戻す』のように式をカッコで括ってください。', map)
    }
    return {
      type: 'return',
      blocks: [v],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** @returns {AstForeach | null} */
  yForEach (): AstForeach |null {
    const map = this.peekSourceMap()
    if (!this.check('反復')) { return null }
    this.get() // skip '反復'
    while (this.check('comma')) { this.get() } // skip ','
    const target = this.popStack(['を']) || this.yNop()
    // target == null なら「それ」の値が使われる
    const name = this.popStack(['で'])
    let wordStr = ''
    if (name !== null) {
      if (name.type !== 'word') {
        throw NakoSyntaxError.fromNode('『(変数名)で(配列)を反復』で指定してください。', map)
      }
      wordStr = (name as AstStrValue).value
    }
    let block: Ast = this.yNop()
    let multiline = false
    if (this.check('ここから')) {
      multiline = true
      this.get()
    } else if (this.check('eol')) { multiline = true }

    if (multiline) {
      block = this.yBlock()
      if (this.check('ここまで')) {
        this.get()
      } else {
        throw NakoSyntaxError.fromNode('『ここまで』がありません。『反復』...『ここまで』を対応させてください。', map)
      }
    } else {
      const b = this.ySentence()
      if (b) { block = b }
    }

    return {
      type: 'foreach',
      word: wordStr,
      blocks: [target, block],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** 条件分岐構文
   * @returns {AstSwitch | null}
   */
  ySwitch (): AstSwitch | null {
    const map = this.peekSourceMap()
    if (!this.check('条件分岐')) { return null }
    const joukenbunki = this.get() // skip '条件分岐'
    if (!joukenbunki) { return null }
    const eol = this.get() // skip 'eol'
    if (!eol) { return null }
    const expr = this.popStack(['で'])
    if (!expr) {
      throw NakoSyntaxError.fromNode('『(値)で条件分岐』のように記述してください。', joukenbunki)
    }
    if (eol.type !== 'eol') {
      throw NakoSyntaxError.fromNode('『条件分岐』の直後は改行してください。', joukenbunki)
    }
    //
    const blocks: Ast[] = []
    blocks[0] = expr
    blocks[1] = this.yNop() // 後で default のAstを再設定するため
    //
    while (!this.isEOF()) {
      if (this.check('eol')) {
        this.get()
        continue
      }
      // ここまで？
      if (this.check('ここまで')) {
        this.get() // skip ここまで
        break
      }
      // 違えば？
      const condToken: Token|null = this.peek()
      if (condToken && condToken.type === '違えば') {
        this.get() // skip 違えば
        if (this.check('comma')) { this.get() } // skip ','
        const defaultBlock = this.yBlock()
        if (this.check('ここまで')) {
          this.get() // skip ここまで (違えばとペア)
        }
        while (this.check('eol')) { this.get() } // skip eol
        if (this.check('ここまで')) {
          this.get() // skip ここまで (条件分岐：ここまで)
        }
        blocks[1] = defaultBlock
        break
      }
      // 通常の条件
      const cond: Ast | null = this.yValue()
      if (!cond) {
        throw NakoSyntaxError.fromNode('『条件分岐』は『(条件)ならば〜ここまで』と記述してください。', joukenbunki)
      }
      const naraba = this.get() // skip ならば
      if (!naraba || naraba.type !== 'ならば') {
        throw NakoSyntaxError.fromNode('『条件分岐』で条件は＊＊ならばと記述してください。', joukenbunki)
      }
      if (this.check('comma')) { this.get() } // skip ','
      // 条件にあったときに実行すること
      const condBlock = this.yBlock()
      const kokomade = this.peek()
      if (kokomade && kokomade.type === 'ここまで') {
        this.get() // skip ここまで
      }
      blocks.push(cond)
      blocks.push(condBlock)
    }

    const ast: AstSwitch = {
      type: 'switch',
      blocks,
      case_count: blocks.length / 2 - 1,
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
    return ast
  }

  /** 無名関数
   * @returns {AstDefFunc|null}
  */
  yMumeiFunc (): AstDefFunc | null { // 無名関数の定義
    const map = this.peekSourceMap()
    if (!this.check('def_func')) { return null }
    const defToken = this.get()
    if (!defToken) { return null }
    const def = defToken as TokenDefFunc
    let args: Ast[] = []
    // 「,」を飛ばす
    if (this.check('comma')) { this.get() }
    // 関数の引数定義は省略できる
    if (this.check('(')) { args = this.yDefFuncReadArgs() || [] }
    // 「,」を飛ばす
    if (this.check('comma')) { this.get() }
    // ブロックを読む
    this.funcLevel++
    this.saveStack()
    const backupAsyncFn = this.usedAsyncFn
    this.usedAsyncFn = false
    const block = this.yBlock()
    const isAsyncFn = this.usedAsyncFn
    // 末尾の「ここまで」をチェック - もしなければエラーにする #1045
    if (!this.check('ここまで')) {
      throw NakoSyntaxError.fromNode('『ここまで』がありません。『には』構文か無名関数の末尾に『ここまで』が必要です。', map)
    }
    this.get() // skip ここまで
    this.loadStack()
    this.usedAsyncFn = backupAsyncFn
    this.funcLevel--
    return {
      type: 'func_obj',
      name: '',
      args,
      blocks: [block],
      meta: def.meta,
      josi: '',
      isExport: false, // 無名関数は外部公開しない
      asyncFn: isAsyncFn, // asyncFnかどうか
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** 代入構文 */
  yDainyu (): AstBlocks | null {
    const map = this.peekSourceMap()
    const dainyu = this.get() // 代入
    if (dainyu === null) { return null }
    const value = this.popStack(['を']) || { type: 'word', value: 'それ', josi: 'を', ...map } as AstStrValue
    const word: Ast|null = this.popStack(['へ', 'に'])
    if (!word || (word.type !== 'word' && word.type !== 'func' && word.type !== 'ref_array')) {
      throw NakoSyntaxError.fromNode('代入文で代入先の変数が見当たりません。『(変数名)に(値)を代入』のように使います。', dainyu)
    }
    if (word.type === 'func') {
      throw NakoSyntaxError.fromNode('関数『' + String(word.name) + '』に代入できません。『(変数名)に(値)を代入』のように使います。', dainyu)
    }
    // 配列への代入
    if (word.type === 'ref_array') {
      const indexArray = word.index || []
      const blocks = [value, ...indexArray]
      return {
        type: 'let_array',
        name: (word.name as AstStrValue).value,
        indexes: word.index,
        blocks,
        josi: '',
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    // 一般的な変数への代入
    const word2 = this.getVarName(word)
    return {
      type: 'let',
      name: (word2 as AstStrValue).value,
      blocks: [value],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    } as AstLet
  }

  /** 定める構文 */
  ySadameru (): AstBlocks | null {
    const map = this.peekSourceMap()
    const sadameru = this.get() // 定める
    if (sadameru === null) { return null }
    // 引数(定数名)を取得
    const word = this.popStack(['を']) || { type: 'word', value: 'それ', josi: 'を', ...map, end: this.peekSourceMap() } as AstStrValue
    if (!word || (word.type !== 'word' && word.type !== 'func' && word.type !== 'ref_array')) {
      throw NakoSyntaxError.fromNode('『定める』文で定数が見当たりません。『(定数名)を(値)に定める』のように使います。', sadameru)
    }
    // 引数(値)を取得
    const value = this.popStack(['へ', 'に', 'と']) || this.yNop()
    // 公開設定
    let isExport: boolean = this.isExportDefault
    if (this.check2(['{', 'word', '}'])) {
      this.get()
      const attrNode = this.get()
      if (attrNode === null) {
        throw NakoSyntaxError.fromNode('定める『' + (word as AstStrValue).value + '』の定義エラー', word)
      }
      const attr = attrNode.value
      if (attr === '公開') { isExport = true } else if (attr === '非公開') { isExport = false } else if (attr === 'エクスポート') { isExport = true } else { this.logger.warn(`不明な変数属性『${attr}』が指定されています。`) }
      this.get()
    }
    // 変数を生成する
    const nameToken = this.createVar(word as AstStrValue, true, isExport)
    return {
      type: 'def_local_var',
      name: (nameToken as AstStrValue).value,
      vartype: '定数',
      isExport,
      blocks: [value],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    } as AstDefVar
  }

  yIncDec (): AstBlocks | null {
    const map = this.peekSourceMap()
    const action = this.get() // (増やす|減らす)
    if (action === null) { return null }

    // 『Nずつ増やして繰り返す』文か？
    if (this.check('繰返')) {
      this.pushStack({ type: 'word', value: action.value, josi: action.josi, ...map, end: this.peekSourceMap() })
      return this.yFor()
    }

    // スタックから引数をポップ
    const word = this.popStack(['を'])
    if (!word || (word.type !== 'word' && word.type !== 'ref_array')) {
      throw NakoSyntaxError.fromNode(
        `『${action.type}』文で定数が見当たりません。『(変数名)を(値)だけ${action.type}』のように使います。`,
        action)
    }
    let value = this.popStack(['だけ', ''])
    if (!value) {
      value = { type: 'number', value: 1, josi: 'だけ', ...map, end: this.peekSourceMap() } as AstConst
    }

    // 減らすなら-1かける
    if (action.value === '減') {
      const minusOne = { type: 'number', value: -1, line: action.line } as AstConst
      value = { type: 'op', operator: '*', blocks: [value, minusOne], josi: '', ...map } as AstOperator
    }

    return {
      type: 'inc',
      name: word,
      blocks: [value],
      josi: action.josi,
      ...map,
      end: this.peekSourceMap()
    }
  }

  yCall (): Ast | null {
    if (this.isEOF()) { return null }

    // スタックに積んでいく
    while (!this.isEOF()) {
      if (this.check('ここから')) { this.get() }
      // 代入
      if (this.check('代入')) { return this.yDainyu() }
      if (this.check('定める')) { return this.ySadameru() }
      // 制御構文
      if (this.check('回')) { return this.yRepeatTime() }
      if (this.check('間')) { return this.yWhile() }
      if (this.check('繰返') || this.check('増繰返') || this.check('減繰返')) { return this.yFor() }
      if (this.check('反復')) { return this.yForEach() }
      if (this.check('条件分岐')) { return this.ySwitch() }
      if (this.check('戻る')) { return this.yReturn() }
      if (this.check('増') || this.check('減')) { return this.yIncDec() }
      // C言語風関数
      if (this.check2([['func', 'word'], '('])) { // C言語風
        const cur = this.peek()
        if (cur && cur.josi === '') {
          const t: Ast|null = this.yValue() // yValueにてC言語風呼び出しをパース
          if (t) {
            const josi = t.josi || ''
            if (t.type === 'func' && (t.josi === '' || RenbunJosi.indexOf(josi) >= 0)) {
              t.josi = ''
              return t // 関数なら値とする
            }
            this.pushStack(t)
          }
          if (this.check('comma')) { this.get() }
          continue
        }
      }
      // なでしこ式関数
      if (this.check('func')) {
        const r = this.yCallFunc()
        if (r === null) { continue }
        // 「〜する間」の形ならスタックに積む。
        if (this.check('間')) {
          this.pushStack(r)
          continue
        }
        // 関数呼び出しの直後に、四則演算があるか?
        if (!this.checkTypes(operatorList)) {
          return r // 関数呼び出しの後に演算子がないのでそのまま関数呼び出しを戻す
        }
        // 四則演算があった場合、計算してスタックに載せる
        const s = this.yGetArgOperator(r)
        this.pushStack(s)
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
      if (this.isReadingCalc) {
        return this.popStack()
      }
      this.logger.debug('--- stack dump ---\n' + JSON.stringify(this.stack, null, 2) + '\npeek: ' + JSON.stringify(this.peek(), null, 2))
      let msgDebug = `不完全な文です。${this.stack.map((n) => this.nodeToStr(n, { depth: 0 }, true)).join('、')}が解決していません。`
      let msg = `不完全な文です。${this.stack.map((n) => this.nodeToStr(n, { depth: 0 }, false)).join('、')}が解決していません。`

      // 各ノードについて、更に詳細な情報があるなら表示
      for (const n of this.stack) {
        const d0 = this.nodeToStr(n, { depth: 0 }, false)
        const d1 = this.nodeToStr(n, { depth: 1 }, false)
        if (d0 !== d1) {
          msgDebug += `${this.nodeToStr(n, { depth: 0 }, true)}は${this.nodeToStr(n, { depth: 1 }, true)}として使われています。`
          msg += `${d0}は${d1}として使われています。`
        }
      }

      const first = this.stack[0]
      const last = this.stack[this.stack.length - 1]
      this.logger.debug(msgDebug, first)
      throw NakoSyntaxError.fromNode(msg, first, last)
    }
    return this.popStack([])
  }

  /** @returns {Ast | null} */
  yCallFunc (): Ast | null {
    const map = this.peekSourceMap()
    const callToken = this.get()
    if (!callToken) { return null }
    const t = callToken as TokenCallFunc
    const f = t.meta
    const funcName: string = t.value
    // (関数)には ... 構文 ... https://github.com/kujirahand/nadesiko3/issues/66
    let funcObj = null
    if (t.josi === 'には') {
      try {
        funcObj = this.yMumeiFunc()
      } catch (err: any) {
        throw NakoSyntaxError.fromNode(`『${t.value}には...』で無名関数の定義で以下の間違いがあります。\n${err.message}`, t)
      }
      if (funcObj === null) { throw NakoSyntaxError.fromNode('『Fには』構文がありましたが、関数定義が見当たりません。', t) }
    }
    if (!f || typeof f.josi === 'undefined') { throw NakoSyntaxError.fromNode('関数の定義でエラー。', t) }

    // 最近使った関数を記録
    this.recentlyCalledFunc.push({ name: funcName, ...f })

    // 呼び出す関数が非同期呼び出しが必要(asyncFn)ならマーク
    if (f && f.asyncFn) { this.usedAsyncFn = true }

    // 関数の引数を取り出す処理
    const args: any[] = []
    let nullCount = 0
    let valueCount = 0
    for (let i = f.josi.length - 1; i >= 0; i--) {
      for (;;) {
        // スタックから任意の助詞を持つ値を一つ取り出す、助詞がなければ末尾から得る
        let popArg = this.popStack(f.josi[i])
        if (popArg !== null) {
          valueCount++
        } else if (i < f.josi.length - 1 || !f.isVariableJosi) {
          nullCount++
          popArg = funcObj
        } else {
          break
        }
        // 参照渡しの場合、引数が関数の参照渡しに該当する場合、typeを『func_pointer』に変更
        if (popArg !== null && f.funcPointers !== undefined && f.funcPointers[i] !== null) {
          if (popArg.type === 'func') { // 引数が関数の参照渡しに該当する場合
            popArg.type = 'func_pointer'
          } else {
            const varname = (f.varnames) ? f.varnames[i] : `${i + 1}番目の引数`
            throw NakoSyntaxError.fromNode(
              `関数『${t.value}』の引数『${varname}』には関数オブジェクトが必要です。`, t)
          }
        }
        // 引数がnullであれば、自動的に『変数「それ」』で補完する
        if (popArg === null) {
          popArg = { type: 'word', value: 'それ', josi: '', ...map, end: map } as AstStrValue
        }
        args.unshift(popArg) // 先頭に追加
        if (i < f.josi.length - 1 || !f.isVariableJosi) { break }
      }
    }
    // 引数が不足しているとき(つまり、引数にnullがあるとき)、自動的に『変数「それ」』で補完される。
    // ただし、nullが1つだけなら、変数「それ」で補完されるが、2つ以上あるときは、エラーにする
    if (nullCount >= 2 && (valueCount > 0 || t.josi === '' || RenbunJosi.indexOf(t.josi) >= 0)) {
      throw NakoSyntaxError.fromNode(`関数『${t.value}』の引数が不足しています。`, t)
    }
    this.usedFuncs.add(t.value)
    // 関数呼び出しのAstを構築
    const funcNode: AstCallFunc = {
      type: 'func',
      name: t.value,
      blocks: args,
      meta: f,
      josi: t.josi,
      asyncFn: !!f.asyncFn,
      ...map,
      end: this.peekSourceMap()
    }

    // 「プラグイン名設定」ならば、そこでスコープを変更することを意味する (#1112)
    if (funcNode.name === 'プラグイン名設定') {
      if (args.length > 0 && args[0]) {
        let fname = String(args[0].value)
        if (fname === 'メイン') { fname = String(args[0].file) }
        this.namespaceStack.push(this.modName)
        this.isExportStack.push(this.isExportDefault)
        this.modName = NakoLexer.filenameToModName(fname)
        this.modList.push(this.modName)
      }
    } else if (funcNode.name === '名前空間ポップ') { // (#1409)
      const space = this.namespaceStack.pop()
      if (space) { this.modName = space }
      const isexport = this.isExportStack.pop()
      if (isexport != null) { this.isExportDefault = isexport }
    }

    // 言い切りならそこで一度切る
    if (t.josi === '') { return funcNode }

    // 「**して、**」の場合も一度切る
    if (RenbunJosi.indexOf(t.josi) >= 0) {
      funcNode.josi = 'して'
      return funcNode
    }
    // 続き
    funcNode.meta = f
    this.pushStack(funcNode)
    return null
  }

  /** @returns {Ast | null} */
  yLet (): AstBlocks | null {
    const map = this.peekSourceMap()
    // 通常の変数
    if (this.check2(['word', 'eq'])) {
      const word = this.peek()
      let threw = false
      try {
        if (this.accept(['word', 'eq', this.yCalc]) || this.accept(['word', 'eq', this.ySentence])) {
          if (this.y[2].type === 'eol') {
            throw new Error('値が空です。')
          }
          if (this.check('comma')) { this.get() } // skip comma (ex) name1=val1, name2=val2
          const nameToken = this.getVarName(this.y[0])
          const valueToken = this.y[2]
          return {
            type: 'let',
            name: (nameToken as AstStrValue).value,
            blocks: [valueToken],
            josi: '',
            ...map,
            end: this.peekSourceMap()
          } as AstLet
        } else {
          threw = true
          this.logger.debug(`${this.nodeToStr(word, { depth: 1 }, true)}への代入文で計算式に書き間違いがあります。`, word)
          throw NakoSyntaxError.fromNode(`${this.nodeToStr(word, { depth: 1 }, false)}への代入文で計算式に書き間違いがあります。`, map)
        }
      } catch (err: any) {
        if (threw) {
          throw err
        }
        this.logger.debug(`${this.nodeToStr(word, { depth: 1 }, true)}への代入文で計算式に以下の書き間違いがあります。\n${err.message}`, word)
        throw NakoSyntaxError.fromNode(`${this.nodeToStr(word, { depth: 1 }, false)}への代入文で計算式に以下の書き間違いがあります。\n${err.message}`, map)
      }
    }

    // オブジェクトプロパティ構文：代入文：：ここから (#1793)
    if (this.check2(['word', '$', '*', '$', '*', '$', '*', '$', '*', 'eq']) || this.check2(['word', '$', '*', '$', '*', '$', '*', 'eq']) || this.check2(['word', '$', '*', '$', '*', 'eq']) || this.check2(['word', '$', '*', 'eq'])) {
      const propList = []
      const word = this.getVarName(this.get() as Token)
      for (;;) {
        const flag = this.peek()
        if (flag === null || flag.type !== '$') { break }
        this.get() // skip $
        propList.push(this.get() as Ast) // property
      }
      this.get() // skip eq
      const valueToken = this.yCalc() // calc
      if (valueToken === null) {
        throw NakoSyntaxError.fromNode(`${this.nodeToStr(word, { depth: 1 }, false)}への代入文の計算式に書き間違いがあります。`, map)
      }
      return {
        type: 'let_prop',
        name: (word as AstStrValue).value,
        index: propList,
        blocks: [valueToken],
        josi: '',
        ...map,
        end: this.peekSourceMap()
      } as AstLet
    }
    // オブジェクトプロパティ構文：代入文：：ここまで

    // let_array ?
    if (this.check2(['word', '@'])) {
      const la = this.yLetArrayAt(map)
      if (this.check('comma')) { this.get() } // skip comma (ex) name1=val1, name2=val2
      if (la) {
        la.checkInit = this.flagCheckArrayInit
        return la
      }
    }
    if (this.check2(['word', '['])) {
      const lb = this.yLetArrayBracket(map) as AstLetArray
      if (this.check('comma')) { this.get() } // skip comma (ex) name1=val1, name2=val2
      if (lb) {
        lb.checkInit = this.flagCheckArrayInit
        return lb
      }
    }

    // ローカル変数定義
    if (this.accept(['word', 'とは'])) {
      const wordToken = this.y[0]
      if (!this.checkTypes(['変数', '定数'])) {
        throw NakoSyntaxError.fromNode('ローカル変数『' + String(wordToken.value) + '』の定義エラー', wordToken)
      }
      const vtype = this.getCur() // 変数 or 定数
      let isExport : boolean = this.isExportDefault
      if (this.check2(['{', 'word', '}'])) {
        this.get()
        const attrNode = this.get()
        if (attrNode === null) {
          throw NakoSyntaxError.fromNode('ローカル変数『' + String(wordToken.value) + '』の定義エラー', wordToken)
        }
        const attr = attrNode.value
        if (attr === '公開') { isExport = true } else if (attr === '非公開') { isExport = false } else if (attr === 'エクスポート') { isExport = true } else { this.logger.warn(`不明な変数属性『${attr}』が指定されています。`) }
        this.get()
      }
      const word = this.createVar(wordToken, vtype.type === '定数', isExport)
      // 初期値がある？
      let value = this.yNop()
      if (this.check('eq')) {
        this.get() // skip '='
        value = this.yCalc() || value
      }
      if (this.check('comma')) { this.get() } // skip comma (ex) name1=val1, name2=val2
      return {
        type: 'def_local_var',
        name: (word as AstStrValue).value,
        vartype: vtype.type,
        isExport,
        blocks: [value],
        ...map,
        end: this.peekSourceMap()
      } as AstDefVar
    }
    // ローカル変数定義（その２）
    if (this.accept(['変数', 'word'])) {
      const wordVar = this.y[1]
      this.index -= 2 // 「変数 word」の前に巻き戻す
      // 変数の宣言および初期化1
      if (this.accept(['変数', 'word', 'eq', this.yCalc])) {
        const word = this.createVar(this.y[1], false, this.isExportDefault)
        const astValue = this.y[3] || this.yNop()
        return {
          type: 'def_local_var',
          name: (word as AstStrValue).value,
          vartype: '変数',
          blocks: [astValue],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVar
      }

      // 変数の宣言および初期化2
      if (this.accept(['変数', 'word', '{', 'word', '}', 'eq', this.yCalc])) {
        let isExport: boolean = this.isExportDefault
        const attr = this.y[3].value
        if (attr === '公開') { isExport = true } else if (attr === '非公開') { isExport = false } else if (attr === 'エクスポート') { isExport = true } else { this.logger.warn(`不明な変数属性『${attr}』が指定されています。`) }
        const word = this.createVar(this.y[1], false, isExport)
        const astValue = this.y[6] || this.yNop()
        return {
          type: 'def_local_var',
          name: (word as AstStrValue).value,
          vartype: '変数',
          isExport,
          blocks: [astValue],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVar
      }

      // 変数宣言のみの場合
      {
        this.index += 2 // 変数 word を読んだとする
        const word = this.createVar(wordVar, false, this.isExportDefault)
        return {
          type: 'def_local_var',
          name: (word as AstStrValue).value,
          vartype: '変数',
          blocks: [this.yNop()],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVar
      }
    }

    if (this.accept(['定数', 'word', 'eq'])) {
      const constName = this.y[1]
      const word = this.createVar(constName, true, this.isExportDefault)
      const astValue = this.yCalc() || this.yNop()
      return {
        type: 'def_local_var',
        name: (word as AstStrValue).value,
        vartype: '定数',
        blocks: [astValue],
        ...map,
        end: this.peekSourceMap()
      } as AstDefVar
    }

    if (this.accept(['定数', 'word', '{', 'word', '}', 'eq'])) {
      let isExport : boolean = this.isExportDefault
      const attr = this.y[3].value
      if (attr === '公開') { isExport = true } else if (attr === '非公開') { isExport = false } else if (attr === 'エクスポート') { isExport = true } else { this.logger.warn(`不明な定数属性『${attr}』が指定されています。`) }
      const word = this.createVar(this.y[1], true, isExport)
      const astValue = this.yCalc() || this.yNop()
      return {
        type: 'def_local_var',
        name: (word as AstStrValue).value,
        vartype: '定数',
        isExport,
        blocks: [astValue],
        ...map,
        end: this.peekSourceMap()
      } as AstDefVar
    }

    // 複数定数への代入 #563
    if (this.accept(['定数', this.yJSONArray, 'eq'])) {
      const names = this.y[1]
      // check array
      if (names && names.blocks instanceof Array) {
        for (const i in names.blocks) {
          if (names.blocks[i].type !== 'word') {
            throw NakoSyntaxError.fromNode(`複数定数の代入文${Number(i) + 1}番目でエラー。『定数[A,B,C]=[1,2,3]』の書式で記述してください。`, this.y[0])
          }
        }
      } else {
        throw NakoSyntaxError.fromNode('複数定数の代入文でエラー。『定数[A,B,C]=[1,2,3]』の書式で記述してください。', this.y[0])
      }
      const namesAst = this._tokensToNodes(this.createVarList(names.blocks, true, this.isExportDefault))
      const astValue = this.yCalc() || this.yNop()
      return {
        type: 'def_local_varlist',
        names: namesAst,
        vartype: '定数',
        blocks: [astValue],
        ...map,
        end: this.peekSourceMap()
      } as AstDefVarList
    }
    // 複数変数への代入 #563
    if (this.accept(['変数', this.yJSONArray, 'eq'])) {
      const names: AstBlocks = this.y[1]
      // check array
      if (names && names.blocks instanceof Array) {
        names.blocks.forEach((block, index) => {
          if (block.type !== 'word') {
            throw NakoSyntaxError.fromNode(`複数変数の代入文${String(index + 1)}番目でエラー『変数[A,B,C]=[1,2,3]』の書式で記述してください。`, this.y[0])
          }
        })
      } else {
        throw NakoSyntaxError.fromNode('複数変数の代入文でエラー。『変数[A,B,C]=[1,2,3]』の書式で記述してください。', this.y[0])
      }
      const namesAst = this._tokensToNodes(this.createVarList(names.blocks as Token[], false, this.isExportDefault))
      const astValue = this.yCalc() || this.yNop()
      return {
        type: 'def_local_varlist',
        names: namesAst,
        vartype: '変数',
        blocks: [astValue],
        ...map,
        end: this.peekSourceMap()
      } as AstDefVarList
    }

    // 複数変数への代入 #563
    if (this.check2(['word', 'comma', 'word'])) {
      // 2 word
      if (this.accept(['word', 'comma', 'word', 'eq'])) {
        let names = [this.y[0], this.y[2]]
        names = this.createVarList(names, false, this.isExportDefault)
        const astValue = this.yCalc() || this.yNop()
        return {
          type: 'def_local_varlist',
          names,
          vartype: '変数',
          blocks: [astValue],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVarList
      }
      // 3 word
      if (this.accept(['word', 'comma', 'word', 'comma', 'word', 'eq'])) {
        let names = [this.y[0], this.y[2], this.y[4]]
        names = this.createVarList(names, false, this.isExportDefault)
        const astValue = this.yCalc() || this.yNop()
        return {
          type: 'def_local_varlist',
          names,
          vartype: '変数',
          blocks: [astValue],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVarList
      }
      // 4 word
      if (this.accept(['word', 'comma', 'word', 'comma', 'word', 'comma', 'word', 'eq'])) {
        let names = [this.y[0], this.y[2], this.y[4], this.y[6]]
        names = this.createVarList(names, false, this.isExportDefault)
        const astValue = this.yCalc() || this.yNop()
        return {
          type: 'def_local_varlist',
          names,
          vartype: '変数',
          blocks: [astValue],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVarList
      }
      // 5 word
      if (this.accept(['word', 'comma', 'word', 'comma', 'word', 'comma', 'word', 'comma', 'word', 'eq'])) {
        let names = [this.y[0], this.y[2], this.y[4], this.y[6], this.y[8]]
        names = this.createVarList(names, false, this.isExportDefault)
        const astValue = this.yCalc() || this.yNop()
        return {
          type: 'def_local_varlist',
          names,
          vartype: '変数',
          blocks: [astValue],
          ...map,
          end: this.peekSourceMap()
        } as AstDefVarList
      }
    }
    return null
  }

  /**
   * 配列のインデックスが1から始まる場合を考慮するか
   * @param {Ast} node
   * @returns
   */
  checkArrayIndex (node: Ast): Ast {
    // 配列が0から始まるのであればそのまま返す
    if (this.arrayIndexFrom === 0) { return node }
    // 配列が1から始まるのであれば演算を加えて返す
    const minusNum = {
      ...node,
      'type': 'number',
      'value': this.arrayIndexFrom
    }
    return {
      ...node,
      type: 'op',
      operator: '-',
      blocks: [node, minusNum]
    } as AstOperator
  }

  /**
   * 配列のインデックスを逆順にするのを考慮するか
   * @param {Ast[]| null} ary
   */
  checkArrayReverse (ary: Ast[] | null): Ast[] {
    if (!ary) { return [] }
    if (!this.flagReverseArrayIndex) { return ary }
    // 二次元以上の配列変数のアクセスを[y][x]ではなく[x][y]と順序を変更する
    if (ary.length <= 1) { return ary }
    return ary.reverse()
  }

  /** @returns {AstLetArray | null} */
  yLetArrayAt (map: SourceMap): AstLetArray | null {
    // 一次元配列
    if (this.accept(['word', '@', this.yValue, 'eq', this.yCalc])) {
      const astValue = this.y[4]
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, this.checkArrayIndex(this.y[2])],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }

    // 二次元配列
    if (this.accept(['word', '@', this.yValue, '@', this.yValue, 'eq', this.yCalc])) {
      const astValue = this.y[6]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }

    // 三次元配列
    if (this.accept(['word', '@', this.yValue, '@', this.yValue, '@', this.yValue, 'eq', this.yCalc])) {
      const astValue = this.y[8]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }

    // 二次元配列(カンマ指定)
    if (this.accept(['word', '@', this.yValue, 'comma', this.yValue, 'eq', this.yCalc])) {
      const astValue = this.y[6]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }

    // 三次元配列(カンマ指定)
    if (this.accept(['word', '@', this.yValue, 'comma', this.yValue, 'comma', this.yValue, 'eq', this.yCalc])) {
      const astValue = this.y[8]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    return null
  }

  /** @returns {Ast | null} */
  yLetArrayBracket (map: SourceMap): AstBlocks|null {
    // 一次元配列
    if (this.accept(['word', '[', this.yCalc, ']', 'eq', this.yCalc])) {
      const astValue = this.y[5]
      const astIndexes = [this.checkArrayIndex(this.y[2])]
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    // 二次元配列 --- word[a][b] = c
    if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', 'eq', this.yCalc])) {
      const astValue = this.y[8]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[5])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        tag: '2',
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    // 二次元配列 --- word[a, b] = c
    if (this.accept(['word', '[', this.yCalc, 'comma', this.yCalc, ']', 'eq', this.yCalc])) {
      const astValue = this.y[7]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        tag: '2',
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    // 三次元配列 --- word[a][b][c] = d
    if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', '[', this.yCalc, ']', 'eq', this.yCalc])) {
      const astValue = this.y[11]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[5]), this.checkArrayIndex(this.y[8])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    // 三次元配列 --- word[a, b, c] = d
    if (this.accept(['word', '[', this.yCalc, 'comma', this.yCalc, 'comma', this.yCalc, ']', 'eq', this.yCalc])) {
      const astValue = this.y[9]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])])
      return {
        type: 'let_array',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])]),
        blocks: [astValue, ...astIndexes],
        checkInit: this.flagCheckArrayInit,
        ...map,
        end: this.peekSourceMap()
      } as AstLetArray
    }
    // --- --- --- --- --- --- --- --- --- --- --- --- ---
    // 配列 + オブジェクトプロパティ構文 (#2139)
    // --- --- --- --- --- --- --- --- --- --- --- --- ---
    // 一次元配列 + オブジェクトプロパティ構文 --- word[a]$b = c
    if (this.accept(['word', '[', this.yCalc, ']', '$', 'word', 'eq', this.yCalc])) {
      const astValue = this.y[7]
      const astIndexes = [this.checkArrayIndex(this.y[2])]
      const astProp = this.y[5]
      astProp.type = 'string'
      return {
        type: 'let_prop',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        index: [astProp],
        ...map,
        end: this.peekSourceMap()
      } as AstLet
    }
    // 一次元配列 + 二次元オブジェクトプロパティ構文 --- word[a]$b$c = d
    if (this.accept(['word', '[', this.yCalc, ']', '$', 'word', '$', 'word', 'eq', this.yCalc])) {
      const astVarName = this.y[0]
      const astIndex = this.y[2]
      const astProp1 = this.y[5]
      const astProp2 = this.y[7]
      const astValue = this.y[9]
      astProp1.type = 'string'
      astProp2.type = 'string'
      return {
        type: 'let_prop',
        name: (this.getVarName(astVarName) as AstStrValue).value,
        blocks: [astValue, astIndex],
        index: [astProp1, astProp2],
        ...map,
        end: this.peekSourceMap()
      } as AstLet
    }
    // 二次元配列 + オブジェクトプロパティ構文 --- word[a][b]$c = d
    if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', '$', 'word', 'eq', this.yCalc])) {
      const astValue = this.y[10]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[5])])
      const astProp = this.y[8]
      astProp.type = 'string'
      return {
        type: 'let_prop',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        index: [astProp],
        ...map,
        end: this.peekSourceMap()
      } as AstLet
    }
    // 二次元配列 + オブジェクトプロパティ構文 --- word[a, b]$c = d
    if (this.accept(['word', '[', this.yCalc, ',', this.yCalc, ']', '$', 'word', 'eq', this.yCalc])) {
      const astValue = this.y[9]
      const astIndexes = this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])])
      const astProp = this.y[7]
      astProp.type = 'string'
      return {
        type: 'let_prop',
        name: (this.getVarName(this.y[0]) as AstStrValue).value,
        blocks: [astValue, ...astIndexes],
        index: [astProp],
        ...map,
        end: this.peekSourceMap()
      } as AstLet
    }
    // 二次元配列 + 二次元オブジェクトプロパティ構文 --- word[a][b]$c$d = e
    if (this.accept([
        'word', '[', this.yCalc, ']', '[', this.yCalc, ']', // 0...6
        '$', 'word', '$', 'word', 'eq', this.yCalc          // 7...12
      ])) {
      const astVarName = this.y[0]
      const astIndex1 = this.y[2]
      const astIndex2 = this.y[5]
      const astProp1 = this.y[8]
      const astProp2 = this.y[10]
      const astValue = this.y[12]
      astProp1.type = 'string'
      astProp2.type = 'string'
      return {
        type: 'let_prop',
        name: (this.getVarName(astVarName) as AstStrValue).value,
        blocks: [astValue, astIndex1, astIndex2],
        index: [astProp1, astProp2],
        ...map,
        end: this.peekSourceMap()
      } as AstLet
    }

    return null
  }

  /** @returns {Ast | null} */
  yCalc (): Ast|null {
    const map = this.peekSourceMap()
    if (this.check('eol')) { return null }
    // 値を一つ読む
    const t = this.yGetArg()
    if (!t) { return null }
    // 助詞がある？ つまり、関数呼び出しがある？
    if (t.josi === '') { return t } // 値だけの場合
    // 関数の呼び出しがあるなら、スタックに載せて関数読み出しを呼ぶ
    const tmpReadingCalc = this.isReadingCalc
    this.isReadingCalc = true
    this.pushStack(t)
    const t1 = this.yCall()
    this.isReadingCalc = tmpReadingCalc
    if (!t1) {
      // 関数がなければ、先ほど積んだ値をスタックから取り出して返す
      return this.popStack()
    }
    // 計算式をfCalcとする
    let fCalc:Ast = t1
    // それが連文か助詞を読んで確認
    if (RenbunJosi.indexOf(t1.josi || '') >= 0) {
      // 連文なら右側を読んで左側とくっつける
      const t2 = this.yCalc()
      if (t2) {
        fCalc = {
          type: 'renbun',
          operator: 'renbun',
          blocks: [t1, t2],
          josi: t2.josi,
          ...map,
          end: this.peekSourceMap()
        } as AstOperator
      }
    }
    // 演算子があれば続ける
    const op = this.peek()
    if (!op) { return fCalc }
    if (opPriority[op.type]) {
      return this.yGetArgOperator(fCalc)
    }
    return fCalc
  }

  /** @returns {Ast | null} */
  yValueKakko (): Ast | null {
    if (!this.check('(')) { return null }
    const t = this.get() // skip '('
    if (!t) { throw new Error('[System Error] check したのに get できない') }
    this.saveStack()
    const v: Ast | null = this.yCalc() || this.ySentence()
    if (v === null) {
      const v2 = this.get()
      this.logger.debug('(...)の解析エラー。' + this.nodeToStr(v2, { depth: 1 }, true) + 'の近く', t)
      throw NakoSyntaxError.fromNode('(...)の解析エラー。' + this.nodeToStr(v2, { depth: 1 }, false) + 'の近く', t)
    }
    if (!this.check(')')) {
      this.logger.debug('(...)の解析エラー。' + this.nodeToStr(v, { depth: 1 }, true) + 'の近く', t)
      throw NakoSyntaxError.fromNode('(...)の解析エラー。' + this.nodeToStr(v, { depth: 1 }, false) + 'の近く', t)
    }

    const closeParent = this.get() // skip ')'
    this.loadStack()
    if (closeParent) {
      v.josi = closeParent.josi
    }

    // (...)の後の配列アクセスに対応 #1985
    return this.yRefArrayValue(v)
  }

  yConst (tok: Token, map: SourceMap): Ast {
    // ['number', 'bigint', 'string']
    const astConst: AstConst = {
      type: tok.type as NodeType,
      value: tok.value,
      josi: tok.josi,
      ...map
    }
    return astConst
  }

  /** @returns {Ast | null} */
  yValue (): Ast | null {
    const map = this.peekSourceMap()

    // カンマなら飛ばす #877
    if (this.check('comma')) { this.get() }

    // プリミティブな値
    if (this.checkTypes(['number', 'bigint', 'string'])) {
      return this.yConst(this.getCur(), map)
    }

    // 丸括弧
    if (this.check('(')) { return this.yValueKakko() }

    // マイナス記号
    if (this.check2(['-', 'number']) || this.check2(['-', 'word']) || this.check2(['-', 'func'])) {
      const m = this.get() // skip '-'
      const v = this.yValue()
      const josi = (v && v.josi) ? v.josi : ''
      const line = (m && m.line) ? m.line : 0
      const astLeft = { type: 'number', value: -1, line } as AstConst
      const astRight = v || this.yNop()
      return {
        type: 'op',
        operator: '*',
        blocks: [astLeft, astRight],
        josi,
        ...map,
        end: this.peekSourceMap()
      } as AstOperator
    }
    // NOT
    if (this.check('not')) {
      this.get() // skip '!'
      const v = this.yValue()
      const josi = (v && v.josi) ? v.josi : ''
      return {
        type: 'not',
        operator: 'not',
        blocks: [v],
        josi,
        ...map,
        end: this.peekSourceMap()
      } as AstOperator
    }
    // JSON object
    const a = this.yJSONArray()
    if (a) { return a }
    const o = this.yJSONObject()
    if (o) { return o }
    // 一語関数
    if (this.check('func')) {
      const oneWordFuncToken = this.peek()
      if (!oneWordFuncToken) { throw new Error('[System Error] 正しく値が取れませんでした。') }
      const splitType = operatorList.concat(['eol', ')', ']', 'ならば', '回', '間', '反復', '条件分岐'])
      if (this.check2(['func', splitType]) || (oneWordFuncToken?.josi && oneWordFuncToken.josi !== '')) {
        this.get() // skip oneWordFuncToken
        const tt = oneWordFuncToken as TokenCallFunc
        const f = this.getVarNameRef(tt)
        this.usedFuncs.add(f.value)
        // 引数の個数をチェック
        const meta = tt.meta
        const args: any = []
        if (!meta) { throw NakoSyntaxError.fromNode(`一語関数『${f.value}』は存在しません。`, tt) }
        if (meta.josi && meta.josi.length === 1) {
          args.push({ type: 'word', value: 'それ' })
        } else if (meta.josi && meta.josi.length >= 2) {
          throw NakoSyntaxError.fromNode(`関数『${f.value}』で引数が指定されていません。${meta.josi.length}個の引数を指定してください。`, tt)
        }
        return {
          type: 'func',
          name: f.value,
          blocks: args,
          josi: f.josi,
          meta,
          asyncFn: !!meta.asyncFn,
          ...map,
          end: this.peekSourceMap()
        } as AstCallFunc
      }
    }
    // C風関数呼び出し FUNC(...)
    if (this.check2([['func', 'word'], '(']) && this.peekDef().josi === '') {
      const funcNameToken = this.peek()
      if (this.accept([['func', 'word'], '(', this.yGetArgParen, ')'])) {
        const funcToken = this.getVarNameRef(this.y[0])
        const meta = (funcToken as TokenCallFunc).meta // undefinedかもしれない
        const args = this.y[2]
        const funcName: string = funcToken.value
        let asyncFn = false
        this.usedFuncs.add(funcName)
        // 引数の個数をチェック
        if (meta && meta.josi) {
          // 引数の個数が異なる場合
          if (meta.josi.length === args.length) {
            // ok
          } else if (meta.isVariableJosi) {
            // ok
          } else { // 引数の個数が違う
            throw NakoSyntaxError.fromNode(`関数『${funcToken.value}』で引数${args.length}個が指定されましたが、${meta.josi.length}個の引数を指定してください。`, funcToken)
          }
          asyncFn = !!meta.asyncFn
        }
        return {
          type: 'func',
          name: funcName,
          blocks: args,
          josi: this.y[3].josi,
          meta,
          asyncFn,
          ...map,
          end: this.peekSourceMap()
        } as AstCallFunc
      }
      throw NakoSyntaxError.fromNode('C風関数呼び出しのエラー', funcNameToken || NewEmptyToken())
    }
    // 無名関数(関数オブジェクト)
    if (this.check('def_func')) { return this.yMumeiFunc() }
    // 変数
    const word = this.yValueWord()
    if (word) { return word }
    // 関数への参照
    const funcPtr = this.yValueFuncPointer()
    if (funcPtr) { return funcPtr }
    // その他
    return null
  }

  yValueWordGetIndex (ast: Ast): boolean {
    if (!ast.index) { ast.index = [] }
    // word @ a, b, c
    if (this.check('@')) {
      if (this.accept(['@', this.yValue, 'comma', this.yValue, 'comma', this.yValue])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        ast.index.push(this.checkArrayIndex(this.y[3]))
        ast.index.push(this.checkArrayIndex(this.y[5]))
        ast.index = this.checkArrayReverse(ast.index)
        ast.josi = this.y[5].josi
        return true
      }
      if (this.accept(['@', this.yValue, 'comma', this.yValue])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        ast.index.push(this.checkArrayIndex(this.y[3]))
        ast.index = this.checkArrayReverse(ast.index)
        ast.josi = this.y[3].josi
        return true
      }
      if (this.accept(['@', this.yValue])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        ast.josi = this.y[1].josi
        return true
      }
      throw NakoSyntaxError.fromNode('変数の後ろの『@要素』の指定が不正です。', ast)
    }
    if (this.check('[')) {
      // 1次元配列変数 + 3次元プロパティ
      if (this.accept(['[', this.yCalc, ']', '$', 'word', '$', 'word', '$', 'word'])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        const prop1 = this.y[4]
        const prop2 = this.y[6]
        const prop3 = this.y[8]
        prop1.type = 'string'
        prop2.type = 'string'
        prop3.type = 'string'
        ast.index.push(prop1)
        ast.index.push(prop2)
        ast.index.push(prop3)
        ast.josi = prop3.josi
        return ast.josi === '' // 助詞があればそこで終了(false)を返す (#1627)
      }
      // 1次元配列変数 + 2次元プロパティ
      if (this.accept(['[', this.yCalc, ']', '$', 'word', '$', 'word'])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        const prop1 = this.y[4]
        const prop2 = this.y[6]
        prop1.type = 'string'
        prop2.type = 'string'
        ast.index.push(prop1)
        ast.index.push(prop2)
        ast.josi = prop2.josi
        return ast.josi === '' // 助詞があればそこで終了(false)を返す (#1627)
      }
      // 1次元配列変数 + 1次元プロパティ
      if (this.accept(['[', this.yCalc, ']', '$', 'word'])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        const prop = this.y[4]
        prop.type = 'string'
        ast.index.push(prop)
        ast.josi = this.y[4].josi
        return this.y[4].josi === '' // 助詞があればそこで終了(false)を返す (#1627)
      }
      if (this.accept(['[', this.yCalc, ']'])) {
        ast.index.push(this.checkArrayIndex(this.y[1]))
        ast.josi = this.y[2].josi
        return this.y[2].josi === '' // 助詞があればそこで終了(false)を返す (#1627)
      }
      if (this.accept(['[', this.yCalc, 'comma', this.yCalc, ']'])) {
        const index = [
          this.checkArrayIndex(this.y[1]),
          this.checkArrayIndex(this.y[3])
        ]
        const aa = ast.index.pop()
        ast.index = this.checkArrayReverse(index)
        if (aa) { ast.index.unshift(aa) }
        ast.josi = this.y[4].josi
        return this.y[4].josi === '' // 助詞があればそこで終了(false)を返す
      }
    }
    if (this.check('[')) {
      if (this.accept(['[', this.yCalc, 'comma', this.yCalc, 'comma', this.yCalc, ']'])) {
        const index = [
          this.checkArrayIndex(this.y[1]),
          this.checkArrayIndex(this.y[3]),
          this.checkArrayIndex(this.y[5])
        ]
        const aa = ast.index.pop()
        ast.index = this.checkArrayReverse(index)
        if (aa) { ast.index.unshift(aa) }
        ast.josi = this.y[6].josi
        return this.y[6].josi === '' // 助詞があればそこで終了(false)を返す
      }
    }
    return false
  }

  yValueWordGetProp (ast: Ast): boolean {
    if (!ast.index) { ast.index = [] }
    
    if (this.accept(['$', 'word', '$', 'word'])) {
      const prop1 = this.y[1]
      const prop2 = this.y[3]
      prop1.type = 'string'
      prop2.type = 'string'
      ast.index.push(prop1)
      ast.index.push(prop2)
      ast.josi = this.y[3].josi
      return ast.josi === '' // 助詞があればそこで終了(false)を返す
    }
    
    if (this.check('$')) {
      if (this.accept(['$', 'word'])) {
        this.y[1].type = 'string'
        ast.index.push(this.y[1])
        ast.josi = this.y[1].josi
        return this.y[1].josi === '' // 助詞があればそこで終了(false)を返す
      }
    }

    if (this.accept(['$', this.yValue])) {
      ast.index.push(this.y[1])
      ast.josi = this.y[1].josi
      return this.y[1].josi === '' // 助詞があればそこで終了(false)を返す
    }

    return false
  }

  /** @returns {Ast | null} */
  yValueFuncPointer (): Ast|null {
    const map = this.peekSourceMap()
    if (this.check('func_pointer')) {
      const t = this.getCur()
      const ast:Ast = {
        type: 'func_pointer',
        name: t.value,
        josi: t.josi,
        ...map,
        end: this.peekSourceMap()
      }
      return ast
    }
    return null
  }

  /** @returns {Ast | null} */
  yValueWord (): Ast|null {
    const map = this.peekSourceMap()
    if (this.check('word')) {
      const t = this.getCur()
      const word = this.getVarNameRef(t)

      // word[n] || word@n
      if (word.josi === '' && this.checkTypes(['[', '@'])) {
        const ast: Ast = {
          type: 'ref_array', // 配列参照
          name: word,
          index: [],
          josi: '',
          ...map,
          end: this.peekSourceMap()
        }
        while (!this.isEOF()) {
          if (!this.yValueWordGetIndex(ast)) { break }
        }
        if (ast.index && ast.index.length === 0) { throw NakoSyntaxError.fromNode(`配列『${word.value}』アクセスで指定ミス`, word) }
        return ast
      }

      // オブジェクトプロパティ構文(参照) word$prop (#1793)
      if (word.josi === '' && (this.check2(['$', 'word']) || this.check2(['$', 'string']))) {
        const propList: Ast[] = []
        let josi = ''
        while (this.check('$')) {
          this.get() // skip '$'
          const prop = this.get() as Token
          propList.push(prop as Ast)
          josi = prop.josi
        }
        return {
          type: 'ref_prop', // プロパティ参照
          name: word,
          index: propList,
          josi,
          ...map,
          end: this.peekSourceMap()
        }
      }
      return word as any // Token to Ast
    }
    return null
  }

  /** 変数を生成 */
  createVar (word: Token|Ast, isConst: boolean, isExport: boolean): Token|Ast {
    let gname: string = (word as AstStrValue).value
    const typeName: FuncListItemType = isConst ? 'const' : 'var'
    if (this.funcLevel === 0) {
      // global ?
      if (gname.indexOf('__') < 0) { gname = this.modName + '__' + gname }
      const defValue = { type: typeName, value: '', isExport }
      this.funclist.set(gname, defValue)
      const wordAst = word as AstStrValue
      wordAst.value = gname
      return word
    } else {
      // local
      this.localvars.set(gname, { type: typeName, value: '' })
      return word
    }
  }

  /** 変数名を検索して解決する
   * @param {Ast|Token} word
   * @return {Ast|Token}
   */
  getVarName (word: Token|Ast): Token|Ast {
    // check word name
    const f = this.findVar((word as AstStrValue).value)
    if (f) {
      if (f && f.scope === 'global') { (word as AstStrValue).value = f.name }
      return word
    }
    // 変数が見つからない
    this.createVar(word, false, this.isExportDefault)
    return word
  }

  /** 変数名を検索して解決する */
  getVarNameRef (word: Token): Token {
    // check word name
    const f = this.findVar(word.value)
    if (!f) { // 変数が見つからない
      if (this.funcLevel === 0 && word.value.indexOf('__') < 0) {
        word.value = this.modName + '__' + String(word.value)
      }
    } else if (f && f.scope === 'global') {
      word.value = f.name
    }
    return word
  }

  /** 複数の変数名を検索して解決する */
  createVarList (words: Token[], isConst: boolean, isExport: boolean): Token[] {
    for (let i = 0; i < words.length; i++) {
      words[i] = this.createVar(words[i], isConst, isExport) as Token
    }
    return words
  }

  yJSONObjectValue (): Ast[] {
    // 戻り値の形式
    // Astblocks.blocks = [key1, value1, key2, value2, key3, value3 ...]
    const a: Ast[] = []
    const firstToken = this.peek()
    if (!firstToken) { return [] }
    while (!this.isEOF()) {
      while (this.check('eol')) { this.get() }
      if (this.check('}')) { break }

      // key : value
      if (this.accept(['word', ':', this.yCalc])) {
        this.y[0].type = 'string' // キー名の文字列記号省略の場合
        a.push(this.y[0])
        a.push(this.y[2])
      } else if (this.accept(['string', ':', this.yCalc])) { // 'key' : value
        a.push(this.y[0])
        a.push(this.y[2])
      } else if (this.accept(['word'])) { // key
        const key = this.y[0]
        const val = JSON.parse(JSON.stringify(key)) as Ast
        key.type = 'string' // キー名の文字列記号省略の場合
        a.push(key)
        a.push(val)
      } else if (this.checkTypes(['string', 'number'])) { // str or num
        const w = this.getCur() as Ast // Tokenを強制的にAstに変換している
        a.push(w)
        a.push(w)
      } else { throw NakoSyntaxError.fromNode('辞書オブジェクトの宣言で末尾の『}』がありません。', firstToken) }
      if (this.check('comma')) { this.get() }
    }
    return a
  }

  // 辞書型変数の取得
  yJSONObject (): AstBlocks | Ast | null {
    const a: Ast | AstBlocks | null = this.yJSONObjectRaw()
    if (!a) { return null }
    return this.yRefArrayValue(a)
  }

  yJSONObjectRaw (): AstBlocks | null {
    const map = this.peekSourceMap()
    if (this.accept(['{', '}'])) {
      return {
        type: 'json_obj',
        blocks: [],
        josi: this.y[1].josi,
        ...map,
        end: this.peekSourceMap()
      }
    }

    if (this.accept(['{', this.yJSONObjectValue, '}'])) {
      return {
        type: 'json_obj',
        blocks: this.y[1],
        josi: this.y[2].josi,
        ...map,
        end: this.peekSourceMap()
      }
    }

    // 辞書初期化に終わりがなかった場合 (エラーチェックのため) #958
    if (this.accept(['{', this.yJSONObjectValue])) {
      throw NakoSyntaxError.fromNode(
        '辞書型変数の初期化が『}』で閉じられていません。',
        this.y[1])
    }

    return null
  }

  yJSONArrayValue (): Ast[] {
    if (this.check('eol')) { this.get() }
    // Arrayの最初の値
    const v1 = this.yCalc()
    if (v1 === null) { return [] }
    if (this.check('comma')) { this.get() }
    const a: Ast[] = [v1]
    // 2つ目以降の値を取得
    while (!this.isEOF()) {
      if (this.check('eol')) { this.get() }
      if (this.check(']')) { break }
      const v2 = this.yCalc()
      if (v2 === null) { break }
      if (this.check('comma')) { this.get() }
      a.push(v2)
    }
    return a
  }

  // 配列や(値)の直後にある配列アクセスやプロパティアクセスを調べる
  yRefArrayValue (value: Ast): Ast | AstBlocks | null {
    let val: Ast = value
    for (;;) {
      // 配列の直後に@や[]があるか？
      // ただし、助詞がある場合には、別の引数の可能性があるので無視。 (例) [0,1,2]を[3,4,5]に配列＊＊＊
      if (val.josi === '' && this.checkTypes(['@', '['])) {
        const ast: Ast = {
          type: 'ref_array_value',
          name: '@',
          index: [val],
          josi: '',
          line: val.line,
          end: this.peekSourceMap()
        }
        while (!this.isEOF()) {
          if (!this.yValueWordGetIndex(ast)) { break }
        }
        val = ast
        continue
      }
      // 配列の直の後に$(プロパティ)があるか？
      if (this.check('$')) {
        const ast: Ast = {
          type: 'ref_array_value',
          name: '$',
          index: [val],
          josi: '',
          line: val.line,
          end: this.peekSourceMap()
        }
        while (!this.isEOF()) {
          if (!this.yValueWordGetProp(ast)) { break }
        }
        val = ast
        continue
      }
      break
    }
    return val
  }

  yJSONArray (): AstBlocks | Ast | null {
    // 配列を得る
    const a: Ast | null = this.yJSONArrayRaw()
    if (!a) { return null }
    return this.yRefArrayValue(a)
  }

  /** @returns {AstBlocks | null} */
  yJSONArrayRaw (): AstBlocks | null {
    const map = this.peekSourceMap()
    if (this.accept(['[', ']'])) {
      return {
        type: 'json_array',
        blocks: [],
        josi: this.y[1].josi,
        ...map,
        end: this.peekSourceMap()
      }
    }

    if (this.accept(['[', this.yJSONArrayValue, ']'])) {
      return {
        type: 'json_array',
        blocks: this.y[1],
        josi: this.y[2].josi,
        ...map,
        end: this.peekSourceMap()
      }
    }

    // 配列に終わりがなかった場合 (エラーチェックのため) #958
    if (this.accept(['[', this.yJSONArrayValue])) {
      throw NakoSyntaxError.fromNode(
        '配列変数の初期化が『]』で閉じられていません。',
        this.y[1])
    }

    return null
  }

  /** エラー監視構文 */
  yTryExcept (): AstBlocks | null {
    const map = this.peekSourceMap()
    if (!this.check('エラー監視')) { return null }
    const kansi = this.getCur() // skip エラー監視
    const block = this.yBlock()
    if (!this.check2(['エラー', 'ならば'])) {
      throw NakoSyntaxError.fromNode(
        'エラー構文で『エラーならば』がありません。' +
        '『エラー監視..エラーならば..ここまで』を対で記述します。',
        kansi)
    }

    this.get() // skip エラー
    this.get() // skip ならば
    const errBlock = this.yBlock()
    if (this.check('ここまで')) {
      this.get()
    } else {
      throw NakoSyntaxError.fromNode('『ここまで』がありません。『エラー監視』...『エラーならば』...『ここまで』を対応させてください。', map)
    }
    return {
      type: 'try_except',
      blocks: [block, errBlock],
      josi: '',
      ...map,
      end: this.peekSourceMap()
    }
  }

  /** 関数ごとにasyncFnが必要か確認する */
  _checkAsyncFn (node: Ast): boolean {
    if (!node) { return false }
    // 関数定義があれば関数
    if (node.type === 'def_func' || node.type === 'def_test' || node.type === 'func_obj') {
      // 関数定義でasyncFnが指定されているならtrueを返す
      const def: AstDefFunc = node as AstDefFunc
      if (def.asyncFn) { return true } // 既にasyncFnが指定されている
      // 関数定義の中身を調べてasyncFnであるならtrueに変更する
      let isAsyncFn = false
      for (const n of def.blocks) {
        if (this._checkAsyncFn(n)) {
          isAsyncFn = true
          def.asyncFn = isAsyncFn
          def.meta.asyncFn = isAsyncFn
          this.isModifiedNodes = true
          return true
        }
      }
    }
    // 関数呼び出しを調べて非同期処理が必要ならtrueを返す
    if (node.type === 'func') {
      // 関数呼び出し自体が非同期処理ならtrueを返す
      const callNode: AstCallFunc = node as AstCallFunc
      if (callNode.asyncFn) {
        return true
      }
      // 続けて、以下の関数呼び出しの引数などに非同期処理があるかどうか調べる
      // 関数の引数は、node.blocksに格納されている
      if (callNode.blocks) {
        for (const n of callNode.blocks) {
          if (this._checkAsyncFn(n)) {
            callNode.asyncFn = true
            this.isModifiedNodes = true
            return true
          }
        }
      }
      // さらに、関数のリンクを調べる
      const func = this.funclist.get(callNode.name)
      if (func && func.asyncFn) {
        callNode.asyncFn = true
        this.isModifiedNodes = true
        return true
      }
      return false
    }
    // 連文 ... 現在、効率は悪いが非同期で実行することになっている
    if (node.type === 'renbun') {
      return true
    }
    // その他
    if ((node as AstBlocks).blocks) {
      for (const n of (node as AstBlocks).blocks) {
        if (this._checkAsyncFn(n)) {
          return true
        }
      }
    }
    return false
  }

  /** TokenをそのままNodeに変換するメソッド(ただし簡単なものだけ対応)
   * @returns {Ast[]}
   */
  _tokensToNodes (tokens: Token[]): Ast[] {
    const nodes: Ast[] = []
    for (const token of tokens) {
      nodes.push(this._tokenToNode(token))
    }
    return nodes
  }

  /** TokenをそのままNodeに変換するメソッド(ただし簡単なものだけ対応)
   * @returns {Ast}
   */
  _tokenToNode (token: Token): Ast {
    const map = this.peekSourceMap(token)
    if (token.type === 'string' || token.type === 'number' || token.type === 'bigint') {
      return this.yConst(token, map)
    }
    if (token.type === 'word') {
      return {
        type: 'word',
        value: token.value,
        josi: token.josi,
        ...map
      } as AstStrValue
    }
    if (token.type === 'eol' || token.type === '_eol') {
      return {
        type: 'eol',
        ...map
      }
    }
    throw new Error('[System Error] 未知のトークンがAstに変換されました。')
  }
}
