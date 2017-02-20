// jsgenerator.js

const nodetypes = require('./nodetypes.js');

class JSGenerator {
  static generate(node, useHeader = true) {
    const jsgen = new JSGenerator(node);
    const code = jsgen.c_gen(null);
    const head = jsgen.header;
    if (useHeader) {
      return head + "\n" + code;
    } else {
      return code;
    }
  }
  constructor(root) {
    this.root = root;
    this.header = this.genHeader();
  }
  genHeader() {
    return "" + 
      "const __vars = {};\n" +
      "const __print = (s)=>{ console.log(s); };\n";
  }
  c_gen(node) {
    if (node == null) node = this.root;
    let code = "";
    while (node != null) {
      switch (node.typeNo) {
        case nodetypes.NOP:
          code += "";
          break;
        case nodetypes.LET:
          code += this.c_let(node) + "\n";
          break;
        case nodetypes.PRINT:
          code += this.c_print(node) + "\n";
          break;
        case nodetypes.VALUE:
          code += JSON.stringify(node.value);
          break;
        case nodetypes.OP:
          code += this.c_op(node);
      }
      node = node.next;
    }
    console.log(code);
    return code;
  }
  c_op(node) {
    const op = node.value; // 演算子
    const left = this.c_gen(node.children[0]);
    const right = this.c_gen(node.children[1]);
    return "(" + left + op + right + ")";
  }
  c_let(node) {
    const name = node.value;
    const code = this.c_gen(node.children[0]);
    console.log(code);
    return `__vars['${name}'] = ${code};`;
  }
  c_print(node) {
    const code = this.c_gen(node.children[0]);
    console.log(code);
    return `__print(${code});`;
  }
}

module.exports = JSGenerator;
