// parser.js
const tokens = require(__dirname + '/tokens.js');
const ntypes = require(__dirname + '/nodetypes.js');
const tokenizer_js = require(__dirname + "/tokenizer.js")
const BlockInfo = require(__dirname + "/blockinfo.js").BlockInfo;
const SNode = require(__dirname + "/snode.js").SNode;
const Tokenizer = tokenizer_js.Tokenizer;
const Token = tokenizer_js.Token;
const SysFunc = require(__dirname + "/sys_func.js");

class Parser {
  
  constructor (list) {
    const block = new BlockInfo();
    this.root = this.cur = new SNode(ntypes.BLOCK, block);
    this.block = block;
    this.list = list;
    this.index = 0;
    this.registerSysFunc(this.block);
  }
  
  get result() {
    return this.root;
  }
  
  static parse(list) {
    const p = new Parser(list);
    p.exec();
    return p.result;
  }
  
  get isEOF() {
    return (this.index >= this.list.length);
  }
  peek() {
    return this.list[this.index];
  }
  next() {
    return this.list[this.index++];
  }
  prev() {
    tihs.index--;
  }
  
  matchType(pat) {
    for (let i = 0; i < pat.length; i++) {
      const idx = this.index + i;
      if (idx >= this.list.length) return false;
      const t = this.list[idx];
      if (t.typeNo != pat[i]) return false;
    }
    return true;
  }
  match(pat) {
    for (let i = 0; i < pat.length; i++) {
      const idx = this.index + i;
      if (idx >= this.list.length) return false;
      const t = this.list[idx];
      if (t.token != pat[i]) return false;
    }
    return true;
  }
  
  registerSysFunc(block) {
    for (const key in SysFunc) {
      block.variables[key] = ntypes.FUNC;
    }
  }
  
  exec() {
    while (!this.isEOF) {
      let prev_index = this.index;
      // console.log("exec=", this.index);
      // # EOS
      this.p_skipEOS();
      // # SENTENSE
      const n = this.p_sentense();
      if (n) {
        this.cur.next = n;
        this.cur = n;
      } else {
        if (prev_index == this.index) this.next();
      }
    }
  }
  
  p_skipEOS() {
    while (!this.isEOF) {
      const t = this.peek();
      if (t.typeNo == tokens.EOS) {
        this.next();
        continue;
      }
      break;
    }
  }
  p_sentense() {
    // # LET
    let n = this.p_let(null);
    if (n) return n;
    // # PRINT
    n = this.p_print(null);
    if (n) return n;
    return null;
  }
  p_print() {
    // # VALUE JOSI PRINT
    let tmp = this.index;
    let node_value = this.p_value();
    if (node_value == null) return null;
    if (this.matchType([tokens.JOSI, tokens.PRINT])) {
      this.index += 2;
      let node_print = new SNode(ntypes.PRINT, "");
      node_print.addChild(node_value);
      return node_print;
    }
    this.index = tmp;
    return null;
  }
  p_let() {
    // # WORD EQ VALUE
    if (this.matchType([tokens.WORD, tokens.EQ])) {
      console.log("WORD EQ VALUE");
      const t_name = this.next();
      const t_eq = this.next();
      const value_node = this.p_value();
      const let_node = new SNode(ntypes.LET, t_name.token);
      cur_block.variables[t_name] = ntypes.VALUE;
      let_node.addChild(value_node);
      return let_node;
    }
    return null;
  }
  p_value() {
    const t = this.peek();
    if (t == undefined) return null;
    // # NUM || STR
    if (t.typeNo == tokens.NUM || t.typeNo == tokens.STR) {
      console.log("p_value=",t);
      this.next();
      const node_value = new SNode(ntypes.VALUE, t.token);
      return node_value;
    }
    return null;
  }
}

module.exports = {
  "Parser": Parser,
  "SNode": SNode,
};
