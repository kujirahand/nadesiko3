// blockinfo.js

const SNode = require("./snode.js");
const NodeTypes = require("./nodetypes.js");

class BlockInfo {

  /**
   * @classdesc ブロック情報を保持するクラス
   */
  constructor() {
    this.variables = {};
    this.parent = null;
    this.children = [];
    this.stack = [];
  }
  
  /**
   * add children block
   * @param info {BlockInfo} - children block
   */
  addBlock(info) {
    this.stack.push(info);
  }
  
  /**
   * 管理番号を付けて変数を追加する
   * @param {string} vname - 名前
   * @param {?} info - 変数の情報 
   */
   addVar(name, info) {
     // TODO
   }
  
  findThisBlock(name) {
    return this.variables[name];
  }
  
  /**
   * ブロックで有効な変数などの要素を調べる
   * @param {String} name 調べたい名前
   * @return {?} 変数の値
   */
  find(name) {
    const v = this.variables[name];
    if (v === undefined) {
      if (parent != null) {
        return parent.find(name);
      }
    }
    return v;
  }
  
}

module.exports = BlockInfo; 


