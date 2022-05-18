// @ts-nocheck
/**
 * file: nako_gen_async.js
 * パーサーが生成した中間オブジェクトを実際のJavaScriptのコードに変換する。
 * なお、扱いやすさ優先で、なでしこの一文を一つの関数として生成し、非同期実行する。
 */
'use strict';
import { NakoSyntaxError, NakoError, NakoRuntimeError } from './nako_errors.mjs';
import nakoVersion from './nako_version.mjs';
import { NakoGen } from './nako_gen.mjs';
/**
 * @typedef {import("./nako3").Ast} Ast
 */
/**
 * なでしこのインタプリタコード
 */
const NakoCodeNop = 'NOP';
const NakoCodeLabel = 'LBL';
const NakoCodeEOL = 'EOL';
const NakoCodeJump = 'JMP'; // JUMP addr
const NakoCodeJumpIfTrue = 'JMP_T'; // pop and jump addr
const NakoCodeJumpIfFalse = 'JMP_F'; // pop and jump addr
const NakoCodeCall = 'CALL'; // call addr
const NakoCodeCallObj = 'CALL_OBJ'; // call addr
const NakoCodeReturn = 'RET';
const NakoCodeTry = 'TRY';
const NakoCodeCode = 'CODE';
const NakoCodeTagIsFuncpoint = 0x0F;
/**
 * なでしこのインタプリタが用いる簡易コードを表現するクラス
 */
class NakoCode {
    /**
     * @param {string} type
     * @param {string} value
     */
    constructor(type, value) {
        /** Codeのタイプ
         * @type {string}
         */
        this.type = type;
        /** Codeの値 / ラベルならラベル名
         * @type {string}
         */
        this.value = value;
        /** ラベルならジャンプ先
         * @type {number}
         */
        this.no = -1;
        /** タグ
         * @type {number}
         */
        this.tag = 0;
    }
}
/**
 * 構文木からJSのコードを生成するクラス
 */
