//
// nako_gen.js
//
"use strict";

class NakoGenError extends Error {
    constructor(msg, loc) {
        if (loc) {
            msg = "[文法エラー](" + loc.start.line + ":" + loc.start.column + ") " + msg;
        } else {
            msg = "[文法エラー] " + msg;
        }
        super(msg);
    }
}

/**
 * 構文木からJSのコードを生成するクラス
 */
class NakoGen {
    /**
     * @ param com {NakoCompiler} コンパイラのインスタンス
     */
    constructor(com) {
        this.header = this.getHeader();

        /**
         * プラグインで定義された関数の一覧
         * @type {{}}
         */
        this.plugins = {};

        /**
         * 利用可能なプラグイン(ファイル 単位)
         */
        this.pluginfiles = {};

        /**
         * なでしこで定義した関数の一覧
         * @type {{}}
         */
        this.nako_func = {};

        /**
         * JS関数でなでしこ内で利用された関数
         * 利用した関数を個別にJSで定義する
         * (全関数をインクルードしなくても良いように)
         * @type {{}}
         */
        this.used_func = {};

        /** ループ時の一時変数が被らないようにIDで管理 */
        this.loop_id = 1;

        /** それ */
        this.sore = this.varname('それ');

        /**
         * なでしこのローカル変数をスタックで管理
         * __varslist[0] プラグイン領域
         * __varslist[1] なでしこグローバル領域
         * __varslist[2] 最初のローカル変数 ( == __vars }
         */
        this.__varslist = [{}, {}, this.__vars];
        this.__self = com;

        /**
         * なでしこのローカル変数(フレームトップ)
         */
        this.__vars = {};
    }

    reset() {
        this.nako_func = {};
        this.used_func = {};
        this.loop_id = 1;
    }

    getHeader() {
        return "" +
            "var __varslist = this.__varslist = [{}, {}, {}];\n" +
            "var __vars = this.__varslist[2];\n" +
            "var __self = this;\n";
    }

    /** プログラムの実行に必要な関数を書き出す(システム領域) */
    getVarsCode() {
        let code = "";
        // プログラム中で使った関数を列挙して書き出す
        for (const key in this.used_func) {
            const f = this.__varslist[0][key];
            const name = `this.__varslist[0]["${key}"]`;
            if (typeof(f) == "function") {
                code += name + "=" + f.toString() + ";\n";
            } else {
                code += name + "=" + JSON.stringify(f) + ";\n";
            }
        }
        return code;
    }

    /** プログラムの実行に必要な関数定義を書き出す(グローバル領域) */
    getDefFuncCode() {
        let code = "__varslist[0].line=0;// なでしこの関数定義\n";
        // なでしこの関数定義を行う
        for (const key in this.nako_func) {
            const f = this.nako_func[key].fn;
            code += `this.__varslist[1]["${key}"]=${f};\n`;
        }
        // プラグインの初期化関数を実行する
        code += "__varslist[0].line=0;// プラグインの初期化\n";
        for (const name in this.pluginfiles) {
            const initkey = `!${name}:初期化`;
            if (this.used_func[initkey]) {
                code += `__varslist[0].line=0;__varslist[0]["!${name}:初期化"](__self)\n`;
            }
        }
        return code;
    }

    getVarsList() {
        return this.__varslist;
    }

    /**
     * プラグイン・オブジェクトを追加
     * @param po プラグイン・オブジェクト
     */
    addPlugin(po) {
        // プラグインの値をオブジェクトにコピー
        for (let key in po) {
            const v = po[key];
            this.plugins[key] = v;
            this.__varslist[0][key] = (typeof(v.fn) == "function") ? v.fn : v.value;
        }
    }

