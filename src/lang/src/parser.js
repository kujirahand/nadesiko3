// parser.js
const tokens = require('./tokens.js');
const nodetypes = require('./nodetypes.js');
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
    this.root = this.cur = new SNode(nodetypes.BLOCK, block);
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
  
  /**
   * トークンリストを受け取って、パースし、先頭ノードを返す
   * @return {SNode}
   */
  static parse(list) {
    const p = new Parser(list);
    p._parse();
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
      block.variables[key] = nodetypes.FUNC;
    }
  }
  
  _parse() {
    // # EOS
    this._skipEOS();
    while (!this.isEOF) {
      let prev_index = this.index;
      // # SENTENSE
      const n = this.p_sentense();
      if (n) {
        this.cur.next = n;
        this.cur = n;
      } else {
        if (prev_index == this.index) this.next();
        console.log("SKIP node:", this.peek());
      }
    }
  }
  
  _skipEOS() {
    while (!this.isEOF) {
      // # EOS
      const t = this.peek();
      if (t.typeNo == tokens.EOS) {
        this.next();
        continue;
      }
      break;
    }
  }
  p_sentense() {
    // # EOL
    const t = this.peek();
    if (t == undefined) return null;
    if (t.typeNo == tokens.EOL) {
      this.next();
      return new SNode(nodetypes.EOL, ";");
    }
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
    let node_value = this.p_formula();
    if (node_value == null) return null;
    console.log("p_print, peek=", this.peek());
    if (this.matchType([tokens.JOSI, tokens.PRINT])) {
      this.index += 2;
      let node_print = new SNode(nodetypes.PRINT, "");
      node_print.addChild(node_value);
      return node_print;
    }
    this.index = tmp;
    return null;
  }
  p_let() {
    // # WORD EQ formula
    if (this.matchType([tokens.WORD, tokens.EQ])) {
      console.log("p_let() --- WORD EQ VALUE");
      const t_name = this.next();
      const vname = t_name.token;
      const t_eq = this.next();
      const value_node = this.p_formula();
      const let_node = new SNode(nodetypes.LET, vname);
      this.block.addVar(vname);
      let_node.addChild(value_node);
      return let_node;
    }
    return null;
  }
  p_formula() {
    // # value
    const left_n = this.p_value();
    if (left_n == null) return null;
    // # value OP formula
    const t = this.peek();
    if (t == undefined) return left_n;
    if (t.typeNo !== tokens.OP) return left_n;
    const op_token = t;
    this.next();
    const right_n = this.p_formula();
    if (right_n == null) throw new ParserError('演算子の後ろに式がありません');
    // 式の優先度を確かめる
    const OP_PRIORITY = {
      "||": 3, "&&": 3,
      "+": 2, "-": 2,
      "*": 1, "/": 1
    };
    const cur_pri = OP_PRIORITY[op_token.token];
    const fo_node = new SNode(nodetypes.OP, op_token.token);
    if (cur_pri < right_n.priority) {
      console.log("入れ替え");
      const right_l = right_n.children[0];
      fo_node.addChild(left_n);
      fo_node.addChild(right_l);
      right_n.children[0] = fo_node;
      return right_n;
    }
    // 演算順序入れ替えなしの場合
    fo_node.addChild(left_n);
    fo_node.addChild(right_n);
    return fo_node;
  }

  p_value() {
    // 値として取り得るか
    const t = this.peek();
    if (t == undefined) return null;
    
    // # NUM || STR
    if (t.isType([tokens.NUM, tokens.STR])) {
      this.next();
      const const_value_n = new SNode(nodetypes.VALUE, t.token);
      return const_value_n;
    }
    // # WORD
    if (t.isType([tokens.WORD])) {
      const word = t.token;
      // local variables?
      const lv = this.block.findThisBlock(word);
      if (lv !== undefined) { // ローカル変数
        this.next();
        return new SNode(nodetypes.REF_VAR_LOCAL, word);
      }
      const gv = this.block.find(word);
      if (gv !== undefined) { // ブロックより上の変数
        this.next();
        return new SNode(nodetypes.REF_VAR, word);
      }
      throw new ParserError("未定義の変数:" + t.token);
    }
    // # PAREN_BEGIN p_formula PAREN_END
    if (t.typeNo == tokens.PAREN_BEGIN) {
      this.next();
      const node = this.p_formula();
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



