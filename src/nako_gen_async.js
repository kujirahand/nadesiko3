/**
 * file: nako_gen_async.js
 * パーサーが生成した中間オブジェクトを実際のJavaScriptのコードに変換する。
 * なお、扱いやすさ優先で、なでしこの一文を一つの関数として生成し、非同期実行する。
 */

 'use strict'
 
const { NakoSyntaxError, NakoError, NakoRuntimeError } = require('./nako_errors')
const nakoVersion = require('./nako_version')
const NakoGen = require('./nako_gen')

/**
 * @typedef {import("./nako3").Ast} Ast
 */


/**
 * なでしこのインタプリタコード
 */
const
  NakoCodeNop = 'NOP',
  NakoCodeLabel = 'LABLEL',
  NakoCodeJump = 'JUMP',
  NakoCodeJumpIfTrue = 'JUMP_IF_TRUE',
  NakoCodeJumpIfFalse = 'JUMP_IF_FALSE',
  NakoCodeReturn = 'RET',
  NakoCodeCode = 'CODE'
/**
 * なでしこのインタプリタが用いる簡易コードを表現するクラス
 */
class NakoCode {
  /**
   * @param {string} type 
   * @param {string} value
   */
  constructor (type, value) {
    /** Codeのタイプ
     * @type {string}
     */
    this.type = type
     /** Codeの値 / ラベルならラベル名
     * @type {string}
     */
    this.value = value
    /** ラベルならジャンプ先
     * @type {number}
     */
    this.no = -1
  }
}

/**
 * 構文木からJSのコードを生成するクラス
 */
class NakoGenAsync {
  /**
   * @param {import('./nako3')} com
   * @param {Ast} ast
   * @param {boolean | string} isTest 文字列なら1つのテストだけを実行する
   */
  static generate(com, ast, isTest) {
    const gen = new NakoGenAsync(com)

    // ユーザー定義関数をシステムに登録する
    gen.registerFunction(ast)

    // JSコードを生成する
    let js = gen.convGen(ast, !!isTest)

    // JSコードを実行するための事前ヘッダ部分の生成
    js = gen.getDefFuncCode(isTest) + js
    com.logger.trace('--- generate(非同期モード) ---\n' + js)

    // テストの実行
    if (js && isTest) {
      js += '\n__self._runTests(__tests);\n'
    }
    return {
      runtimeEnv: js,  // なでしこの実行環境ありの場合
      standalone:      // JavaScript単体で動かす場合
        `\
const nakoVersion = ${JSON.stringify(nakoVersion)};
${NakoError.toString()}
${NakoRuntimeError.toString()}
this.logger = {
  error(message) { console.error(message) },
  send(level, message) { console.log(message) },
};
this.__varslist = [{}, {}, {}];
this.__varslist[2];
this.__module = {};
this.__locals = {};
this.__labels = {};
this.__code = [];
this.__index = 0;
this.__jumpStack = [];
this.__stack = [];
this.__genMode = 'async';
try {
  ${gen.getVarsCode()}
  ${js}
} catch (err) {
  if (!(err instanceof NakoRuntimeError)) {
    err = new NakoRuntimeError(err, this.__varslist[0].line);
  }
  this.logger.error(err);
  throw err;
}`,
      gen,  // コード生成に使ったNakoGenのインスタンス
    }
  }

  /**
   * @param {import('./nako3')} com コンパイラのインスタンス
   */
  constructor (com) {
    /**
     * 出力するJavaScriptコードのヘッダー部分で定義する必要のある関数。fnはjsのコード。
     * プラグイン関数は含まれない。
     */
    this.nako_func = { ...com.nako_func }

    /**
     * なでしこで定義したテストの一覧
     * @type {Record<string, { josi: string[][], fn: string, type: 'test_func' }>}
     */
    this.nako_test = {}

    /**
     * プログラム内で参照された関数のリスト。プラグインの命令を含む。
     * JavaScript単体で実行するとき、このリストにある関数の定義をJavaScriptコードの先頭に付け足す。
     * @type {Set<string>}
     */
    this.used_func = new Set()

    /**
     * ループ時の一時変数が被らないようにIDで管理
     * @type {number}
     */
    this.loopId = 1

    /**
     * 変換中の処理が、ループの中かどうかを判定する
     * @type {boolean}
     */
    this.flagLoop = false

    /**
     * 変換後のコード管理番号
     * @type {number}
     */
    this.codeId = 0

    /**
     * 変換後のコードを保持する配列
     * @type {Array<NakoCode>}
     */
    this.codeArray = []

    /** @type {NakoCode | null} */
    this.labelContinue = null
    /** @type {NakoCode | null} */
    this.labelBreak = null

    /**
     * ジャンプ先を表現するラベル
     * @type {Object<string, number>}
     */
    this.labels = {}

    // コンパイラのインスタンス
    this.__self = com
    /**
     * コードジェネレータの種類
     * @type {string}
     */
    this.genMode = 'async'

    /**
     * 行番号とファイル名が分かるときは `l123:main.nako3`、行番号だけ分かるときは `l123`、そうでなければ任意の文字列。
     * @type {string | null}
     */
    this.lastLineNo = null

    /**
     * スタック
     * @type {{ isFunction: boolean, names: Set<string>, readonly: Set<string> }[]}
     */
    this.varslistSet = com.__varslist.map((v) => ({ isFunction: false, names: new Set(Object.keys(v)), readonly: new Set() }))

    /**
     * スタックトップ
     * @type {{ isFunction: boolean, names: Set<string>, readonly: Set<string> }}
     */
    this.varsSet = { isFunction: false, names: new Set(), readonly: new Set() }
    this.varslistSet[2] = this.varsSet

    // 1以上のとき高速化する。
    // 実行速度優先ブロック内で1増える。
    this.speedMode = {
      lineNumbers: 0,          // 行番号を出力しない
      implicitTypeCasting: 0,  // 数値加算でparseFloatを出力しない
      invalidSore: 0,          // 「それ」を用いない
      forcePure: 0,            // 全てのシステム命令をpureとして扱う。命令からローカル変数への参照が出来なくなる。
    }

    // 1以上のとき測定をinjectする。
    // パフォーマンスモニタのブロック内で1増える。
    this.performanceMonitor = {
      userFunction: 0,         // 呼び出されたユーザ関数
      systemFunction: 0,       // システム関数(呼び出しコードを含む)
      systemFunctionBody: 0,   // システム関数(呼び出しコードを除く)
    }
  }