    /**
     * プラグイン・オブジェクトを追加(ブラウザ向け)
     * @param objName オブジェクト名を登録
     * @param po 関数リスト
     */
    addPluginObject(objName, po) {
        if (this.pluginfiles[objName] === undefined) {
            this.pluginfiles[objName] = '*'; // dummy
            if (typeof(po['初期化']) === "object") {
                const def = po['初期化'];
                delete po['初期化'];
                const initkey = `!${objName}:初期化`;
                po[initkey] = def;
                this.used_func[initkey] = true;
            }
            this.addPlugin(po);
        }
    }

    /**
     * プラグイン・ファイルを追加(Node.js向け)
     * @param objName オブジェクト名を登録
     * @param path ファイルパス
     * @param po 登録するオブジェクト
     */
    addPluginFile(objName, path, po) {
        if (this.pluginfiles[objName] === undefined) {
            this.pluginfiles[objName] = path;
            this.addPlugin(po);
        }
    }

    /**
     * 関数を追加する
     * @param key 関数名
     * @param josi 助詞
     * @param fn 関数
     */
    addFunc(key, josi, fn) {
        this.plugins[key] = {"josi": josi};
        this.setFunc(key, fn);
    }

    /**
     * 関数をセットする
     * @param key 関数名
     * @param fn 関数
     */
    setFunc(key, fn) {
        this.plugins[key].fn = fn;
        this.__varslist[0][key] = fn;
    }

    /**
     * プラグイン関数を参照する
     * @param key プラグイン関数の関数名
     * @returns プラグイン・オブジェクト
     */
    getFunc(key) {
        return this.plugins[key];
    }

    c_lineno(node) {
        if (!node.loc) return '';
        const lineno = node.loc.start.line;
        return `__varslist[0].line=${lineno};`;
    }

    c_gen(node) {
        let code = "";
        if (node instanceof Array) {
            for (let i = 0; i < node.length; i++) {
                const n = node[i];
                code += this.c_gen(n);
            }
            return code;
        }
        if (node === null) return "null";
        if (node === undefined) return "undefined";
        if (typeof(node) != "object") return "" + node;
        // switch
        switch (node.type) {
            case "nop":
                break;
            case "comment":
                code += this.c_lineno(node);
                code += "/*" + node.value + "*/\n";
                break;
            case "EOS":
                code += this.c_lineno(node);
                code += "\n";
                break;
            case "break":
                code += "break;";
                break;
            case "continue":
                code += "continue;";
                break;
            case "end": // TODO: どう処理するか?
                code += "quit();";
                break;
            case "number":
                code += node.value;
                break;
            case "string":
                code += this.c_string(node);
                break;
            case "def_local_var":
                code += this.c_def_local_var(node) + "\n";
                break;
            case "let":
                code += this.c_let(node) + "\n";
                break;
            case "variable":
                code += this.c_get_var(node);
                break;
            case "calc":
                code += this.c_op(node);
                break;
            case "func":
                code += this.c_func(node, true);
                break;
            case "calc_func":
                code += this.c_func(node, false);
                break;
            case "if":
                code += this.c_if(node);
                break;
            case "for":
                code += this.c_for(node);
                break;
            case "foreach":
                code += this.c_foreach(node);
                break;
            case "repeat_times":
                code += this.c_repeat_times(node);
                break;
            case "while":
                code += this.c_while(node);
                break;
            case "let_array":
                code += this.c_let_array(node);
                break;
            case "ref_array":
                code += this.c_ref_array(node);
                break;
            case "json_array":
                code += this.c_json_array(node);
                break;
            case "json_obj":
                code += this.c_json_obj(node);
                break;
            case "bool":
                code += (node.value) ? "true" : "false";
                break;
            case "null":
                code += "null";
                break;
            case "def_func":
                code += this.c_def_func(node);
                break;
            case "return":
                code += this.c_return(node);
                break;
        }
        return code;
    }

    varname(name) {
        return `__vars["${name}"]`;
    }

    find_var(name) {
        // __vars ?
        if (this.__vars[name] !== undefined) {
            return {i: this.__varslist.length - 1, "name": name, isTop: true};
        }
        // __varslist ?
        for (let i = this.__varslist.length - 2; i >= 0; i--) {
            const vlist = this.__varslist[i];
            if (!vlist) continue;
            if (vlist[name] !== undefined) {
                return {"i": i, "name": name, isTop: false};
            }
        }
        return null;
    }

