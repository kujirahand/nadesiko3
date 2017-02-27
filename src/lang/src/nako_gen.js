//
// nako_gen.js
//

"use strict";
const funcbank = require('./func_basic.js');
class NakoGenError extends Error { }

/**
 * 構文木からJSのコードを生成するクラス
 */
class NakoGen {
  
  static generate(node, useHeader = true, fn_print = null) {
    const jsgen = new NakoGen();
    if (fn_print !== null) funcbank["表示"].fn = fn_print;
    const code = jsgen.c_gen(root);
    const code_def = jsgen.gen_sysfunc_code() + "\n";
    const head = jsgen.header;
    if (useHeader) {
      return head + "\n" + code_def + code;
    } else {
      return code_def + code;
    }
  }
  
  // ----
  constructor() {
    this.header = this.genHeader();
    this.sysfunc = {};
    this.loop_id = 1;
  }
  genHeader() {
    return "" + 
      "const __vars = {};\n" +
      "var   __print = (s)=>{ console.log(s); };\n";
  }
  gen_sysfunc_code() {
    let code = "";
    for (const key in this.sysfunc) {
      code += this.varname(key) + "=" + this.sysfunc[key].toString() + ";\n";
    }
    return code;
  }
  getVars() {
    return this.sysfunc
  }
  clearLog() {
    funcbank["__print_log"] = "";
  }
  addFunc(key, josi, fn) {
    funcbank[key] = { "josi": josi, "fn": fn };
  }
  getFunc(key) {
    return funcbank[key];
  }
  varname(name) {
    return `__vars["${name}"]`;
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
    switch (node.type) {
      case "nop": break;
      case "EOS":
        code += "\n";
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
      case "let":
        code += this.c_let(node) + "\n";
        break;
      case "variable":
        code += this.varname(node.value);
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
    }
    return code;
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
      `  __vars['それ'] = ${word};` + "\n" + 
      "  " + block + "\n" +
      "};\n";
    return code;
  }
  c_repeat_times(node) {
    const id = this.loop_id++;
    const value = node.value;
    const block = this.c_gen(node.block);
    const code =
      `for(let $nako_i${id} = 1; $nako_i${id} <= ${value}; $nako_i${id}++)`+"{\n"+
      `  __vars['それ'] = $nako_i${id};` + "\n" +
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
  c_func(node) {
    const func_name = this.getFuncName(node.name.value);
    const func = funcbank[func_name];
    if (func === undefined) {
      throw new NakoGenError(`関数『${func_name}』が見当たりません。`);
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
        args.push("__vars['それ']");
      }
    }
    // function
    if (typeof(this.sysfunc[func_name]) !== "function") {
      this.sysfunc[func_name] = func.fn;
    }
    let args_code = args.join(",");
    let code = `__vars['それ'] = __vars["${func_name}"](${args_code});`;
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
    const name = this.c_gen(node.name);
    const value = this.c_gen(node.value);
    return `${name} = ${value};`;
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
        return "\"+__vars['"+m+"']+\"";
      };
      value = value.replace(/\{(.+?)\}/g, rf);
      value = value.replace(/｛(.+?)｝/g, rf);
    }
    return '"' + value + '"';
  }
}

module.exports = NakoGen;