  /**
   * @param {import("./nako3").Ast} node
   * @param {boolean} forceUpdate
   */
  convLineno (node, forceUpdate) {
    if (this.speedMode.lineNumbers > 0) { return '' }

    /** @type {string} */
    let lineNo
    if (typeof node.line !== 'number') {
      lineNo = 'unknown'
    } else if (typeof node.file !== 'string') {
      lineNo = `l${node.line}`
    } else {
      lineNo = `l${node.line}:${node.file}`
    }

    // 強制的に行番号をアップデートするか
    if (!forceUpdate) {
      if (lineNo == this.lastLineNo) return ''
      this.lastLineNo = lineNo
    }
    // 例: __v0.line='l1:main.nako3'
    return `__v0.line=${JSON.stringify(lineNo)};`
  }

  /**
   * ローカル変数のJavaScriptコードを生成する。
   * @param {string} name
   */
  varname (name) {
    // varlistSet[0]  | __v0   ... system
    // varliseSet[1]  | __v1   ... global
    // varlistSrt[2]  | __vars ... user scope
    // varslisStr[3+] |        ... function scope
    const top = this.varslistSet.length - 1
    const  key = JSON.stringify(name)
    if (top == 2) {return `__vars[${key}]`}
    return `__varslist[${top}][${key}]`
  }

  /**
   * プログラムの実行に必要な関数を書き出す(システム領域)
   * @returns {string}
   */
  getVarsCode () {
    let code = ''

    // プログラム中で使った関数を列挙して書き出す
    for (const key of Array.from(this.used_func.values())) {
      const f = this.__self.__varslist[0][key]
      const name = `this.__varslist[0]["${key}"]`
      if (typeof (f) === 'function')
        {code += name + '=' + f.toString() + ';\n'}
       else
        {code += name + '=' + JSON.stringify(f) + ';\n'}

    }
    return code
  }

  /**
   * プログラムの実行に必要な関数定義を書き出す(グローバル領域)
   * convGenの結果を利用するため、convGenの後に呼び出すこと。
   * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
   * @returns {string}
   */
  getDefFuncCode(isTest) {
    let code = ''
    // よく使う変数のショートカット
    code += 'const __self = this.__self = this;\n'
    code += 'const __varslist = this.__varslist;\n'
    code += 'const __module = this.__module;\n'
    code += 'const __v0 = this.__v0 = this.__varslist[0];\n'
    code += 'const __v1 = this.__v1 = this.__varslist[1];\n'
    code += 'const __vars = this.__vars = this.__varslist[2];\n'
    code += 'const __code = this.__code;\n'

    // なでしこの関数定義を行う
    let nakoFuncCode = ''
    for (const key in this.nako_func) {
      const f = this.nako_func[key].fn
      nakoFuncCode += '' +
        `//[DEF_FUNC name='${key}']\n` +
        `__v1["${key}"]=${f};\n;` +
        `//[/DEF_FUNC name='${key}']\n`
    }
    if (nakoFuncCode !== '')
      {code += '__v0.line=\'関数の定義\';\n' + nakoFuncCode}

    // プラグインの初期化関数を実行する
    let pluginCode = ''
    for (const name in this.__self.__module) {
      const initkey = `!${name}:初期化`
      if (this.varslistSet[0].names.has(initkey)) {
        this.used_func.add(`!${name}:初期化`)
        pluginCode += `__v0["!${name}:初期化"](__self);\n`
      }
    }
    if (pluginCode !== '')
      {code += '__v0.line=\'プラグインの初期化\';\n' + pluginCode}

    // テストの定義を行う
    if (isTest) {
      let testCode = 'const __tests = [];\n'

      for (const key in this.nako_test) {
        if (isTest === true || (typeof isTest === 'string' && isTest === key)) {
          const f = this.nako_test[key].fn
          testCode += `${f};\n;`
        }
      }

      if (testCode !== '') {
        code += '__v0.line=\'テストの定義\';\n'
        code += testCode + '\n'
      }
    }

    return code
  }

  /**
   * プラグイン・オブジェクトを追加
   * @param po プラグイン・オブジェクト
   */
  addPlugin (po) {
    return this.__self.addPlugin(po)
  }

  /**
   * プラグイン・オブジェクトを追加(ブラウザ向け)
   * @param name オブジェクト名
   * @param po 関数リスト
   */
  addPluginObject (name, po) {
    this.__self.addPluginObject(name, po)
  }

  /**
   * プラグイン・ファイルを追加(Node.js向け)
   * @param objName オブジェクト名
   * @param path ファイルパス
   * @param po 登録するオブジェクト
   */
  addPluginFile (objName, path, po) {
    this.__self.addPluginFile(objName, path, po)
  }

  /**
   * 関数を追加する
   * @param key 関数名
   * @param josi 助詞
   * @param fn 関数
   */
  addFunc (key, josi, fn) {
    this.__self.addFunc(key, josi, fn)
  }

  /**
   * 関数をセットする
   * @param key 関数名
   * @param fn 関数
   */
  setFunc (key, fn) {
    this.__self.setFunc(key, fn)
  }

  /**
   * プラグイン関数を参照する
   * @param key プラグイン関数の関数名
   * @returns プラグイン・オブジェクト
   */
  getFunc (key) {
    return this.__self.getFunc(key)
  }

  /**
   * 関数を先に登録してしまう
   */
  registerFunction (ast) {
    if (ast.type !== 'block')
      {throw NakoSyntaxError.fromNode('構文解析に失敗しています。構文は必ずblockが先頭になります', ast)}

    const registFunc = (node) => {
      for (let i = 0; i < node.block.length; i++) {
        const t = node.block[i]
        if (t.type === 'def_func') {
          const name = t.name.value
          this.used_func.add(name)
          this.__self.__varslist[1][name] = function () { } // 事前に適当な値を設定
          this.nako_func[name] = {
            josi: t.name.meta.josi,
            fn: '',
            type: 'func'
          }
        } else
        if (t.type === 'speed_mode') {
          if (t.block.type === 'block') {
            registFunc(t.block)
          } else {
            registFunc(t)
          }
        } else
        if (t.type === 'performance_monitor') {
          if (t.block.type === 'block') {
            registFunc(t.block)
          } else {
            registFunc(t)
          }
        }
      }
    }
    registFunc(ast)

    // __self.__varslistの変更を反映
    const initialNames = new Set()
    if (this.speedMode.invalidSore === 0) {
      initialNames.add('それ')
    }
    this.varsSet = { isFunction: false, names: initialNames, readonly: new Set() }
    this.varslistSet = this.__self.__varslist.map((v) => ({ isFunction: false, names: new Set(Object.keys(v)), readonly: new Set() }))
    this.varslistSet[2] = this.varsSet
  }