    gen_var(name, loc) {
        const res = this.find_var(name);
        const lno = (loc) ? loc.start.line : 0;
        if (res == null) {
            return `__vars["${name}"]/*?:${lno}*/`;
        }
        const i = res.i;
        // システム関数・変数の場合
        if (i == 0) {
            const pv = this.plugins[name];
            if (!pv) return `__vars["${name}"]/*err:${lno}*/`;
            if (pv.type == "const") return `__varslist[0]["${name}"]`;
            if (pv.type == "func") {
                if (pv.josi.length == 0) {
                    return `(__varslist[${i}]["${name}"]())`;
                }
                throw new NakoGenError(`『${name}』が複文で使われました。単文で記述してください。(v1非互換)`, loc);
            }
            throw new NakoGenError(`『${name}』は関数であり参照できません。`, loc);
        }
        if (res.isTop) {
            return `__vars["${name}"]`;
        } else {
            return `__varslist[${i}]["${name}"]`;
        }
    }

    c_get_var(node) {
        const name = node.value;
        return this.gen_var(name, node.loc);
    }

    c_return(node) {
        const lno = this.c_lineno(node);
        let value;
        if (node.value) {
            value = this.c_gen(node.value);
            return lno + `return ${value};`;
        } else {
            value = this.sore;
            return lno + `return ${value};`;
        }
    }

