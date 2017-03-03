//
// nako_gen.js
//

"use strict";
class NakoGenError extends Error { }

/**
 * 構文木からJSのコードを生成するクラス
 */
class NakoGen {
  
  constructor() {
    this.header = this.getHeader();
    this.plugins = {}; /** プラグインで定義された関数の一覧 */
    this.nako_func = {}; /** なでしこで定義した関数の一覧 */
    this.used_func = {}; /** JS関数でなでしこ内で利用された関数 */
    this.loop_id = 1;
    this.sore = this.varname('それ');
    //
    this.__vars = {};
    this.__varslist = [{}, this.__vars];
    this.clearPlugin();
  }
  getHeader() {
    return "" + 
      "var __vars = {};\n" +
      "var __varslist = [{}, __vars];\n" +
      "var __print = (s)=>{ console.log(s); };\n";
  }
  getVarsCode() {
    let code = "";
    // プログラム中で使った関数を列挙
    for (const key in this.used_func) {
      const f = this.used_func[key];
      const name = `__varslist[0]["${key}"]`;
      if (typeof(f) == "function") {
        code += name + "=" + f.toString() + ";\n";
      } else {
        code += name + "=" + JSON.stringify(f) + ";\n";
      }
    }
    return code;
  }
  getVarsList() {
    return this.__varslist;
  }
  clearLog() {
    this.plugins["__print_log"].value = "";
  }
  clearPlugin() {
    this.plugins = {};
    this.vars = {};
    this.__varslist = [{}, this.__vars];
    this.used_func = {};
  }
  /**
   * プラグイン・オブジェクトを追加
   */
  addPlugin(po) {
    // プラグインの値をオブジェクトにコピー
    for (let key in po) {
      const v = po[key];
      this.plugins[key] =v;
      this.__varslist[0][key] = (typeof(v.fn) == "function") ? v.fn : v.value;
    }
  }
  /** 単体で関数を追加する場合 */
  addFunc(key, josi, fn) {
    this.plugins[key] = { "josi": josi, "fn": fn };
  }
  /** プラグイン関数を参照したい場合 */
  getFunc(key) {
    return this.plugins[key];
  }
  c_gen(node) {
    let code = "";
    if (node == undefined) return "";
    if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        const n = node[i];
        code += this.c_gen(n);
      }
      return code;
    }
    if (typeof(node) != "object") return "" + node;
    // switch
    switch (node.type) {
      case "nop": break;
      case "EOS":
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
        code += this.c_func(node);
        break;
      case "if":
        code += this.c_if(node);
        break;
      case "for":
        code += this.c_for(node);
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
    }
    return code;
  }
  varname(name) {
    return `__vars["${name}"]`;
  }
  find_var(name) {
    // __vars ?
    if (this.__vars[name] !== undefined) {
      return {i:this.__varslist.length-1, "name":name, isTop:true};
    }
    // __varslist ?
    for (let i = this.__varslist.length - 2; i >= 0; i--) {
      const vlist = this.__varslist[i];
      if (vlist[name] !== undefined) {
        return {"i":i, "name":name, isTop:false};
      }
    }
    return null;
  }  
  c_get_var(node) {
    const name = node.value;
    const res = this.find_var(name);
    if (res == null) {
      return `__vars["${name}"]/*?*/`;
    }
    const i = res.i;
    if (i == 0) {
      const pv = this.plugins[name];
      if (pv !== undefined) {
        if (pv.type == "const") return JSON.stringify(pv.value);
        throw new NakoGenError(`『${name}』は関数であり参照できません。`);
      }
    }
    if (res.isTop) {
      return `__vars["${name}"]`;
    } else {
      return `__varslist[${i}]["${name}"]`;
    }
  }
  c_def_func(node) {
    const name = this.getFuncName( node.name.value );
    const args = node.args;
    const block = this.c_gen(node.block);
    this.__vars[name] = "func";
    let code = "(function(){\n";
    code += "  try {\n    __vars = {}; __varslist.push(__vars);\n";
    this.__vars = {};
    this.__varslist.push(this.__vars);
    const josilist = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      // console.log("arg=", arg);
      const word = arg["value"].value;
      const josi = [ arg["josi"] ];
      josilist.push(josi);
      this.__vars[word] = true;
      code += `__vars["${word}"] = arguments[${i}];\n`;
    }
    code += block + "\n";
    const popcode = "__varslist.pop(); __vars = __varslist[__varslist.length-1];";
    code += `  } finally { ${popcode} }\n`;
    code += "\n})\n";
    const fn = eval(code);
    this.nako_func[name] = {
      "josi": josilist,
      "fn": fn,
      "type":"func"
    };
    this.used_func[name] = fn;
    // console.log(fn.toString());
    return `__vars["${name}"] = ${code};\n`;
  }
  c_json_obj(node) {
    const list = node.value;
    const codelist = list.map((e)=>{
      const key = this.c_gen(e.key);
      const val = this.c_gen(e.value)
      return `'${key}':${val}`;
    });
    return "{" + codelist.join(",") + "}";
  }
  c_json_array(node) {
    const list = node.value;
    const codelist = list.map((e)=>{
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
    return code;
  }
  c_for(node) {
    const kara = this.c_gen(node.from);
    const made = this.c_gen(node.to);
    const word = this.c_gen(node.word);
    const block = this.c_gen(node.block);
    const code =
      `for(${word}=${kara}; ${word}<=${made}; ${word}++)` + "{\n" +
      `  ${this.sore} = ${word};` + "\n" + 
      "  " + block + "\n" +
      "};\n";
    return code;
  }
  c_repeat_times(node) {
    const id = this.loop_id++;
    const value = this.c_gen(node.value);
    const block = this.c_gen(node.block);
    const kaisu = this.varname('回数');
    const code =
      `for(let $nako_i${id} = 1; $nako_i${id} <= ${value}; $nako_i${id}++)`+"{\n"+
      `  ${this.sore} = ${kaisu} = $nako_i${id};` + "\n" +
      "  " + block + "\n}\n";
    return code;
  }
  c_while(node) {
    const cond = this.c_gen(node.cond);
    const block = this.c_gen(node.block);
    const code =
      `while (${cond})` + "{\n" +
      `  ${block}` + "\n" +
      "}\n";
    return code;
  }
  c_if(node) {
    const expr = this.c_gen(node.expr);
    const block = this.c_gen(node.block);
    const false_block = this.c_gen(node.false_block);
    const code = `if (${expr}) { ${block} } else { ${false_block} };\n`;
    return code;
  }
  getFuncName(name) {
    let name2 = name.replace(/[ぁ-ん]+$/, '');
    if (name2 == '') name2 = name;
    return name2;
  }
  /** 関数の呼び出し */
  c_func(node) {
    const func_name = this.getFuncName(node.name.value);
    let func_name_s;
    const res = this.find_var(func_name);
    if (res == null) {
      throw new NakoGenError(`関数『${func_name}』が見当たりません。`);
    }
    let func;
    if (res.i == 0) { // plugin function
      func = this.plugins[func_name];
      func_name_s = `__varslist[0]["${func_name}"]`;
    } else {
      func = this.nako_func[func_name];
      if (func === undefined) {
        throw new NakoGenError(`『${func_name}』は関数ではありません。`);
      }
      func_name_s = `__varslist[${res.i}]["${func_name}"]`;
    }

    //
    const args = [];
    // 関数定義より助詞を一つずつ調べる
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
            `関数『${func_name}』の引数『${josi_s}』が見当たりません。`);
        }
        args.push(this.sore);
      }
    }
    // function
    if (typeof(this.used_func[func_name]) !== "function") {
      this.used_func[func_name] = func.fn;
    }
    let args_code = args.join(",");
    let code = `${func_name_s}(${args_code});\n`;
    if (func.return_none) {
      // return None
    } else {
      code = this.sore + " = " + code;
    }
    return code;
  }
  c_op(node) {
    let op = node.operator; // 演算子
    const right = this.c_gen(node.right);
    const left = this.c_gen(node.left);
    if (op == "&") { op = '+ "" +'; }
    return "(" + left + op + right + ")";
  }
  c_let(node) {
    const value = this.c_gen(node.value);
    const name = node.name.value;
    const res = this.find_var(name);
    // console.log("var=", name, "/", res);
    // console.log(this.__varslist);
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
    return code;
  }
  c_print(node) {
    return `__print(${code});`;
  }
  c_string(node) {
    let value = "" + node.value;
    let mode = node.mode;
    value = value.replace('"', '\\\"');
    value = value.replace(/(\r\n|\r|\n)/g, "\\n");
    if (mode == "ex") {
      let rf = (a, m) => {
        return "\"+"+ this.varname(m) +"+\"";
      };
      value = value.replace(/\{(.+?)\}/g, rf);
      value = value.replace(/｛(.+?)｝/g, rf);
    }
    return '"' + value + '"';
  }
}

module.exports = NakoGen;