  /**
   * @param {Ast} node
   * @param {boolean} isTest
   */
  convGen (node, isTest) {
    // convert
    let result = this.convLineno(node, false) + this._convGen(node, true) + '\n'
    // search label
    this.codeArray.forEach((code, index, list) => {
      if (code.type == NakoCodeLabel) {
        this.labels[code.value] = index
      }
    })
    // fix label address
    this.codeArray.forEach((code, index, list) => {
      if (code.type == NakoCodeJump || code.type == NakoCodeJumpIfTrue || code.type == NakoCodeJumpIfFalse) {
        if (code.no < 0) {
          code.no = this.labels[code.value]
        }
      }
    })
    // append code
    this.codeArray.forEach((code, index, list) => {
      switch (code.type) {
        case NakoCodeNop:
          result += `__code[${index}] = sys => {} // [NOP] ${code.value}\n`
          break
        case NakoCodeLabel:
          result += `__code[${index}] = sys => {} // [LABEL] ${code.value}\n`
          break
        case NakoCodeJump:
          result += `__code[${index}] = sys => { sys.nextIndex = ${code.no} }\n`
          break
        case NakoCodeJumpIfTrue:
          result += `__code[${index}] = sys => { if (sys.__stack.pop()) { sys.nextIndex = ${code.no}} }\n`
          break
        case NakoCodeJumpIfFalse:
          result += `__code[${index}] = sys => { if (!sys.__stack.pop()) { sys.nextIndex = ${code.no}} }\n`
          break
        case NakoCodeReturn:
          result += `__code[${index}] = sys => { sys.__return(sys) }\n`
          break
        case NakoCodeCode:
          // trim last
          let s = code.value.replace(/\s+$/, '')
          result += `__code[${index}] = sys => {\n${s}\n};\n`
          break
        default:
          throw new Error('invalid code type')
      }
    })
    result += '\n'
    result += '// === go nako3 === \n'
    result += 'this.nextAsync = sys => {\n'
    result += '  if (sys.index >= sys.__code.length) {return}\n'
    result += '  for (;;) {\n'
    result += '    // exec code\n'
    result += '    sys.__code[sys.index](sys)\n'
    result += '    // check next\n'
    result += '    if (sys.nextIndex >= 0) {\n'
    result += '      sys.index = sys.nextIndex\n'
    result += '      sys.nextIndex = -1\n'
    result += '    } else {\n'
    result += '      sys.index++\n'
    result += '    }\n'
    result += '    if (sys.index >= sys.__code.length) {return}\n'
    result += '    if (sys.async) { sys.async = false; break}\n'
    result += '  }\n'
    // result += '  setTimeout(function(){ sys.goNako3(sys) }, 0)\n'
    result += '}\n'
    result += `this.__return = sys => {\n`
    result += `  const loc = sys.__varslist.pop();\n`
    result += `  const top = sys.__varslist.length - 1;\n`
    result += `  sys.__varslist[top]['それ'] = loc['それ']\n`
    result += `  const st = sys.__jumpStack.pop();\n`
    result += `  sys.nextIndex = st.no;\n`
    result += `}\n`
    result += 'this.index = 0;\n'
    result += 'this.async = false;\n'
    result += 'this.nextAsync(this)\n'
    
    if (isTest) {
      return ''
    } else {
      return result
    }
  }