    c_def_func(node) {
        const name = this.getFuncName(node.name.value);
        const args = node.args;
        // ローカル変数をPUSHする
        let code = "(function(){\n";
        code += "try { __vars = {'それ':''}; __varslist.push(__vars);\n";
        this.__vars = {'それ': true};
        this.__varslist.push(this.__vars);
        // 引数をローカル変数に設定
        const josilist = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const josi_word = arg["word"].value;
            const josi = [arg["josi"]];
            josilist.push(josi);
            this.__vars[josi_word] = true;
            code += `__vars["${josi_word}"] = arguments[${i}];\n`;
        }
        // 関数定義は、グローバル領域で。
        this.used_func[name] = true;
        this.__varslist[1][name] = function () {
        }; // 再帰のために事前に適当な値を設定
        this.nako_func[name] = {
            "josi": josilist,
            "fn": '',
            "type": "func"
        };
        // ブロックを解析
        const block = this.c_gen(node.block);
        code += block + "\n";
        // 関数の末尾に、ローカル変数をPOP
        const popcode =
            "__varslist.pop(); " +
            "__vars = __varslist[__varslist.length-1];";
        code += `} finally { ${popcode} }\n`;
        code += `})/* end of ${name} */`;
        this.nako_func[name]["fn"] = code;
        this.__vars = this.__varslist.pop();
        this.__varslist[1][name] = code;
        // ★この時点では関数のコードを生成しない★
        // 　プログラム冒頭でコード生成時に関数定義を行う
        // return `__vars["${name}"] = ${code};\n`;
        return '';
    }

    c_json_obj(node) {
        const list = node.value;
        const codelist = list.map((e) => {
            const key = this.c_gen(e.key);
            const val = this.c_gen(e.value);
            return `${key}:${val}`;
        });
        return "{" + codelist.join(",") + "}";
    }

    c_json_array(node) {
        const list = node.value;
        const codelist = list.map((e) => {
            return this.c_gen(e);
        });
        return "[" + codelist.join(",") + "]";
    }

    c_ref_array(node) {
        const name = this.c_gen(node.name);
        const list = node.index;
        let code = name;
        for (let i = 0; i < list.length; i++) {
            const idx = this.c_gen(list[i]);
            code += "[" + idx + "]";
        }
        return code;
    }

    c_let_array(node) {
        const name = this.c_gen(node.name);
        const list = node.index;
        let code = name;
        for (let i = 0; i < list.length; i++) {
            const idx = this.c_gen(list[i]);
            code += "[" + idx + "]";
        }
        const value = this.c_gen(node.value);
        code += " = " + value + ";\n";
        return this.c_lineno(node) + code;
    }

    c_for(node) {
        const kara = this.c_gen(node.from);
        const made = this.c_gen(node.to);
        const block = this.c_gen(node.block);
        let word = "", var_code = "";
        if (node.word != "") {
            word = this.c_gen(node.word);
            var_code = "";
        } else {
            // ループ変数を省略した時は、自動で生成する
            const id = this.loop_id++;
            word = `$nako_i${id}`;
            var_code = "var ";
        }
        const code =
            `for(${var_code}${word}=${kara}; ${word}<=${made}; ${word}++)` + "{\n" +
            `  ${this.sore} = ${word};` + "\n" +
            "  " + block + "\n" +
            "};\n";
        return this.c_lineno(node) + code;
    }

    c_foreach(node) {
        let target;
        if (node.target == null) {
            target = this.sore;
        } else {
            target = this.c_gen(node.target);
        }
        const block = this.c_gen(node.block);
        const id = this.loop_id++;
        const taisyou = this.varname('対象');
        const key = this.varname('対象キー');
        const code =
            `var $nako_foreach_v${id}=${target};\n` +
            `for(var $nako_i${id} in $nako_foreach_v${id})` + "{\n" +
            `  ${this.sore} = ${taisyou} = $nako_foreach_v${id}[$nako_i${id}];` + "\n" +
            `  ${key} = $nako_i${id};\n` +
            "  " + block + "\n" +
            "};\n";
        return this.c_lineno(node) + code;
    }

    c_repeat_times(node) {
        const id = this.loop_id++;
        const value = this.c_gen(node.value);
        const block = this.c_gen(node.block);
        const kaisu = this.varname('回数');
        const code =
            `for(var $nako_i${id} = 1; $nako_i${id} <= ${value}; $nako_i${id}++)` + "{\n" +
            `  ${this.sore} = ${kaisu} = $nako_i${id};` + "\n" +
            "  " + block + "\n}\n";
        return this.c_lineno(node) + code;
    }

    c_while(node) {
        const cond = this.c_gen(node.cond);
        const block = this.c_gen(node.block);
        const code =
            `while (${cond})` + "{\n" +
            `  ${block}` + "\n" +
            "}\n";
        return this.c_lineno(node) + code;
    }

    c_if(node) {
        const expr = this.c_gen(node.expr);
        const block = this.c_gen(node.block);
        const false_block = this.c_gen(node.false_block);
        const code =
            this.c_lineno(node) +
            `if (${expr}) { ${block} } else { ${false_block} };\n`;
        return this.c_lineno(node) + code;
    }

    getFuncName(name) {
        let name2 = name.replace(/[ぁ-ん]+$/, '');
        if (name2 == '') name2 = name;
        return name2;
    }

    /**
     * 関数の引数を調べる
     * @param func_name 関数名
     * @param func
     * @param node
     * @returns {Array}
     */
    c_func_get_args(func_name, func, node) {
        const args = [];
        for (let i = 0; i < func.josi.length; i++) {
            const josilist = func.josi[i]; // 関数のi番目の助詞
            let flag = false;
            let sore = 1;
            // 今回呼び出す関数の助詞を一つずつ調べる
            for (let j = 0; j < node.args.length; j++) {
                const arg = node.args[j];
                const ajosi = arg.josi;
                const k = josilist.indexOf(ajosi);
                if (k < 0) continue;
                args.push(this.c_gen(arg.value));
                flag = true;
            }
            if (!flag) {
                sore--;
                if (sore < 0) {
                    const josi_s = josilist.join("|");
                    throw new NakoGenError(
                        `関数『${func_name}』の引数『${josi_s}』が見当たりません。`, node.loc);
                }
                args.push(this.sore);
            }
        }
        return args;
    }

    c_func_get_args_calctype(func_name, func, node) {
        const args = [];
        for (let i = 0; i < node.args.length; i++) {
            const arg = node.args[i];
            args.push(this.c_gen(arg));
        }
        return args;
    }

    getPluginList() {
        const r = [];
        for (const name in this.pluginfiles) r.push(name);
        return r;
    }

    /**
     * 関数の呼び出し
     * @param node
     * @param  is_nako_type
     * @returns コード
     */
    c_func(node, is_nako_type) {
        const func_name = this.getFuncName(node.name.value);
        let func_name_s;
        const res = this.find_var(func_name);
        if (res == null) {
            throw new NakoGenError(`関数『${func_name}』が見当たりません。有効プラグイン=[` + this.getPluginList().join(",") + ']', node.loc);
        }
        let func;
        if (res.i == 0) { // plugin function
            func = this.plugins[func_name];
            func_name_s = `__varslist[0]["${func_name}"]`;
        } else {
            func = this.nako_func[func_name];
            if (func === undefined) {
                throw new NakoGenError(`『${func_name}』は関数ではありません。`, node.loc);
            }
            func_name_s = `__varslist[${res.i}]["${func_name}"]`;
        }
        // 関数定義より助詞を一つずつ調べる
        let args = [];
        if (is_nako_type) {
            args = this.c_func_get_args(func_name, func, node);
        } else {
            args = this.c_func_get_args_calctype(func_name, func, node);
        }
        // function
        if (typeof(this.used_func[func_name]) === "undefined") {
            this.used_func[func_name] = true;
        }
        // 関数呼び出しで、引数の末尾にthisを追加する-システム情報を参照するため
        args.push("__self");
        let args_code = args.join(",");
        let code = `${func_name_s}(${args_code})`;
        if (func.return_none) {
            if (is_nako_type) {
                code = code + ";\n";
            }
        } else {
            if (is_nako_type) {
                code = this.sore + " = " + code + ";\n";
            }
        }
        return this.c_lineno(node) + code;
    }

    c_op(node) {
        let op = node.operator; // 演算子
        const right = this.c_gen(node.right);
        const left = this.c_gen(node.left);
        if (op == "&") {
            op = '+ "" +';
        }
        return "(" + left + op + right + ")";
    }

    c_let(node) {
        const value = this.c_gen(node.value);
        const name = node.name.value;
        const res = this.find_var(name);
        let is_top = true, code = "";
        if (res == null) {
            this.__vars[name] = true;
        } else {
            if (res.isTop) is_top = true;
        }
        if (is_top) {
            code = `__vars["${name}"]=${value};\n`;
        } else {
            code = `__varslist[${res.i}]["${name}"]=${value};\n`;
        }
        return this.c_lineno(node) + code;
    }

    c_def_local_var(node) {
        const value = this.c_gen(node.value);
        const name = node.name.value;
        const vtype = node.vtype; // 変数 or 定数
        // 二重定義？
        if (this.__vars[name] !== undefined) {
            throw new NakoGenError(
                    `${vtype}『${name}』の二重定義はできません。`, 
                    node.loc)
        }
        //
        this.__vars[name] = true;
        const code = `__vars["${name}"]=${value};\n`;
        return this.c_lineno(node) + code;
    }

    c_print(node) {
        return `__print(${code});`;
    }

    c_string(node) {
        let value = "" + node.value;
        let mode = node.mode;
        value = value.replace(/\\/g, '\\\\');
        value = value.replace(/"/g, '\\\"');
        value = value.replace(/\r/g, '\\r');
        value = value.replace(/\n/g, '\\n');
        if (mode == "ex") {
            let rf = (a, name) => {
                return "\"+" + this.gen_var(name) + "+\"";
            };
            value = value.replace(/\{(.+?)\}/g, rf);
            value = value.replace(/｛(.+?)｝/g, rf);
        }
        return '"' + value + '"';
    }
}

module.exports = NakoGen;