export class NakoGenASync {
    /**
     * @param {import('./nako3')} com
     * @param {Ast} ast
     * @param {boolean | string} isTest 文字列なら1つのテストだけを実行する
     */
    static generate(com, ast, isTest) {
        const gen = new NakoGenASync(com);
        // ユーザー定義関数をシステムに登録する
        gen.registerFunction(ast);
        // JSコードを生成する
        let js = gen.convGen(ast, !!isTest);
        // JSコードを実行するための事前ヘッダ部分の生成
        js = gen.getDefFuncCode(isTest) + js;
        com.logger.trace('--- generate(非同期モード) ---\n' + js);
        // テストの実行
        if (js && isTest) {
            js += '\n__self._runTests(__tests);\n';
        }
        return {
            // なでしこの実行環境ありの場合
            runtimeEnv: js,
            // JavaScript単体で動かす場合
            standalone: `\
const nakoVersion = ${JSON.stringify(nakoVersion)};
${NakoError.toString()}
${NakoRuntimeError.toString()}
this.logger = {
  error(message) { console.error(message) },
  send(level, message) { console.log(message) },
};
this.__varslist = [{}, {}, {}];
this.__vars = this.__varslist[2];
this.__module = {};
this.__locals = {};
this.__labels = {};
this.__code = [];
this.__callstack = [];
this.__stack = [];
this.__genMode = '非同期モード';
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
            gen // コード生成に使ったNakoGenのインスタンス
        };
    }
    /**
     * @param {import('./nako3')} com コンパイラのインスタンス
     */
    constructor(com) {
        /**
         * 出力するJavaScriptコードのヘッダー部分で定義する必要のある関数。fnはjsのコード。
         * プラグイン関数は含まれない。
         */
        this.nako_func = { ...com.nako_func };
        /**
         * なでしこで定義したテストの一覧
         * @type {Record<string, { josi: string[][], fn: string, type: 'test_func' }>}
         */
        this.nako_test = {};
        /**
         * プログラム内で参照された関数のリスト。プラグインの命令を含む。
         * JavaScript単体で実行するとき、このリストにある関数の定義をJavaScriptコードの先頭に付け足す。
         * @type {Set<string>}
         */
        this.used_func = new Set();
        /**
         * ループ時の一時変数が被らないようにIDで管理
         * @type {number}
         */
        this.loopId = 1;
        /**
         * 変換中の処理が、ループの中かどうかを判定する
         * @type {boolean}
         */
        this.flagLoop = false;
        /**
         * 変換後のコード管理番号
         * @type {number}
         */
        this.codeId = 0;
        /**
         * 変換後のコードを保持する配列
         * @type {Array<NakoCode>}
         */
        this.codeArray = [];
        /** @type {NakoCode | null} */
        this.labelContinue = null;
        /** @type {NakoCode | null} */
        this.labelBreak = null;
        /**
         * ジャンプ先を表現するラベル
         * @type {Object<string, number>}
         */
        this.labels = {};
        // コンパイラのインスタンス
        this.__self = com;
        /**
         * コードジェネレータの種類
         * @type {string}
         */
        this.genMode = '非同期モード';
        /**
         * 行番号とファイル名が分かるときは `l123:main.nako3`、行番号だけ分かるときは `l123`、そうでなければ任意の文字列。
         * @type {string | null}
         */
        this.lastLineNo = null;
        /**
         * スタック
         * @type {{ isFunction: boolean, names: Set<string>, readonly: Set<string> }[]}
         */
        this.varslistSet = com.__varslist.map((v) => ({ isFunction: false, names: new Set(Object.keys(v)), readonly: new Set() }));
        /**
         * スタックトップ
         * @type {{ isFunction: boolean, names: Set<string>, readonly: Set<string> }}
         */
        this.varsSet = { isFunction: false, names: new Set(), readonly: new Set() };
        this.varslistSet[2] = this.varsSet;
        // 1以上のとき高速化する。
        // 実行速度優先ブロック内で1増える。
        this.speedMode = {
            lineNumbers: 0,
            implicitTypeCasting: 0,
            invalidSore: 0,
            forcePure: 0 // 全てのシステム命令をpureとして扱う。命令からローカル変数への参照が出来なくなる。
        };
        // 1以上のとき測定をinjectする。
        // パフォーマンスモニタのブロック内で1増える。
        this.performanceMonitor = {
            userFunction: 0,
            systemFunction: 0,
            systemFunctionBody: 0 // システム関数(呼び出しコードを除く)
        };
    }
    /**
     * @param {import("./nako3").Ast} node
     * @param {boolean} forceUpdate
     */
    convLineno(node, forceUpdate) {
        if (this.speedMode.lineNumbers > 0) {
            return '';
        }
        /** @type {string} */
        let lineNo;
        if (typeof node.line !== 'number') {
            lineNo = 'unknown';
        }
        else if (typeof node.file !== 'string') {
            lineNo = `l${node.line}`;
        }
        else {
            lineNo = `l${node.line}:${node.file}`;
        }
        // 強制的に行番号をアップデートするか
        if (!forceUpdate) {
            if (lineNo === this.lastLineNo) {
                return '';
            }
            this.lastLineNo = lineNo;
        }
        // 例: __v0.line='l1:main.nako3'
        return `__v0.line=${JSON.stringify(lineNo)};`;
    }
    /**
     * ローカル変数のJavaScriptコードを生成する。
     * 基本的に取得のために利用
     * @param {string} name
     */
    varname(name) {
        const keys = JSON.stringify(name);
        return `sys.__vars[${keys}]`;
    }
    /**
     * プログラムの実行に必要な関数を書き出す(システム領域)
     * @returns {string}
     */
    getVarsCode() {
        let code = '';
        // プログラム中で使った関数を列挙して書き出す
        for (const key of Array.from(this.used_func.values())) {
            const f = this.__self.__varslist[0][key];
            const name = `this.__varslist[0]["${key}"]`;
            if (typeof (f) === 'function') {
                code += name + '=' + f.toString() + ';\n';
            }
            else {
                code += name + '=' + JSON.stringify(f) + ';\n';
            }
        }
        return code;
    }
    /**
     * プログラムの実行に必要な関数定義を書き出す(グローバル領域)
     * convGenの結果を利用するため、convGenの後に呼び出すこと。
     * @param {boolean | string} isTest テストかどうか。stringの場合は1つのテストのみ。
     * @returns {string}
     */
    getDefFuncCode(isTest) {
        let code = '';
        // よく使う変数のショートカット
        code += 'const __self = this.__self = this;\n';
        code += 'const __varslist = this.__varslist;\n';
        code += 'const __module = this.__module;\n';
        code += 'const __v0 = this.__v0 = this.__varslist[0];\n';
        code += 'const __v1 = this.__v1 = this.__varslist[1];\n';
        code += 'const __vars = this.__vars = this.__varslist[2];\n';
        code += 'const __code = this.__code;\n';
        // なでしこの関数定義を行う
        let nakoFuncCode = '';
        for (const key in this.nako_func) {
            const f = this.nako_func[key].fn;
            nakoFuncCode += '' +
                `//[DEF_FUNC name='${key}']\n` +
                `__v1["${key}"]=${f};\n;` +
                `//[/DEF_FUNC name='${key}']\n`;
        }
        if (nakoFuncCode !== '') {
            code += '__v0.line=\'関数の定義\';\n' + nakoFuncCode;
        }
        // プラグインの初期化関数を実行する
        let pluginCode = '';
        for (const name in this.__self.__module) {
            const initkey = `!${name}:初期化`;
            if (this.varslistSet[0].names.has(initkey)) {
                this.used_func.add(`!${name}:初期化`);
                pluginCode += `__v0["!${name}:初期化"](__self);\n`;
            }
        }
        if (pluginCode !== '') {
            code += '__v0.line=\'プラグインの初期化\';\n' + pluginCode;
        }
        // テストの定義を行う
        if (isTest) {
            let testCode = 'const __tests = [];\n';
            for (const key in this.nako_test) {
                if (isTest === true || (typeof isTest === 'string' && isTest === key)) {
                    const f = this.nako_test[key].fn;
                    testCode += `${f};\n;`;
                }
            }
            if (testCode !== '') {
                code += '__v0.line=\'テストの定義\';\n';
                code += testCode + '\n';
            }
        }
        return code;
    }
    /**
     * プラグイン・オブジェクトを追加
     * @param po プラグイン・オブジェクト
     */
    addPlugin(po) {
        return this.__self.addPlugin(po);
    }
    /**
     * プラグイン・オブジェクトを追加(ブラウザ向け)
     * @param name オブジェクト名
     * @param po 関数リスト
     */
    addPluginObject(name, po) {
        this.__self.addPluginObject(name, po);
    }
    /**
     * プラグイン・ファイルを追加(Node.js向け)
     * @param objName オブジェクト名
     * @param path ファイルパス
     * @param po 登録するオブジェクト
     */
    addPluginFile(objName, path, po) {
        this.__self.addPluginFile(objName, path, po);
    }
    /**
     * 関数を追加する
     * @param key 関数名
     * @param josi 助詞
     * @param fn 関数
     */
    addFunc(key, josi, fn) {
        this.__self.addFunc(key, josi, fn);
    }
    /**
     * 関数をセットする
     * @param key 関数名
     * @param fn 関数
     */
    setFunc(key, fn) {
        this.__self.setFunc(key, fn);
    }
    /**
     * プラグイン関数を参照する
     * @param key プラグイン関数の関数名
     * @returns プラグイン・オブジェクト
     */
    getFunc(key) {
        return this.__self.getFunc(key);
    }
    /**
     * 関数を先に登録してしまう
     */
    registerFunction(ast) {
        if (ast.type !== 'block') {
            throw NakoSyntaxError.fromNode('構文解析に失敗しています。構文は必ずblockが先頭になります', ast);
        }
        const registFunc = (node) => {
            for (let i = 0; i < node.block.length; i++) {
                const t = node.block[i];
                if (t.type === 'def_func') {
                    const name = t.name.value;
                    this.used_func.add(name);
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    this.__self.__varslist[1][name] = function () { }; // 事前に適当な値を設定
                    this.nako_func[name] = {
                        josi: t.name.meta.josi,
                        fn: '',
                        type: 'func'
                    };
                }
                else if (t.type === 'speed_mode') {
                    if (t.block.type === 'block') {
                        registFunc(t.block);
                    }
                    else {
                        registFunc(t);
                    }
                }
                else if (t.type === 'performance_monitor') {
                    if (t.block.type === 'block') {
                        registFunc(t.block);
                    }
                    else {
                        registFunc(t);
                    }
                }
            }
        };
        registFunc(ast);
        // __self.__varslistの変更を反映
        const initialNames = new Set();
        if (this.speedMode.invalidSore === 0) {
            initialNames.add('それ');
        }
        this.varsSet = { isFunction: false, names: initialNames, readonly: new Set() };
        this.varslistSet = this.__self.__varslist.map((v) => ({ isFunction: false, names: new Set(Object.keys(v)), readonly: new Set() }));
        this.varslistSet[2] = this.varsSet;
    }
    /**
     * @param {Ast} node
     * @param {boolean} isTest
     */
    convGen(node, isTest) {
        // convert
        this._convGen(node, true);
        // ラベルアドレスの解決が必要なコード一覧
        const needToFixAddr = new Set([
            NakoCodeJump, NakoCodeJumpIfTrue, NakoCodeJumpIfFalse, NakoCodeCall, NakoCodeTry
        ]);
        // コードの最適化をするか?
        const optimization = true;
        let codes = this.codeArray;
        //
        if (optimization) {
            // NOPを削除
            codes = codes.filter(code => {
                return code.type !== NakoCodeNop;
            });
            // 未参照のラベルを探す - ただし関数呼び出しは削除しない
            const usedLabels = new Set();
            codes.forEach((code, index, list) => {
                if (needToFixAddr.has(code.type)) {
                    usedLabels.add(code.value);
                }
            });
            // 未参照のラベルを削除
            codes = codes.filter((code, index) => {
                if (code.type !== NakoCodeLabel) {
                    return true;
                }
                if (code.tag === NakoCodeTagIsFuncpoint) {
                    return true;
                }
                return usedLabels.has(code.value);
            });
            // EOLが連続していたら削除する
            let i = 0;
            while (i < codes.length - 1) {
                if (codes[i].type === NakoCodeEOL && codes[i + 1].type === NakoCodeEOL) {
                    codes.splice(i + 1, 1);
                    continue;
                }
                i++;
            }
            this.codeArray = codes;
        }
        // ラベルアドレスの解決
        codes.forEach((code, index) => {
            if (code.type === NakoCodeLabel) {
                this.labels[code.value] = index;
            }
        });
        codes.forEach((code) => {
            if (needToFixAddr.has(code.type)) {
                if (code.no < 0) {
                    code.no = this.labels[code.value];
                }
            }
        });
        let result = '';
        // コードの生成
        codes.forEach((code, index) => {
            switch (code.type) {
                case NakoCodeNop:
                    result += `case ${index}: break; // [NOP] ${code.value}\n`;
                    break;
                case NakoCodeLabel:
                    result += `case ${index}: break; // [LABEL] ${code.value}\n`;
                    break;
                case NakoCodeEOL:
                    result += `case ${index}: ${code.value}; break; // [EOL]\n`;
                    break;
                case NakoCodeJump:
                    result += `case ${index}: sys.nextIndex = ${code.no}; break; // ${code.value}\n`;
                    break;
                case NakoCodeJumpIfTrue:
                    result += `case ${index}: if (sys.__stack.pop()) { sys.nextIndex = ${code.no};} break; // ${code.value}\n`;
                    break;
                case NakoCodeJumpIfFalse:
                    result += `case ${index}: if (!sys.__stack.pop()) { sys.nextIndex = ${code.no}} break; // ${code.value}\n`;
                    break;
                case NakoCodeReturn:
                    result += `case ${index}: sys.__return(sys); break;\n`;
                    break;
                case NakoCodeCall:
                    result += `case ${index}: sys.__call(${code.no}, sys); break; // ${code.value}\n`;
                    break;
                case NakoCodeCallObj:
                    result += `case ${index}: sys.__callObj('${code.value}', ${index}, sys); break; // ${code.value}\n`;
                    break;
                case NakoCodeTry:
                    result += `case ${index}: sys.tryIndex = ${code.no}; break; // TRY \n`;
                    break;
                case NakoCodeCode:
                    {
                        // trim last
                        const s = code.value.replace(/\s+$/, '');
                        result += `case ${index}: {\n${s}\n};break;\n`;
                        break;
                    }
                default:
                    throw new Error('invalid code type');
            }
        });
        result = `
    //-------------------------
    // main_code
    this.__labels = ${JSON.stringify(this.labels)};
    this.nextAsync = (sys) => {
      if (sys.index >= sys.codeSize || sys.index < 0) {return}
      const __v0 = sys.__v0
      try {
        sys.inLoop = true
        while (sys.index < sys.codeSize && sys.index >= 0) {
          // console.log('@@[run]', sys.index)
          switch (sys.index) {
            // --- CODE.BEGIN ---
            ${result}
            // --- CODE.END ---
            default:
              sys.inLoop = false
              console.log(sys.index, sys.__stack)
              throw new Error('Invalid sys.index:' + sys.index)
              break
          }
          // check next
          if (sys.nextIndex >= 0) {
            sys.index = sys.nextIndex
            sys.nextIndex = -1
          } else {
            sys.index++
          }
          if (sys.async) {
            sys.__saveSysenv(sys)
            sys.async = false
            break
          }
        } // end of while
        sys.inLoop = false
      } catch (e) {
        sys.__errorAsync(e, sys)
      }
    }
    this.__errorAsync = (e, sys) => { // エラーが起きた時呼び出す
      sys.__v0["エラーメッセージ"] = e.message;
      if (e.message == '__終わる__') {
        sys.__stopAsync(sys)
        return
      }
      if (sys.tryIndex >= 0) {
        sys.index = sys.tryIndex;
        setTimeout(() => {sys.nextAsync(sys)}, 1)
      } else {
        throw e
      }
    }
    this.__call = (no, sys) => {
      const info = {lastVars:sys.__vars, backNo: this.index + 1}
      sys.__callstack.push(info);
      sys.__vars = {"それ":""}
      sys.__varslist.push(sys.__vars)
      sys.nextIndex = no;
    }
    this.__return = sys => {
      if (sys.__callstack.length === 0) {
        sys.__destroySysenv(sys, sys.curSysenv.envid)
        sys.index = -2
        sys.nextIndex = -1
        return
      }
      const sore = sys.__vars['それ'];
      sys.__varslist.pop();
      const info = sys.__callstack.pop();
      sys.nextIndex = info.backNo;
      sys.__vars = info.lastVars;
      sys.__vars['それ'] = sore
      sys.__stack.push(sore);
    }
    this.__resetAsync = sys => {
      sys.index = 0
      sys.codeSize = ${codes.length};
      sys.async = false
      sys.nextIndex = -1
      sys.tryIndex = -1
    }
    this.__stopAsync = sys => {
      sys.__resetAsync(sys)
      sys.index = -1 // force stop!!
    }
    this.__callNakoCode = (no, backNo, sys) => {
      this.__call(backNo, sys)
      sys.nextIndex = no
      const sysenv = sys.setAsync(sys)
      setTimeout(() => {
        // console.log('//__callNakoCode, back=', backNo, 'no=', no)
        sys.compAsync(sys, sysenv)
      } ,1)
    }
    this.__callNakoCodeEntry = (no, sys) => {
      sys.__saveSysenv(sys)
      sys.curSysenv = sys.__generateSysenv(sys)
      sys.__restoreSysenv(sys)
      sys.__vars = {"それ":""}
      sys.__varslist.push(sys.__vars)
      sys.index = no;
      sys.nextAsync(sys)
    }
    this.__callObj = (vname, curNo, sys) => {
      if (sys.__vars[vname]) {
        const fname = sys.__vars[vname]
        // console.log(sys.__labels)
        if (fname && sys.__labels[fname]) {
          const no = sys.__labels[fname]
          sys.__call(no, sys)
          return
        } else {
          console.log('vname=', vname, 'label=', fname)
        }
      }
      throw new Error('async error in __callObj::', vname)
    }
    this.__generateSysenv = sys => {
      sys.envid = ( sys.envid == null ? 0 : sys.envid ) + 1
      const sysenv = {
        callstack: [],
        varstack: [],
        varslist: [sys.__varslist[0], sys.__varslist[1], sys.__varslist[2]],
        index: -1,
        nextIndex: -1,
        tryIndex: -1,
        envid: sys.envid
      }
      sysenv.vars = sysenv.varslist[2]
      if (sys.sysenvs == null) { sys.sysenvs={} }
      sys.sysenvs[sys.envid] = sysenv
      // console.log('generete envid '+sys.envid)
      return sysenv
    }
    this.__destroySysenv = (sys, envid) => {
      delete sys.sysenvs[envid]
      // console.log('destroy envid '+envid)
    }
    this.__saveSysenv = sys => {
      const sysenv = sys.curSysenv
      sysenv.callstack = sys.__callstack
      sysenv.varstack = sys.__stack
      sysenv.varslist = sys.__varslist
      sysenv.vars = sys.__vars
      sysenv.index = sys.index
      sysenv.nextIndex = sys.nextIndex
      sysenv.tryIndex = sys.tryIndex
    }
    this.__restoreSysenv = sys => {
      const sysenv = sys.curSysenv
      sys.__callstack = sysenv.callstack
      sys.__stack = sysenv.varstack
      sys.__varslist = sysenv.varslist
      sys.__vars = sysenv.vars
      ___vars = sys.__vars
      sys.index = sysenv.index
      sys.nextIndex = sysenv.nextIndex
      sys.tryIndex = sysenv.tryIndex
    }
    this.setAsync = sys => {
      sys.async = true
      return sys.curSysenv
    }
    this.compAsync = (sys,sysenv) => {
      if (sys.async && sys.curSysenv != null && sysenv != null && sys.curSysenv.envid === sysenv.envid) {
        sys.async = false
      } else {
        if (sys.curSysenv == null || sysenv == null || sys.curSysenv.envid !== sysenv.envid) {
          sys.__saveSysenv(sys)
          const envid = sys.curSysenv.envid
          sys.curSysenv = sysenv
          sys.__restoreSysenv(sys)
          // console.log('switch envid '+envid+' to '+sys.curSysenv.envid)
        }
        sys.nextAsync(sys)
      }
    }

    this.__resetAsync(this)
    this.curSysenv = this.__generateSysenv(this)
    this.nextAsync(this)
    //-------------------------
    `;
        if (isTest) {
            return '';
        }
        else {
            return result;
        }
    }
    /**
     * @param {Ast} node
     * @param {boolean} isExpression
     */
    _convGen(node, isExpression) {
        let code = '';
        if (node instanceof Array) {
            for (let i = 0; i < node.length; i++) {
                const n = node[i];
                code += this._convGen(n, isExpression);
            }
            return code;
        }
        if (node === null) {
            return 'null';
        }
        if (node === undefined) {
            return 'undefined';
        }
        if (typeof (node) !== 'object') {
            return '' + node;
        }
        // switch
        switch (node.type) {
            // === NOP ===
            case 'nop':
                break;
            case 'comment':
                if (!node.value) {
                    node.value = '';
                }
                this.addCode(new NakoCode(NakoCodeNop, node.value));
                break;
            case 'eol':
                this.addCode(new NakoCode(NakoCodeEOL, this.convLineno(node, true)));
                break;
            // === 単純なコード変換 ===
            case 'number':
                this.addCodeStr(`sys.__stack.push(${node.value});//number`);
                break;
            case 'string':
                this.convString(node);
                break;
            case 'word':
            case 'variable':
                this.convGetVar(node);
                break;
            case 'op':
            case 'calc':
                this.convOp(node);
                break;
            case 'renbun':
                this.convRenbun(node);
                break;
            case 'not':
                this._convGen(node.value, true);
                this.addCodeStr('if (sys.__stack.length==0) throw new Error(\'NOTでスタックに値がありません\');' +
                    'sys.__stack[sys.__stack.length-1] = (sys.__stack[sys.__stack.length-1]) ? 0:1');
                break;
            case '配列参照':
                this.convRefArray(node);
                break;
            case 'json_array':
                this.convJsonArray(node);
                break;
            case 'json_obj':
                this.convJsonObj(node);
                break;
            case 'bool':
                {
                    const b = (node.value) ? 'true' : 'false';
                    this.addCodeStr(`sys.__stack.push(${b})`);
                    break;
                }
            case 'null':
                this.addCodeStr('sys.__stack.push(null)');
                break;
            case 'func':
            case 'func_pointer':
            case 'calc_func':
                this.convFunc(node, isExpression); // 関数の呼び出し
                break;
            // === 文の変換 ===
            case 'let':
                this.convLet(node);
                break;
            case 'let_array':
                this.convLetArray(node);
                break;
            case 'block':
                for (let i = 0; i < node.block.length; i++) {
                    const b = node.block[i];
                    this._convGen(b, false);
                }
                break;
            case 'if':
                this.convIf(node);
                break;
            case 'repeat_times':
                this.convRepeatTimes(node);
                break;
            case 'break':
                this.addCodeStr(this.convCheckLoop(node, 'break'));
                break;
            case 'continue':
                this.addCodeStr(this.convCheckLoop(node, 'continue'));
                break;
            case 'for':
                this.convFor(node);
                break;
            case 'foreach':
                this.convForeach(node);
                break;
            case 'while':
                this.convWhile(node);
                break;
            case 'switch':
                this.convSwitch(node);
                break;
            case 'return':
                this.convReturn(node);
                break;
            case 'end':
                code += this.addCodeStr('__varslist[0][\'終\']();');
                break;
            case 'def_local_var':
                this.convDefLocalVar(node);
                break;
            case 'def_local_varlist':
                code += this.addCodeStr(this.convDefLocalVarlist(node));
                break;
            case 'tikuji':
                throw NakoSyntaxError.fromNode('「逐次実行」構文は「!非同期モード」では使えません。', node);
            case 'speed_mode':
                throw NakoSyntaxError.fromNode('「速度有線」構文は「!非同期モード」では使えません。', node);
            case 'performance_monitor':
                this.convPerformanceMonitor(node, isExpression);
                break;
            case 'func_obj':
                this.convFuncObj(node);
                break;
            case 'def_test':
                this.convDefTest(node);
                break;
            case 'def_func':
                code += this.addCodeStr(this.convDefFunc(node));
                break;
            // TODO
            case 'try_except':
                code += this.convTryExcept(node);
                break;
            case 'require':
                this.addCodeStr(NakoGen.convRequire(node));
                break;
            default:
                throw new Error('System Error: unknown_type=' + node.type);
        }
        return code;
    }
    /**
     * add code to array
     * @param {string} codeStr
     * @returns {string}
     */
    addCodeStr(codeStr) {
        if (codeStr === '') {
            return '';
        }
        const a = codeStr.split('\n');
        const a2 = a.map(row => '  ' + row.replace(/\s+$/, ''));
        const c = new NakoCode(NakoCodeCode, a2.join('\n'));
        return this.addCode(c);
    }
    /**
     * add code to array
     * @param {NakoCode} code
     * @returns {string}
     */
    addCode(code) {
        this.codeArray[this.codeId] = code;
        this.codeId++;
        return '';
    }
    /**
     * make label for jump
     * @param {string} name
     * @returns {NakoCode}
     */
    makeLabel(name) {
        const uniqLabel = name + '_' + (this.loopId++);
        return this.makeLabelDirectly(uniqLabel);
    }
    /**
     * make label for function
     * @param {string} labelName
     * @returns {NakoCode}
     */
    makeLabelDirectly(labelName) {
        const c = new NakoCode(NakoCodeLabel, labelName);
        this.labels[labelName] = -1;
        return c;
    }
    /**
     * make Jump
     * @param {NakoCode} label
     * @returns {NakoCode}
     */
    makeJump(label) {
        return new NakoCode(NakoCodeJump, label.value);
    }
    /**
     * make Jump if true
     * @param {NakoCode} label
     * @returns {NakoCode}
     */
    makeJumpIfTrue(label) {
        return new NakoCode(NakoCodeJumpIfTrue, label.value);
    }
    /**
     * make Jump if false
     * @param {NakoCode} label
     * @returns {NakoCode}
     */
    makeJumpIfFalse(label) {
        return new NakoCode(NakoCodeJumpIfFalse, label.value);
    }
    /**
     * @param {Ast} node
     */
    convIf(node) {
        const labelBegin = this.makeLabel('もし:ここから');
        const labelEnd = this.makeLabel('もし:ここまで');
        const labelIfFalse = this.makeLabel('もし:違えば');
        //
        this.addCode(labelBegin);
        this._convGen(node.expr, true);
        this.addCode(this.makeJumpIfFalse(labelIfFalse));
        this._convGen(node.block, false);
        this.addCode(this.makeJump(labelEnd));
        this.addCode(labelIfFalse);
        if (node.false_block) {
            this._convGen(node.false_block, false);
        }
        this.addCode(labelEnd);
        return '';
    }
    convRepeatTimes(node) {
        this.flagLoop = true;
        this.varsSet.names.add('回数');
        this.varsSet.readonly.add('回数');
        // ループ管理変数を作成
        const loopVar = `sys.__tmp_i${this.loopId}`;
        this.loopId++;
        // ループ回数を取得
        const loopCount = `sys.__tmp_count${this.loopId}`;
        this.loopId++;
        this._convGen(node.value, true);
        this.addCodeStr(`${loopCount} = sys.__stack.pop(); ${loopVar} = 0;`);
        const labelCheck = this.makeLabel('回:条件チェック');
        this.addCode(labelCheck);
        const labelEnd = this.makeLabel('回:ここまで');
        this.labelBreak = labelEnd;
        this.labelContinue = labelCheck;
        // 繰り返し判定
        const kaisu = 'sys.__vars["回数"]';
        const cond = `${kaisu} = ++${loopVar}\n` +
            `sys.__stack.push(${loopVar} > ${loopCount})\n`;
        this.addCodeStr(cond);
        this.addCode(this.makeJumpIfTrue(labelEnd));
        this.convGenLoop(node.block); // read block
        this.addCode(this.makeJump(labelCheck));
        this.addCode(labelEnd);
        this.flagLoop = false;
        return '';
    }
    /**
     * @param {string} name
     * @returns {{i: number, name: string, isTop: boolean, js: string} | null}
     */
    findVar(name) {
        // __vars ? (ローカル変数)
        if (this.varsSet.names.has(name)) {
            return { i: this.varslistSet.length - 1, name, isTop: true, js: `sys.__vars[${JSON.stringify(name)}]` };
        }
        // __varslist ?
        for (let i = 2; i >= 0; i--) {
            if (this.varslistSet[i].names.has(name)) {
                return { i, name, isTop: false, js: `sys.__varslist[${i}][${JSON.stringify(name)}]` };
            }
        }
        return null;
    }
    /**
     * 定義済みの変数の参照
     * @param {string} name
     * @param {Ast} position
     */
    genVar(name, position) {
        const res = this.findVar(name);
        const lno = position.line;
        if (res === null) {
            // 定義されていない名前の参照は変数の定義とみなす。
            // 多くの場合はundefined値を持つ変数であり分かりづらいバグを引き起こすが、
            // 「ナデシコする」などの命令の中で定義された変数の参照の場合があるため警告に留める。
            // ただし、自動的に定義される変数『引数』『それ』などは例外 #952
            if (name === '引数' || name === 'それ' || name === '対象' || name === '対象キー' || name === '回数') {
                // デフォルト定義されている変数名
            }
            else {
                this.__self.logger.warn(`変数『${name}』は定義されていません。`, position);
            }
            this.varsSet.names.add(name);
            return this.varname(name);
        }
        const i = res.i;
        // システム関数・変数の場合
        if (i === 0) {
            const pv = this.__self.funclist[name];
            if (!pv) {
                return `${res.js}/*err:${lno}*/`;
            }
            if (pv.type === 'const' || pv.type === 'var') {
                return res.js;
            }
            if (pv.type === 'func') {
                if (pv.josi.length === 0) {
                    return `(${res.js}())`;
                }
                throw NakoSyntaxError.fromNode(`『${name}』が複文で使われました。単文で記述してください。(v1非互換)`, position);
            }
            throw NakoSyntaxError.fromNode(`『${name}』は関数であり参照できません。`, position);
        }
        return res.js;
    }
    convGetVar(node) {
        const name = node.value;
        let varName = `sys.__vars[${JSON.stringify(name)}]`;
        const o = this.findVar(name);
        if (o != null) {
            varName = o.js;
        }
        this.addCodeStr(`sys.__stack.push(${varName});`);
    }
    convComment(node) {
        let commentSrc = String(node.value);
        commentSrc = commentSrc.replace(/\n/g, '¶');
        const lineNo = this.convLineno(node, false);
        if (commentSrc === '' && lineNo === '') {
            return ';';
        }
        if (commentSrc === '') {
            return ';' + lineNo + '\n';
        }
        return ';' + lineNo + '//' + commentSrc + '\n';
    }
    convReturn(node) {
        // 関数の中であれば利用可能
        if (this.varsSet.names.has('!関数')) {
            throw NakoSyntaxError.fromNode('『戻る』がありますが、関数定義内のみで使用可能です。', node);
        }
        if (node.value) {
            this._convGen(node.value, true);
            this.addCodeStr('sys.__vars["それ"] = sys.__stack.pop()');
        }
        this.addCode(new NakoCode(NakoCodeReturn, ''));
        return '';
    }
    convCheckLoop(node, cmd) {
        // ループの中であれば利用可能
        if (!this.flagLoop) {
            const cmdj = (cmd === 'continue') ? '続ける' : '抜ける';
            throw NakoSyntaxError.fromNode(`『${cmdj}』文がありますが、それは繰り返しの中で利用してください。`, node);
        }
        if (cmd === 'continue') {
            if (this.labelContinue) {
                this.addCode(this.makeJump(this.labelContinue));
            }
        }
        else {
            if (this.labelBreak) {
                this.addCode(this.makeJump(this.labelBreak));
            }
        }
        return '';
    }
    convDefFuncCommon(node, name) {
        // deffunc_code
        const isMumeiFunc = (name === '');
        let funcName = name;
        if (isMumeiFunc) {
            funcName = `無名関数:${this.loopId++}`;
        }
        const labelEnd = this.makeLabel(`関数「${funcName}」:ここまで`);
        this.addCode(this.makeJump(labelEnd));
        const labelBegin = this.makeLabelDirectly(funcName);
        labelBegin.tag = NakoCodeTagIsFuncpoint; // 削除対象からはずすため
        this.addCode(labelBegin);
        //
        const initialNames = new Set();
        this.varsSet = { isFunction: true, names: initialNames, readonly: new Set() };
        this.varsSet.names.add('それ');
        // ローカル変数をPUSHする
        this.varslistSet.push(this.varsSet);
        // JSの引数と引数をバインド
        const meta = isMumeiFunc ? node.meta : node.name.meta;
        let code = '';
        let codeCall = '';
        code += `//関数『${funcName}』の初期化処理\n`;
        // 宣言済みの名前を保存
        // const varsDeclared = Array.from(this.varsSet.names.values())
        // 引数をローカル変数に設定 (スタックの末尾から取得する必要があるので、逆順に値を得る)
        code += '// 引数をローカル変数として登録\n';
        for (let i = meta.varnames.length - 1; i >= 0; i--) {
            const word = meta.varnames[i];
            code += `  ${this.varname(word)} = sys.__stack.pop();\n`;
            this.varsSet.names.add(word);
            codeCall += ''; //  sys.__stack.push(arguments[${i}]);\n
        }
        code += '// ここまで:引数をローカル変数として登録\n';
        this.addCodeStr(code);
        // 関数定義は、グローバル領域で。
        this.used_func.add(funcName);
        this.varslistSet[1].names.add(funcName);
        this.nako_func[funcName] = {
            josi: meta.josi,
            fn: '(function(){\n' +
                '  const sys = (arguments.length > 0) ? arguments[arguments.length-1] : {}; \n' +
                '  if (sys.newenv) { \n' +
                '    sys.newenv = false\n' +
                `    sys.__callNakoCodeEntry(sys.__labels['${funcName}'], sys);` + '\n' +
                '  } else {\n' +
                '  ' + codeCall + '\n' +
                `    sys.__callNakoCode(sys.__labels['${funcName}'], sys.nextIndex, sys);` + '\n' +
                '    if (!sys.inLoop) { sys.nextAsync(sys) }\n' +
                '  }  })',
            type: 'func'
        };
        // ブロックを解析
        this._convGen(node.block, false);
        this.varslistSet.pop();
        this.varsSet = this.varslistSet[this.varslistSet.length - 1];
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.__self.__varslist[1][funcName] = function () { };
        this.addCode(new NakoCode(NakoCodeReturn, ''));
        this.addCode(labelEnd);
        // 無名関数の定義であれば無名関数をPUSH
        if (!name) {
            this.addCodeStr(`sys.__stack.push('${funcName}')`);
        }
        return '';
    }
    convDefTest(node) {
        throw NakoSyntaxError.fromNode('テスト構文は!非同期モードでは使えません。', node);
    }
    convDefFunc(node) {
        const name = NakoGen.getFuncName(node.name.value);
        this.convDefFuncCommon(node, name);
        // ★この時点では関数のコードを生成しない★
        // プログラム冒頭でコード生成時に関数定義を行う
        return '';
    }
    convFuncObj(node) {
        return this.convDefFuncCommon(node, '');
    }
    convJsonObj(node) {
        const list = node.value;
        const objName = `sys.__tmp_obj${this.loopId++}`;
        this.addCodeStr(objName + '={}; // convJsonObj::ここから');
        list.forEach((e) => {
            this._convGen(e.value, true);
            this._convGen(e.key, true);
            this.addCodeStr(`${objName}[sys.__stack.pop()]=sys.__stack.pop()`);
        });
        this.addCodeStr(`this.__stack.push(${objName}); delete $objName; // convJsonObj::ここまで`);
        return '';
    }
    convJsonArray(node) {
        const list = node.value;
        this.addCode(this.makeLabel('convJsonArray::ここから'));
        list.forEach(e => this._convGen(e, true));
        const size = list.length;
        this.addCodeStr(`sys.__stack.push(sys.__stack.splice(sys.__stack.length-${size},${size}))`);
        return '';
    }
    convRefArray(node) {
        // 名前をPUSH
        this._convGen(node.name, true);
        const list = node.index;
        for (let i = 0; i < list.length; i++) {
            // push index
            this._convGen(list[i], true);
            // pop index & push value
            this.addCodeStr('const idx = sys.__stack.pop();\n' +
                'const obj = sys.__stack.pop();\n' +
                'sys.__stack.push(obj[idx]);');
        }
        return '';
    }
    convLetArray(node) {
        // 代入する値をPUSH
        this._convGen(node.value, true);
        // 変数を取得
        this._convGen(node.name, true);
        const list = node.index;
        for (let i = 0; i < list.length; i++) {
            this._convGen(list[i], true);
            if (i === list.length - 1) { // 代入
                this.addCodeStr('const idx = this.__stack.pop();' +
                    'const obj = this.__stack.pop();' +
                    'const val = this.__stack.pop();' +
                    'obj[idx]=val;');
                break;
            }
            // index アクセス
            this.addCodeStr('const idx = sys.__stack.pop();\n' +
                'const obj = sys.__stack.pop();\n' +
                'sys.__stack.push(obj[idx]);');
        }
        return '';
    }
    convGenLoop(node) {
        const tmpflag = this.flagLoop;
        this.flagLoop = true;
        try {
            return this._convGen(node, false);
        }
        finally {
            this.flagLoop = tmpflag;
        }
    }
    convFor(node) {
        this.flagLoop = true;
        // ループ変数について
        let word;
        if (node.word !== null) { // ループ変数を使う時
            const varName = node.word.value;
            this.varsSet.names.add(varName);
            word = this.varname(varName);
        }
        else {
            this.varsSet.names.add('dummy');
            word = this.varname('dummy');
        }
        const sore = this.varname('それ');
        const idLoop = this.loopId++;
        const varI = `sys.__tmp__i${idLoop}`;
        // ループ条件を変数に入れる用
        const varTo = `sys.__tmp__to${idLoop}`;
        // ループ条件を確認
        this._convGen(node.from, true);
        this._convGen(node.to, true);
        this.addCodeStr(`${varTo}=sys.__stack.pop();${varI}=sys.__stack.pop();`);
        // ループ変数を初期化
        this.addCodeStr(`${sore} = ${word} = ${varI}`);
        // 繰り返し判定
        const labelCheck = this.makeLabel('繰返:条件確認');
        const labelInc = this.makeLabel('繰返:加算');
        this.addCode(labelCheck);
        const labelEnd = this.makeLabel('繰返:ここまで');
        this.addCodeStr(`sys.__stack.push(${word} <= ${varTo})`);
        this.addCode(this.makeJumpIfFalse(labelEnd));
        this.labelContinue = labelInc;
        this.labelBreak = labelEnd;
        // ループ内のブロック内容を得る
        this.convGenLoop(node.block); // block
        this.addCode(labelInc);
        this.addCodeStr(`${sore} = ++${word};`);
        this.addCode(this.makeJump(labelCheck));
        this.addCode(labelEnd);
        this.addCodeStr(`delete ${varI};delete ${varTo};//繰返:掃除`);
        this.flagLoop = false;
        return '';
    }
    convForeach(node) {
        this.flagLoop = true;
        // 対象を用意する
        let taisyo = '__v0["対象"]';
        const taisyoKey = '__v0["対象キー"]';
        if (node.name) {
            taisyo = this.varname(node.name.value);
            this.varsSet.names.add(node.name.value);
        }
        // 反復対象を調べる
        const target = node.target;
        if (target === null) {
            throw NakoSyntaxError.fromNode('『反復』の対象がありません。', node);
        }
        const sore = this.varname('それ');
        const targetArray = `sys.__tmp__target${this.loopId++}`;
        const targetKeys = `sys.__tmp__keys${this.loopId++}`;
        const loopVar = `sys.__tmp__i${this.loopId++}`;
        const loopCount = `sys.__tmp__count${this.loopId++}`;
        // 反復対象を評価
        this._convGen(node.target, true);
        // どのように反復するか判定
        const initCode = '// 反復: 初期化\n' +
            `${targetArray} = sys.__stack.pop();\n` +
            `${loopVar} = 0;\n` +
            // 文字列や数値なら反復できるように配列に入れる
            `if (typeof(${targetArray}) == 'string' || typeof(${targetArray}) == 'number') { ${targetArray} = [${targetArray}]; }\n` +
            // Objectならキー一覧を得る
            `if (${targetArray} instanceof Array) { ${loopCount} = ${targetArray}.length; }\n` +
            'else { // キーの一覧を得る\n' +
            `  ${targetKeys} = Object.keys(${targetArray}); \n` +
            '  // hasOwnPropertyがfalseならばkeyを消す処理\n' +
            `  ${targetKeys} = ${targetKeys}.filter((key)=>{ return ${targetArray}.hasOwnProperty(key) })\n` +
            `  ${loopCount} = ${targetKeys}.length;\n` +
            '}\n';
        this.addCodeStr(initCode);
        const labelCheck = this.makeLabel('反復:条件確認');
        const labelInc = this.makeLabel('反復:加算');
        const labelEnd = this.makeLabel('反復:ここまで');
        this.labelBreak = labelEnd;
        this.labelContinue = labelInc;
        this.addCode(labelCheck);
        const setTarget = `if (${targetArray} instanceof Array) {\n` +
            // eslint-disable-next-line no-irregular-whitespace
            `  ${taisyo} = ${sore} = ${targetArray}[${loopVar}];　${taisyoKey} = ${loopVar};\n` +
            '} else {\n' +
            `  ${taisyoKey} = ${targetKeys}[${loopVar}]; ${taisyo} = ${sore} = ${targetArray}[${taisyoKey}];\n` +
            '}\n';
        this.addCodeStr(`${setTarget}\nsys.__stack.push(${loopVar} < ${loopCount});`);
        this.addCode(this.makeJumpIfFalse(labelEnd));
        // 反復ブロックを定義
        this.convGenLoop(node.block); // block
        // 加算
        this.addCode(labelInc);
        this.addCodeStr(`${loopVar}++`);
        this.addCode(this.makeJump(labelCheck));
        this.addCode(labelEnd);
        this.flagLoop = false;
        return '';
    }
    convWhile(node) {
        this.flagLoop = true;
        const labelBegin = this.makeLabel('間:ここから');
        const labelEnd = this.makeLabel('間:ここまで');
        this.labelContinue = labelBegin;
        this.labelBreak = labelEnd;
        this.addCode(labelBegin);
        // 条件をスタックに
        this._convGen(node.cond, true);
        this.addCode(this.makeJumpIfFalse(labelEnd));
        // ブロックを追加
        this.convGenLoop(node.block);
        this.addCode(this.makeJump(labelBegin));
        this.addCode(labelEnd);
        this.flagLoop = false;
        return '';
    }
    /**
     * @param {Ast} node
     * @param {boolean} isExpression
     */
    convSpeedMode(node, isExpression) {
        return '';
    }
    /**
     * @param {Ast} node
     * @param {boolean} isExpression
     */
    convPerformanceMonitor(node, isExpression) {
        const prev = { ...this.performanceMonitor };
        if (node.options['ユーザ関数']) {
            this.performanceMonitor.userFunction++;
        }
        if (node.options['システム関数本体']) {
            this.performanceMonitor.systemFunctionBody++;
        }
        if (node.options['システム関数']) {
            this.performanceMonitor.systemFunction++;
        }
        this._convGen(node.block, isExpression);
        this.performanceMonitor = prev;
    }
    convSwitch(node) {
        // 値をPUSH
        this._convGen(node.value, true);
        const varValue = `sys.__tmp__i${this.loopId++}`;
        this.addCodeStr(`${varValue} = sys.__stack.pop()`);
        const labelEnd = this.makeLabel('条件分岐:ここまで');
        const cases = node.cases;
        for (let i = 0; i < cases.length; i++) {
            const cvalue = cases[i][0];
            if (cvalue.type === '違えば') {
                this.convGenLoop(cases[i][1]);
            }
            else {
                const nextLabel = this.makeLabel('条件分岐:次');
                this._convGen(cvalue, true);
                this.addCodeStr(`sys.__stack.push(sys.__stack.pop() == ${varValue})`);
                this.addCode(this.makeJumpIfFalse(nextLabel));
                this.convGenLoop(cases[i][1]);
                this.addCode(this.makeJump(labelEnd));
                this.addCode(nextLabel);
            }
        }
        this.addCode(labelEnd);
        this.addCodeStr(`delete ${varValue}//条件分岐:掃除`);
        return '';
    }
    convFuncGetArgsCalcType(funcName, func, node) {
        const opts = {};
        for (let i = 0; i < node.args.length; i++) {
            const arg = node.args[i];
            if (i === 0 && arg === null) {
                this.addCodeStr('sys.__stack.push(sys.__vars[\'それ\'])');
                opts.sore = true;
            }
            else {
                // 関数の引数を評価
                this._convGen(arg, true);
            }
        }
        return opts;
    }
    getPluginList() {
        const r = [];
        for (const name in this.__self.__module) {
            r.push(name);
        }
        return r;
    }
    /**
     * 関数の呼び出し
     * @param {Ast} node
     * @param {boolean} isExpression
     * @returns string コード
     */
    convFunc(node, isExpression) {
        let isJSFunc = false;
        let isMumeiFunc = false;
        const funcName = NakoGen.getFuncName(node.name);
        const res = this.findVar(funcName);
        if (res === null) {
            throw NakoSyntaxError.fromNode(`関数『${funcName}』が見当たりません。有効プラグイン=[` + this.getPluginList().join(', ') + ']', node);
        }
        let func;
        if (res.i === 0) { // plugin function
            func = this.__self.funclist[funcName];
            if (func.type !== 'func') {
                throw NakoSyntaxError.fromNode(`『${funcName}』は関数ではありません。`, node);
            }
            isJSFunc = true;
        }
        else {
            func = this.nako_func[funcName];
            // 無名関数の可能性
            if (func === undefined) {
                isMumeiFunc = true;
                func = { return_none: false };
            }
        }
        // 関数の参照渡しか？
        if (node.type === 'func_pointer') {
            return res.js;
        }
        // 関数の参照渡しでない場合
        // 関数定義より助詞を一つずつ調べる
        const argsOpts = this.convFuncGetArgsCalcType(funcName, func, node);
        // function
        this.used_func.add(funcName);
        let funcBegin = '';
        let funcEnd = '';
        // setter?
        if (node.setter) {
            funcBegin += ';__self.isSetter = true;\n';
            funcEnd += ';__self.isSetter = false;\n';
        }
        // 変数「それ」が補完されていることをヒントとして出力
        if (argsOpts.sore) {
            funcBegin += '/*[sore]*/';
        }
        // 引数をスタックに積む
        const arcCount = node.args.length;
        // 必要な引数分だけスタックから下ろして呼び出す
        let code = '';
        if (isJSFunc) {
            code += funcBegin;
            code += `const args = sys.__stack.splice(sys.__stack.length - ${arcCount}, ${arcCount});\n`;
            // code += `console.log("call:${funcName}", args, 'sys');\n`
            code += 'args.push(sys);\n';
            code += `const ret = ${res.js}.apply(sys, args);\n`;
            if (!func.return_none) {
                code += 'sys.__vars[\'それ\'] = ret;\n';
                if (isExpression) {
                    code += 'sys.__stack.push(ret);\n';
                }
            }
            code += funcEnd;
            this.addCodeStr(code);
        }
        else {
            if (isMumeiFunc) {
                this.addCode(new NakoCode(NakoCodeCallObj, funcName));
            }
            else {
                this.addCode(new NakoCode(NakoCodeCall, funcName));
            }
            if (!isExpression) {
                this.addCodeStr('sys.__stack.pop();// 戻り値を利用しない関数呼出');
            }
        }
    }
    convRenbun(node) {
        this._convGen(node.left, false);
        this._convGen(node.right, true);
    }
    convOp(node) {
        const OP_TBL = {
            '&': '+""+',
            eq: '==',
            noteq: '!=',
            '===': '===',
            '!==': '!==',
            gt: '>',
            lt: '<',
            gteq: '>=',
            lteq: '<=',
            and: '&&',
            or: '||',
            shift_l: '<<',
            shift_r: '>>',
            shift_r0: '>>>',
            '÷': '/'
        };
        const op = node.operator; // 演算子
        // 値はスタックに載せられる
        // left
        this._convGen(node.left, true);
        // right
        this._convGen(node.right, true);
        // calc
        let code = 'const rv = sys.__stack.pop();\n' +
            'const lv = sys.__stack.pop();\n';
        if (op === '^') {
            code += 'const v = (Math.pow(lv, rv))\n';
        }
        else {
            const op2 = OP_TBL[op] || op;
            code += `const v = ((lv) ${op2} (rv));\n`;
        }
        // code += `if (isNaN(v) && '${op}' != '&') { console.log('ERROR:${op}', lv, rv) }\n`
        code += `sys.__stack.push(v); //op:${op}\n`;
        this.addCodeStr(code);
    }
    convLet(node) {
        let code = '';
        // 値をスタックに載せる
        if (node.value === null) {
            // 値が省略されたら「それ」を載せる
            this.addCodeStr('sys.__stack.push(sys.__vars[\'それ\'])');
        }
        else {
            // 値がある場合
            this._convGen(node.value, true);
        }
        // 変数名
        const name = node.name.value;
        const res = this.findVar(name);
        if (res === null) {
            this.varsSet.names.add(name);
            code = `${this.varname(name)}=sys.__stack.pop();`;
        }
        else {
            // 定数ならエラーを出す
            if (this.varslistSet[res.i].readonly.has(name)) {
                throw NakoSyntaxError.fromNode(`定数『${name}』は既に定義済みなので、値を代入することはできません。`, node);
            }
            code = `${res.js}=sys.__stack.pop();`;
        }
        this.addCodeStr(code + '//let');
    }
    convDefLocalVar(node) {
        if (node.value === null) {
            this.addCodeStr('sys.__stack.push(null)');
        }
        else {
            this._convGen(node.value, true);
        }
        const name = node.name.value;
        const vtype = node.vartype; // 変数 or 定数
        // 二重定義？
        if (this.varsSet.names.has(name)) {
            throw NakoSyntaxError.fromNode(`${vtype}『${name}』の二重定義はできません。`, node);
        }
        this.varsSet.names.add(name);
        // 定数?
        if (vtype === '定数') {
            this.varsSet.readonly.add(name);
        }
        this.addCodeStr(`${this.varname(name)}=sys.__stack.pop()`);
        return '';
    }
    // #563 複数変数への代入
    convDefLocalVarlist(node) {
        const vtype = node.vartype; // 変数 or 定数
        if (node.value === null) {
            this.addCodeStr('sys.__stack.push(null)');
        }
        else {
            this._convGen(node.value, true);
        }
        const varI = `sys.__tmp_i${this.loopId}`;
        this.loopId++;
        this.addCodeStr(`${varI}=sys.__stack.pop();if (!(${varI} instanceof Array)) { ${varI}=[${varI}] }`);
        for (const nameObj of node.names) {
            const name = nameObj.value;
            // 二重定義？
            if (this.varsSet.names.has(name)) {
                throw NakoSyntaxError.fromNode(`${vtype}『${name}』の二重定義はできません。`, node);
            }
            //
            this.varsSet.names.add(name);
            if (vtype === '定数') {
                this.varsSet.readonly.add(name);
            }
            const vname = this.varname(name);
            this.addCodeStr(`${vname}=${varI}.pop()`);
        }
        this.addCodeStr(`delete ${varI}//複数代入:掃除`);
        return '';
    }
    convString(node) {
        let value = '' + node.value;
        const mode = node.mode;
        value = value.replace(/\\/g, '\\\\');
        value = value.replace(/"/g, '\\"');
        value = value.replace(/\r/g, '\\r');
        value = value.replace(/\n/g, '\\n');
        if (mode === 'ex') {
            throw new Error('[システムエラー] ジェネレーターでの文字列の展開はサポートしていません');
        }
        this.addCodeStr(`sys.__stack.push("${value}")//string`);
        return '"' + value + '"';
    }
    convTryExcept(node) {
        const labelExcept = this.makeLabel('エラー監視:ならば');
        const labelEnd = this.makeLabel('エラー監視:ここまで');
        // エラーをひっかけるように設定
        this.addCode(new NakoCode(NakoCodeTry, labelExcept.value));
        this._convGen(node.block, false);
        this.addCode(this.makeJump(labelEnd));
        this.addCode(labelExcept);
        this._convGen(node.errBlock, false);
        this.addCode(labelEnd);
    }
}
// ブラウザに登録する
if (typeof (navigator) === 'object' && typeof (navigator.nako3) === 'object') {
    // Webブラウザの場合
    const nako3 = navigator.nako3;
    if (nako3.addCodeGenerator) {
        nako3.addCodeGenerator('非同期モード', NakoGenASync);
    }
}