  /**
   * @param {Ast} node
   * @param {boolean} isExpression
   */
  _convGen(node, isExpression) {
    let code = ''
    if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        const n = node[i]
        code += this._convGen(n, isExpression)
      }
      return code
    }
    if (node === null) {return 'null'}
    if (node === undefined) {return 'undefined'}
    if (typeof (node) !== 'object') {return '' + node}
    // switch
    switch (node.type) {
      // === NOP ===
      case 'nop':
        break
      case 'comment':
      case 'eol':
        if (!node.value) {node.value = ''}
        const line = this.convLineno(node, true) + '// [EOL] ' + node.value
        this.addCodeStr(line)
        break
      
      // === 単純なコード変換 ===
      case 'number':
        code += node.value
        break
      case 'string':
        code += this.convString(node)
        break
      case 'word':
      case 'variable':
        code += this.convGetVar(node)
        break
      case 'op':
      case 'calc':
        code += this.convOp(node)
        break
      case 'renbun':
        code += this.convRenbun(node)
        break
      case 'not':
        code += '((' + this._convGen(node.value, true) + ')?0:1)'
        break
      case '配列参照':
        code += this.convRefArray(node)
        break
      case 'json_array':
        code += this.convJsonArray(node)
        break
      case 'json_obj':
        code += this.convJsonObj(node)
        break
      case 'bool':
        code += (node.value) ? 'true' : 'false'
        break
      case 'null':
        code += 'null'
        break
      case 'func':
      case 'func_pointer':
      case 'calc_func':
        code += this.convFunc(node, isExpression)
        break
      
      // === 文の変換 ===
      case 'let':
        code += this.addCodeStr(this.convLet(node))
        break
      case 'let_array':
        this.addCodeStr(this.convLetArray(node))
        break
      case 'block':
        for (let i = 0; i < node.block.length; i++) {
          const b = node.block[i]
          code += this.addCodeStr(this._convGen(b, false))
        }
        break
      case 'if':
        this.convIf(node)
        break
      case 'repeat_times':
        this.convRepeatTimes(node)
        break 
      case 'break':
        code += this.addCodeStr(this.convCheckLoop(node, 'break'))
        break
      case 'continue':
        code += this.addCodeStr(this.convCheckLoop(node, 'continue'))
        break
      case 'for':
        this.convFor(node)
        break
      case 'foreach':
        this.convForeach(node)
        break
      case 'while':
        this.convWhile(node)
        break          
      case 'switch':
        this.convSwitch(node)
        break
      case 'end':
        code += this.addCodeStr('__varslist[0][\'終\']();')
        break
      case 'def_local_var':
        code += this.addCodeStr(this.convDefLocalVar(node))
        break
      case 'def_local_varlist':
        code += this.addCodeStr(this.convDefLocalVarlist(node))
        break
      case 'tikuji':
        code += this.addCodeStr(this.convTikuji(node))
        break
      case 'speed_mode':
        code += this.addCodeStr(this.convSpeedMode(node, isExpression))
        break
      case 'performance_monitor':
        code += this.addCodeStr(this.convPerformanceMonitor(node, isExpression))
        break
      case 'func_obj':
        code += this.addCodeStr(this.convFuncObj(node))
        break
      case 'def_test':
        code += this.addCodeStr(this.convDefTest(node))
        break
      case 'def_func':
        code += this.addCodeStr(this.convDefFunc(node))
        break
      case 'return':
        code += this.addCodeStr(this.convReturn(node))
        break
      // TODO
      case 'try_except':
        code += this.convTryExcept(node)
        break
      case 'require':
        code += NakoGen.convRequire(node)
        break
      default:
        throw new Error('System Error: unknown_type=' + node.type)
    }
    return code
  }

  /**
   * add code to array
   * @param {string} codeStr
   * @returns {string}
   */
  addCodeStr (codeStr) {
    if (codeStr == '') {return ''}
    const a = codeStr.split('\n')
    const a2 = a.map(row => '  ' + row.replace(/\s+$/, ''))
    const c = new NakoCode(NakoCodeCode, a2.join('\n'))
    return this.addCode(c)
  }

  /**
   * add code to array
   * @param {NakoCode} code
   * @returns {string}
   */
   addCode (code) {
    this.codeArray[this.codeId] = code
    this.codeId++
    return ''
  }

  /**
   * make label for jump
   * @param {string} name 
   * @returns {NakoCode}
   */
  makeLabel (name) {
    const uniqLabel = name + '_' + this.loopId
    this.loopId++
    const c = new NakoCode(NakoCodeLabel, uniqLabel)
    this.labels[name] = -1
    return c
  }
  /**
   * make Jump 
   * @param {NakoCode} label
   * @returns {NakoCode}
   */
  makeJump (label) {
    return new NakoCode(NakoCodeJump, label.value)
  }
  /**
   * make Jump if true
   * @param {NakoCode} label
   * @returns {NakoCode}
   */
   makeJumpIfTrue (label) {
    return new NakoCode(NakoCodeJumpIfTrue, label.value)
  }
  /**
   * make Jump if false
   * @param {NakoCode} label
   * @returns {NakoCode}
   */
   makeJumpIfFalse (label) {
    return new NakoCode(NakoCodeJumpIfFalse, label.value)
  }

  /**
   * @param {Ast} node
   */
  convIf (node) {
    const labelEnd = this.makeLabel('IfEnd')
    const labelIfFalse = this.makeLabel('IfFalse')
    const expr = this._convGen(node.expr, true)
    this.addCodeStr(`sys.__stack.push(${expr})`)
    this.addCode(this.makeJumpIfFalse(labelIfFalse))
    this._convGen(node.block, false)
    this.addCode(this.makeJump(labelEnd))
    this.addCode(labelIfFalse)
    if (node.false_block) {
      this._convGen(node.false_block, false)
    }
    this.addCode(labelEnd)
    return ''
  }

  convRepeatTimes (node) {
    this.flagLoop = true
    // ループ管理変数を作成
    const loopVar = `sys.__tmp_i${this.loopId}`
    this.loopId++
    // ループ回数を取得
    const loopCount = `sys.__tmp_count${this.loopId}`
    this.loopId++
    const value = this._convGen(node.value, true)
    const initCode = '//回:開始\n' +
      `${loopVar} = 0;\n` +
      `${loopCount} = ${value};\n`
    this.addCodeStr(initCode)
    
    const labelCheck = this.makeLabel('回:条件チェック')
    this.addCode(labelCheck)
    const labelEnd = this.makeLabel('回:ここまで')
    this.labelBreak = labelEnd
    this.labelContinue = labelCheck

    // 繰り返し判定
    const kaisu = '__v0["回数"]'
    const cond = 
      `${kaisu} = ++${loopVar}\n` +
      `sys.__stack.push(${loopVar} > ${loopCount})\n`
    this.addCodeStr(cond)
    this.addCode(this.makeJumpIfTrue(labelEnd))
    const block = this.convGenLoop(node.block)
    this.addCode(this.makeJump(labelCheck))
    this.addCode(labelEnd)
    this.flagLoop = false
    return ''
  }


  /**
   * @param {string} name
   * @returns {{i: number, name: string, isTop: boolean, js: string} | null}
   */
  findVar (name) {
    // __vars ? (ローカル変数)
    if (this.varslistSet.length > 3 && this.varsSet.names.has(name)) {
      return { i: this.varslistSet.length - 1, name, isTop: true, js: this.varname(name) }
    }
    // __varslist ?
    for (let i = 2; i >= 0; i--) {
      if (this.varslistSet[i].names.has(name)) {
        // ユーザーの定義したグローバル変数 (__varslist[2]) は、変数展開されている（そのままの名前で定義されている）可能性がある。
        // それ以外の変数は、必ず__varslistに入っている。
        return { i, name, isTop: false, js: `__varslist[${i}][${JSON.stringify(name)}]` }
      }
    }
    
    return null
  }

  /**
   * 定義済みの変数の参照
   * @param {string} name
   * @param {Ast} position
   */
  genVar (name, position) {
    const res = this.findVar(name)
    const lno = position.line
    if (res === null) {
      // 定義されていない名前の参照は変数の定義とみなす。
      // 多くの場合はundefined値を持つ変数であり分かりづらいバグを引き起こすが、
      // 「ナデシコする」などの命令の中で定義された変数の参照の場合があるため警告に留める。
      // ただし、自動的に定義される変数『引数』『それ』などは例外 #952
      if (name == '引数' || name == 'それ' || name == '対象' || name == '対象キー') {
        // デフォルト定義されている変数名
      } else {
        this.__self.logger.warn(`変数『${name}』は定義されていません。`, position)
      }
      this.varsSet.names.add(name)
      return this.varname(name)
  }

    const i = res.i
    // システム関数・変数の場合
    if (i === 0) {
      const pv = this.__self.funclist[name]
      if (!pv) {return `${res.js}/*err:${lno}*/`}
      if (pv.type === 'const' || pv.type === 'var') {return res.js}
      if (pv.type === 'func') {
        if (pv.josi.length === 0)
          {return `(${res.js}())`}

        throw NakoSyntaxError.fromNode(`『${name}』が複文で使われました。単文で記述してください。(v1非互換)`, position)
      }
      throw NakoSyntaxError.fromNode(`『${name}』は関数であり参照できません。`, position)
    }
    return res.js
  }

  convGetVar (node) {
    const name = node.value
    return this.genVar(name, node)
  }

  convComment (node) {
    let commentSrc = String(node.value)
    commentSrc = commentSrc.replace(/\n/g, '¶')
    const lineNo = this.convLineno(node, false)
    if (commentSrc === '' && lineNo === '') { return ';' }
    if (commentSrc === '') {
      return ';' + lineNo + '\n'
    }
    return ';' + lineNo + '//' + commentSrc + '\n'
  }

  convReturn (node) {
    // 関数の中であれば利用可能
    if (this.varsSet.names.has('!関数'))
      {throw NakoSyntaxError.fromNode('『戻る』がありますが、関数定義内のみで使用可能です。', node)}

    const lno = this.convLineno(node, false)
    let value
    if (node.value) {
      value = this._convGen(node.value, true)
      const cv = lno + `${this.varname('それ')} = ${value};`
      this.addCodeStr(cv)
    }
    this.addCode(new NakoCode(NakoCodeReturn, ''))
    return ''
  }

  convCheckLoop (node, cmd) {
    // ループの中であれば利用可能
    if (!this.flagLoop) {
      const cmdj = (cmd === 'continue') ? '続ける' : '抜ける'
      throw NakoSyntaxError.fromNode(`『${cmdj}』文がありますが、それは繰り返しの中で利用してください。`, node)
    }
    if (cmd == 'continue') {
      if (this.labelContinue) {this.addCode(this.makeJump(this.labelContinue))}
    } else {
      if (this.labelBreak) {this.addCode(this.makeJump(this.labelBreak))}
    }
    return ''
  }

  convDefFuncCommon (node, name) {
    const labelEnd = this.makeLabel(`関数「${name}」:ここまで`)
    this.addCode(this.makeJump(labelEnd))
    const labelBegin = this.makeLabel(`関数「${name}」:ここから`)
    this.addCode(labelBegin)

    let topOfFunction = '(function(){\n'
    let endOfFunction = '})'
    let variableDeclarations = ''
    const initialNames = new Set()
    if (this.speedMode.invalidSore === 0) {
      initialNames.add('それ')
    }
    this.varsSet = { isFunction: true, names: initialNames, readonly: new Set() }
    // ローカル変数をPUSHする
    this.varslistSet.push(this.varsSet)
    // JSの引数と引数をバインド
    variableDeclarations += `  const top = arguments.length - 1;\n`
    variableDeclarations += `  const sys = arguments[top];\n`
    variableDeclarations += `  const localvars = {}\n`
    variableDeclarations += `  sys.__varslist.push(localvars)\n`
    variableDeclarations += `  localvars['引数'] = arguments;\n`
    variableDeclarations += `  localvars['それ'] = '';\n`
    variableDeclarations += `  sys.__jumpStack.push({no: sys.index+1});\n`

    // 宣言済みの名前を保存
    const varsDeclared = Array.from(this.varsSet.names.values())
    let code = ''
    // 引数をローカル変数に設定
    let meta = (!name) ? node.meta : node.name.meta
    for (let i = 0; i < meta.varnames.length; i++) {
      const word = meta.varnames[i]
      code += `  ${this.varname(word)} = arguments[${i}];\n`
      this.varsSet.names.add(word)
    }
    // 関数定義は、グローバル領域で。
    if (name) {
      this.used_func.add(name)
      this.varslistSet[1].names.add(name)
      this.nako_func[name] = {
        josi: node.name.meta.josi,
        fn: '',
        type: 'func'
      }
    }
    // ブロックを解析
    const blockId = this.codeId
    const block = this._convGen(node.block, false)
    code += block.split('\n').map((line) => '  ' + line).join('\n') + '\n'
    this.addCode(new NakoCode(NakoCodeReturn, ''))
    // 関数定義でブロックを呼び出すようにする
    code += `  sys.index = ${blockId};\n`
    code += `  sys.nextAsync(sys);\n`
    // 関数コード
    code = topOfFunction + variableDeclarations + code + endOfFunction

    if (name) {this.nako_func[name].fn = code}

    this.varslistSet.pop()
    this.varsSet = this.varslistSet[this.varslistSet.length - 1]
    if (name)
      {this.__self.__varslist[1][name] = code}

    this.addCode(this.makeJump(labelEnd))
    this.addCode(new NakoCode(NakoCodeReturn, ''))
    this.addCode(labelEnd)
    return code
  }

  convDefTest(node) {
    const name = node.name.value
    let code = `__tests.push({ name: '${name}', f: () => {\n`

    // ブロックを解析
    const block = this._convGen(node.block, false)

    code += `   ${block}\n` +
      `}});`

    this.nako_test[name] = {
      'josi': node.name.meta.josi,
      'fn': code,
      'type': 'test_func'
    }

    // ★この時点ではテストコードを生成しない★
    // プログラム冒頭でコード生成時にテストの定義を行う
    return ''
  }

  convDefFunc(node) {
    const name = NakoGen.getFuncName(node.name.value)
    this.convDefFuncCommon(node, name)
    // ★この時点では関数のコードを生成しない★
    // プログラム冒頭でコード生成時に関数定義を行う
    return ''
  }

  convFuncObj (node) {
    return this.convDefFuncCommon(node, '')
  }

  convJsonObj (node) {
    const list = node.value
    const codelist = list.map((e) => {
      const key = this._convGen(e.key, true)
      const val = this._convGen(e.value, true)
      return `${key}:${val}`
    })
    return '{' + codelist.join(',') + '}'
  }

  convJsonArray (node) {
    const list = node.value
    const codelist = list.map((e) => {
      return this._convGen(e, true)
    })
    return '[' + codelist.join(',') + ']'
  }

  convRefArray(node) {
    const name = this._convGen(node.name, true)
    const list = node.index
    let code = name
    for (let i = 0; i < list.length; i++) {
      const idx = this._convGen(list[i], true)
      code += '[' + idx + ']'
    }
    return code
  }

  convLetArray(node) {
    const name = this._convGen(node.name, true)
    const list = node.index
    let code = name
    for (let i = 0; i < list.length; i++) {
      const idx = this._convGen(list[i], true)
      code += '[' + idx + ']'
    }
    const value = this._convGen(node.value, true)
    code += ' = ' + value + ';\n'
    return this.convLineno(node, false) + code
  }

  convGenLoop (node) {
    const tmpflag = this.flagLoop
    this.flagLoop = true
    try {
      return this._convGen(node, false)
    } finally {
      this.flagLoop = tmpflag
    }
  }

  convFor (node) {
    this.flagLoop = true
    // ループ変数について
    let word
    if (node.word !== null) { // ループ変数を使う時
      const varName = node.word.value
      this.varsSet.names.add(varName)
      word = this.varname(varName)
    } else {
      this.varsSet.names.add('dummy')
      word = this.varname('dummy')
    }
    const sore = this.varname('それ')
    const idLoop = this.loopId++
    const varI = `sys.__tmp__i${idLoop}`
    // ループ条件を変数に入れる用
    const varTo = `sys.__tmp__to${idLoop}`
    // ループ条件を確認
    const made = this._convGen(node.to, true)
    const kara = this._convGen(node.from, true)
    this.addCodeStr(`${varTo} = ${made}`)
    // ループ変数を初期化
    this.addCodeStr(`${sore} = ${word} = ${kara}`)
    // 繰り返し判定
    const labelCheck = this.makeLabel('繰返:条件確認')
    const labelInc = this.makeLabel('繰返:加算')
    this.addCode(labelCheck)
    const labelEnd = this.makeLabel('繰返:ここまで')
    this.addCodeStr(`sys.__stack.push(${word} <= ${varTo})`)
    this.addCode(this.makeJumpIfFalse(labelEnd))
    this.labelContinue = labelInc
    this.labelBreak = labelEnd
    // ループ内のブロック内容を得る
    const block = this.convGenLoop(node.block)
    this.addCode(labelInc)
    this.addCodeStr(`${sore} = ++${word};`)
    this.addCode(this.makeJump(labelCheck))
    this.addCode(labelEnd)
    this.flagLoop = false
    return ''
  }

  convForeach (node) {
    this.flagLoop = true
    // 対象を用意する
    let taisyo = '__v0["対象"]'
    const taisyoKey = `__v0["対象キー"]`
    if (node.name) {
      taisyo = this.varname(node.name.value)
      this.varsSet.names.add(node.name.value)
    }
    // 反復対象を調べる
    let target
    if (node.target === null) {
      if (this.speedMode.invalidSore === 0) {
        target = this.varname('それ')
      } else {
        throw NakoSyntaxError.fromNode(`『反復』の対象がありません。`, node)
      }
    } else
      {target = this._convGen(node.target, true)}
    const sore = this.varname('それ')
    const targetArray = `sys.__tmp__target${this.loopId++}`
    const targetKeys = `sys.__tmp__keys${this.loopId++}`
    const loopVar = `sys.__tmp__i${this.loopId++}`
    const loopCount = `sys.__tmp__count${this.loopId++}`
    const initCode =
      `// 反復: 初期化\n` +
      `${targetArray} = ${target};\n` + 
      `${loopVar} = 0;\n` +
      // 文字列や数値なら反復できるように配列に入れる
      `if (typeof(${targetArray}) == 'string' || typeof(${targetArray}) == 'number') { ${targetArray} = [${targetArray}]; }\n` + 
      // Objectならキー一覧を得る
      `if (${targetArray} instanceof Array) { ${loopCount} = ${targetArray}.length; }\n` +
      `else { ${targetKeys} = Object.keys(${targetArray}); ${loopCount} = ${targetKeys}.length; }\n`
    this.addCodeStr(initCode)
    const labelCheck = this.makeLabel('反復:条件確認')
    const labelInc = this.makeLabel('反復:加算')
    const labelEnd = this.makeLabel('反復:ここまで')
    this.labelBreak = labelEnd
    this.labelContinue = labelInc
    this.addCode(labelCheck)
    const setTarget = 
      `if (${targetArray} instanceof Array) {\n` +
      `  ${taisyo} = ${sore} = ${targetArray}[${loopVar}];　${taisyoKey} = ${loopVar};\n` +
      `} else {\n` +
      `  while (${loopVar} < ${loopCount}) {\n` +
      `    ${taisyoKey} = ${targetKeys}[${loopVar}]; ${taisyo} = ${sore} = ${targetArray}[${taisyoKey}];\n` +
      `    if (!${targetArray}.hasOwnProperty(${taisyoKey})) { ${loopVar}++; continue; }\n` +
      `    break;` +
      `  }\n` +
      `}`
    this.addCodeStr(`${setTarget}\nsys.__stack.push(${loopVar} < ${loopCount});`)
    this.addCode(this.makeJumpIfFalse(labelEnd))
    // 反復ブロックを定義
    const block = this.convGenLoop(node.block)
    // 加算
    this.addCode(labelInc)
    this.addCodeStr(`${loopVar}++`)
    this.addCode(this.makeJump(labelCheck))
    this.addCode(labelEnd)
    this.flagLoop = false
    return ''
  }


  convWhile (node) {
    this.flagLoop = true
    const labelBegin = this.makeLabel('間:ここから')
    const labelEnd = this.makeLabel('間:ここまで')
    this.labelContinue = labelBegin
    this.labelBreak = labelEnd
    const cond = this._convGen(node.cond, true)
    this.addCodeStr(`sys.__stack.push(${cond})`)
    this.addCode(this.makeJumpIfFalse(labelEnd))
    const block = this.convGenLoop(node.block)
    this.addCode(labelEnd) 
    this.flagLoop = false
    return ''
  }

  /**
   * @param {Ast} node
   * @param {boolean} isExpression
   */
  convSpeedMode (node, isExpression) {
    return ''
  }

  /**
   * @param {Ast} node
   * @param {boolean} isExpression
   */
  convPerformanceMonitor (node, isExpression) {
    const prev = { ...this.performanceMonitor }
    if (node.options['ユーザ関数']) {
      this.performanceMonitor.userFunction++
    }
    if (node.options['システム関数本体']) {
      this.performanceMonitor.systemFunctionBody++
    }
    if (node.options['システム関数']) {
      this.performanceMonitor.systemFunction++
    }
    try {
      return this._convGen(node.block, isExpression)
    } finally {
      this.performanceMonitor = prev
    }
  }

  convSwitch (node) {
    const value = this._convGen(node.value, true)
    const varValue = `sys.__tmp__i${this.loopId++}`
    this.addCodeStr(`${varValue} = ${value}`)
    const labelEnd = this.makeLabel('条件分岐:ここまで')
    const cases = node.cases
    let body = ''
    for (let i = 0; i < cases.length; i++) {
      const cvalue = cases[i][0]
      if (cvalue.type == '違えば') {
        this.convGenLoop(cases[i][1])
      } else {
        const nextLabel = this.makeLabel('条件分岐:次')
        const cvalueCode = this._convGen(cvalue, true)
        this.addCodeStr(`sys.__stack.push((${cvalueCode}) == ${varValue})`)
        this.addCode(this.makeJumpIfFalse(nextLabel))
        this.convGenLoop(cases[i][1])
        this.addCode(this.makeJump(labelEnd))
        this.addCode(nextLabel)
      }
    }
    this.addCode(labelEnd)
    return ''
  }
  
  convTikuji (node) {
    const pid = this.loopId++
    // gen tikuji blocks
    const curName = `__tikuji${pid}`
    let code = `const ${curName} = []\n`
    for (let i = 0; i < node.blocks.length; i++) {
      const block = this._convGen(node.blocks[i], false).replace(/\s+$/, '') + '\n'
      const blockLineNo = this.convLineno(node.blocks[i], true)
      const blockCode =
        `${curName}.push(function(resolve, reject) {\n` +
        '  __self.resolve = resolve;\n' +
        '  __self.reject = reject;\n' +
        '  __self.resolveCount = 0;\n' +
        `  ${blockLineNo}\n` +
        `  ${block}` +
        '  if (__self.resolveCount === 0) resolve();\n' +
        '}); // end of tikuji__${pid}[{$i}]\n'
      code += blockCode
    }
    code += `// end of ${curName} \n`
    // gen error block
    let errorCode = 
      `  ${curName}.splice(0);\n` + // clear
      '  __v0["エラーメッセージ"]=errMsg;\n'
    if (node.errorBlock != null) {
      const errBlock = this._convGen(node.errorBlock, false).replace(/\s+$/, '') + '\n'
      errorCode += errBlock
    }
    code += `const ${curName}__reject = function(errMsg){\n${errorCode}};\n`
    // gen run block
    code += '__self.resolve = undefined;\n'
    code += `const ${curName}__resolve = function(){\n`
    code += `  setTimeout(function(){\n`
    code += `    if (${curName}.length == 0) {return}\n`
    code += `    const f = ${curName}.shift()\n`
    code += `    f(${curName}__resolve, ${curName}__reject);\n`
    code += `  }, 0);\n`
    code += `};\n`
    code += `${curName}__resolve()\n`
    return this.convLineno(node, false) + code
  }

  convFuncGetArgsCalcType (funcName, func, node) {
    const args = []
    const opts = {}
    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i]
      if (i === 0 && arg === null && this.speedMode.invalidSore === 0) {
        args.push(this.varname('それ'))
        opts['sore'] = true
      } else
        {args.push(this._convGen(arg, true))}

    }
    return [args, opts]
  }

  getPluginList () {
    const r = []
    for (const name in this.__self.__module) {r.push(name)}
    return r
  }

  /**
   * 関数の呼び出し
   * @param {Ast} node
   * @param {boolean} isExpression
   * @returns string コード
   */
  convFunc (node, isExpression) {
    const funcName = NakoGen.getFuncName(node.name)
    const res = this.findVar(funcName)
    if (res === null) {
      throw NakoSyntaxError.fromNode(`関数『${funcName}』が見当たりません。有効プラグイン=[` + this.getPluginList().join(', ') + ']', node)
    }
    let func
    if (res.i === 0) { // plugin function
      func = this.__self.funclist[funcName]
      if (func.type !== 'func') {
        throw NakoSyntaxError.fromNode(`『${funcName}』は関数ではありません。`, node)
      }
    } else {
      func = this.nako_func[funcName]
      // 無名関数の可能性
      if (func === undefined) {func = {return_none: false}}
    }
    // 関数の参照渡しか？
    if (node.type === 'func_pointer') {
      return res.js
    }
    // 関数の参照渡しでない場合
    // 関数定義より助詞を一つずつ調べる
    const argsInfo = this.convFuncGetArgsCalcType(funcName, func, node)
    const args = argsInfo[0]
    const argsOpts = argsInfo[1]
    // function
    this.used_func.add(funcName)

    // console.log('@@@', funcName, argsInfo, argsOpts)

    // 関数呼び出しで、引数の末尾にthisを追加する-システム情報を参照するため
    args.push('__self')
    let funcBegin = ''
    let funcEnd = ''
    // setter?
    if (node['setter']) {
      funcBegin += ';__self.isSetter = true;\n'
      funcEnd += ';__self.isSetter = false;\n'
    }
    // 関数内 (__varslist.length > 3) からプラグイン関数 (res.i === 0) を呼び出すとき、 そのプラグイン関数がpureでなければ
    // 呼び出しの直前に全てのローカル変数をthis.__localsに入れる。
    if (res.i === 0 && this.varslistSet.length > 3 && func.pure !== true && this.speedMode.forcePure === 0) { // undefinedはfalseとみなす
      // 展開されたローカル変数の列挙
      const localVars = []
      for (const name of Array.from(this.varsSet.names.values())) {
        if (NakoGen.isValidIdentifier(name)) {
          localVars.push({ str: JSON.stringify(name), js: this.varname(name) })
        }
      }

      // --- 実行前 ---

      // 全ての展開されていないローカル変数を __self.__locals にコピーする
      funcBegin += `__self.__locals = __vars;\n`

      // 全ての展開されたローカル変数を __self.__locals に保存する
      for (const v of localVars) {
        funcBegin += `__self.__locals[${v.str}] = ${v.js};\n`
      }

      // --- 実行後 ---

      // 全ての展開されたローカル変数を __self.__locals から受け取る
      // 「それ」は関数の実行結果を受け取るために使うためスキップ。
      for (const v of localVars) {
        if (v.js !== 'それ') {
          funcEnd += `${v.js} = __self.__locals[${v.str}];\n`
        }
      }
    }
    // 変数「それ」が補完されていることをヒントとして出力
    if (argsOpts['sore']){funcBegin += '/*[sore]*/'}

    const indent = (text, n) => {
      let result = ''
      for (const line of text.split('\n')) {
        if (line !== '') {
          result += '  '.repeat(n) + line + '\n'
        }
      }
      return result
    }

    // 関数呼び出しコードの構築
    let argsCode = args.join(',')
    let funcCall = `${res.js}(${argsCode})`
    let code = ``
    if (func.return_none) {
      if (funcEnd === '') {
        if (funcBegin === '') {
          code += `${funcCall};\n`
        } else {
          code += `${funcBegin} ${funcCall};\n`
        }
      } else {
        code += `${funcBegin}try {\n${indent(funcCall, 1)};\n} finally {\n${indent(funcEnd, 1)}}\n`
      }
    } else {
      let sorePrefex = `${this.varname('それ')} = `
      if (funcBegin === '' && funcEnd === '') {
        code += `(${sorePrefex}${funcCall})`
      } else {
        if (funcEnd === '') {
          code += `(function(){\n${indent(`${funcBegin};\nreturn ${sorePrefex} ${funcCall}`, 1)}}).call(this)`
        } else {
          code += `(function(){\n${indent(`${funcBegin}try {\n${indent(`return ${sorePrefex}${funcCall};`, 1)}\n} finally {\n${indent(funcEnd, 1)}}`, 1)}}).call(this)`
        }
      }
      // ...して
      if (node.josi === 'して' || (node.josi === '' && !isExpression)){code += ';\n'}
    }

    return code
  }

  convRenbun(node) {
    let right = this._convGen(node.right, true)
    let left = this._convGen(node.left, false)
    return `(function(){${left}; return ${right}}).call(this)`
  }

  convOp (node) {
    const OP_TBL = { // トークン名からJS演算子
      '&': '+""+',
      'eq': '==',
      'noteq': '!=',
      '===': '===',
      '!==': '!==',
      'gt': '>',
      'lt': '<',
      'gteq': '>=',
      'lteq': '<=',
      'and': '&&',
      'or': '||',
      'shift_l': '<<',
      'shift_r': '>>',
      'shift_r0': '>>>'
    }
    let op = node.operator // 演算子
    let right = this._convGen(node.right, true)
    let left = this._convGen(node.left, true)
    if (op === '+' && this.speedMode.implicitTypeCasting === 0) {
      if (node.left.type !== 'number') {
        left = `parseFloat(${left})`
      }
      if (node.right.type !== 'number') {
        right = `parseFloat(${right})`
      }
    }
    // 階乗
    if (op === '^')
      {return '(Math.pow(' + left + ',' + right + '))'}

    // 一般的なオペレータに変換
    if (OP_TBL[op]) {op = OP_TBL[op]}
    //
    return `(${left} ${op} ${right})`
  }

  convLet (node) {
    // もし値が省略されていたら、変数「それ」に代入する
    let value = null
    if (this.speedMode.invalidSore === 0) {value = this.varname('それ')}
    if (node.value) {value = this._convGen(node.value, true)}
    if (value == null) {
      throw NakoSyntaxError.fromNode(`代入する先の変数名がありません。`, node)
    }
    // 変数名
    const name = node.name.value
    const res = this.findVar(name)
    let code = ''
    if (res === null) {
      this.varsSet.names.add(name)
      code = `${this.varname(name)}=${value};`
    } else {
      // 定数ならエラーを出す
      if (this.varslistSet[res.i].readonly.has(name)) {
        throw NakoSyntaxError.fromNode(
          `定数『${name}』は既に定義済みなので、値を代入することはできません。`, node)
      }
      code = `${res.js}=${value};`
    }

    return ';' + this.convLineno(node, false) + code + '\n'
  }

  convDefLocalVar (node) {
    const value = (node.value === null) ? 'null' : this._convGen(node.value, true)
    const name = node.name.value
    const vtype = node.vartype // 変数 or 定数
    // 二重定義？
    if (this.varsSet.names.has(name))
      {throw NakoSyntaxError.fromNode(`${vtype}『${name}』の二重定義はできません。`, node)}

    //
    this.varsSet.names.add(name)
    if (vtype === '定数') {
      this.varsSet.readonly.add(name)
    }
    const code = `${this.varname(name)}=${value};\n`
    return this.convLineno(node, false) + code
  }
  
  // #563 複数変数への代入
  convDefLocalVarlist (node) {
    let code = ''
    const vtype = node.vartype // 変数 or 定数
    const value = (node.value === null) ? 'null' : this._convGen(node.value, true)
    this.loopId++
    let varI = `$nako_i${this.loopId}`
    code += `${varI}=${value}\n`
    code += `if (!(${varI} instanceof Array)) { ${varI}=[${varI}] }\n`
    for (let nameObj of node.names) {
      const name = nameObj.value
      // 二重定義？
      if (this.varsSet.names.has(name))
        {throw NakoSyntaxError.fromNode(`${vtype}『${name}』の二重定義はできません。`, node)}
      //
      this.varsSet.names.add(name)
      if (vtype === '定数') {
        this.varsSet.readonly.add(name)
      }
      let vname = this.varname(name)
      code += `${vname}=${varI}.shift();\n`
    }
    return this.convLineno(node, false) + code
  }

  convString (node) {
    let value = '' + node.value
    let mode = node.mode
    value = value.replace(/\\/g, '\\\\')
    value = value.replace(/"/g, '\\"')
    value = value.replace(/\r/g, '\\r')
    value = value.replace(/\n/g, '\\n')
    if (mode === 'ex') {
      let rf = (a, name) => {
        return '"+' + this.genVar(name, node) + '+"'
      }
      value = value.replace(/\{(.+?)\}/g, rf)
      value = value.replace(/｛(.+?)｝/g, rf)
    }
    return '"' + value + '"'
  }

  convTryExcept(node) {
    const block = this._convGen(node.block, false)
    const errBlock = this._convGen(node.errBlock, false)
    return this.convLineno(node, false) +
      `try {\n${block}\n} catch (e) {\n` +
      '  __v0["エラーメッセージ"] = e.message;\n' +
      ';\n' +
      `${errBlock}}\n`
  }
}

module.exports = NakoGenAsync
