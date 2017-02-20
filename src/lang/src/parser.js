// parser.js
const tokens = require('./tokens.js');
const ntypes = require('./nodetypes.js');
const Tokenizer = require("./tokenizer.js")
const Token = require("./token.js")
const BlockInfo = require("./blockinfo.js");
const SysFunc = require("./sys_func.js");
const SNode = require("./snode.js");

class ParserError extends Error { }

/**
 * Parser class
 * @class
 * @classdesc パーサークラス
 */
class Parser {
  
  /**
   * @property {BlockInfo} this.block - 構文のブロックを表す
   * @property {Token[]} list - トークンリストを表す
   * @property {number} index - 現在解析中のトークン
   * @property {SNode} root - ノードのルート要素
   * @property {SNode} cur - 解析直後のノード要素
   */
  constructor (list) {
    const block = new BlockInfo();
    this.root = this.cur = new SNode(ntypes.BLOCK, block);
    this.block = block;
    this.list = list;
    this.index = 0;
    this.registerSysFunc(this.block);
  }
  
  /**
   * @return {SNode} 
   */
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
  /**
   * カーソルからi番目のトークンを調べる
   * @param {number} i
   * @return {Token}
   */
  getTokenFromCur(i) {
    const idx = i + this.index;
    if (idx >= this.list.length) return undefined;
    return this.list[idx];
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
      this.block.variables[t_name] = ntypes.VALUE;
      let_node.addChild(value_node);
      return let_node;
    }
    return null;
  }
  p_fomula() {
    const left_n = p_value();
    if (left_n == null) return null;
    const t = this.peek();
    if (t == undefined) return left_n;
    if (t.typeNo !== tokens.OP) return left_n;
    return null;
  }

  p_value() {
    // 値として取り得るか
    const t = this.peek();
    if (t == undefined) return null;
    
    // # NUM || STR
    if (t.isType([tokens.NUM, tokens.STR])) {
      this.next();
      const node_value = new SNode(ntypes.VALUE, t.token);
      return node_value;
    }
    // # WORD
    const v = this.block.find(t.token);
    if (v == undefined) { // 未定義の変数の時
      throw new ParserError("未定義の変数:" + t.token);
    }
    // # PAREN_BEGIN p_fomula PAREN_END
    if (t.typeNo == tokens.PAREN_BEGIN) {
      this.next();
      const node = p_fomula();
      const nt = this.peek();
      if (nt == undefined || nt.typeNo != tokens.PAREN_END) {
        throw new ParserError("(...)が未対応");
      }
      this.next(); // ")"
      return node;
    }
    //
    return null;
  }
  p_calc() {
    left_node = this.next();
  }
}

module.exports = Parser;



