// nako_gen.js
"use strict";
const funcbank = require('./func_basic.js');
class NakoGenError extends Error {}
class NakoGen {
  
  static generate(node, useHeader = true, fn_print = null) {
    const jsgen = new NakoGen(node);
    if (fn_print !== null) funcbank["表示"].fn = fn_print;
    const code = jsgen.c_gen(jsgen.root);
    const code_def = jsgen.gen_sysfunc() + "\n";
    const head = jsgen.header;
    if (useHeader) {
      return head + "\n" + code_def + code;
    } else {
      return code_def + code;
    }
  }
  
  // ----
  constructor(root) {
    this.root = root;
    this.header = this.genHeader();
    this.sysfunc = {};
  }
  genHeader() {
    return "" + 
      "const __vars = {};\n" +
      "var   __print = (s)=>{ console.log(s); };\n";
  }
  gen_sysfunc() {
    let code = "";
    for (const key in this.sysfunc) {
      code += this.varname(key) + "=" + this.sysfunc[key].toString() + ";\n";
    }
    return code;
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
    console.log("node.type=",node.type);
    switch (node.type) {
      case "nop": break;
      case "EOS":
        code += "\n";
        break;
      case "number":
        code += node.value;
        break;
      case "string":
        code += '"' + node.value.replace('"', '\\\"') + '"';
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
    }
    return code;
  }
  varname(name) {
    return `__vars["${name}"]`;
  }
  c_if(node) {
    const expr = this.c_gen(node.expr);
    const block = this.c_gen(node.block);
    const false_block = this.c_gen(node.false_block);
    const code = `if (${expr}) { ${block} } else { ${false_block} };\n`;
    return code;
  }
  c_func(node) {
    const func_name = node.name.value;
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
        const josi_s = josilist.join("|");
        throw new NakoGenError(
          `関数『${func_name}』の引数『${josi_s}』が見当たりません。`);
      }
    }
    // function
    if (typeof(this.sysfunc[func_name]) !== "function") {
      this.sysfunc[func_name] = func.fn;
    }
    let args_code = args.join(",");
    let code = `__vars["${func_name}"](${args_code});`;
    return code;
  }
  c_op(node) {
    const op = node.operator; // 演算子
    const right = this.c_gen(node.right);
    const left = this.c_gen(node.left);
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
}

module.exports = NakoGen;

