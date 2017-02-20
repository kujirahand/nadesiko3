//
// snode.js
//

const ntypes = require('./nodetypes.js');

/**
 * 構文木のノードを表すするクラス
 * @class
 */
class SNode {
  
  constructor(typeNo, value) {
    this.typeNo = typeNo;
    this.value = value;
    this.children = [];
    this.next = null;
    this.priority = 0;
  }
  
  addChild(n) {
    this.children.push(n);
  }
  
  addNext(node) {
    let n = this;
    for (;;) {
      if (n.next == null) {
        n.next = node;
        break;
      }
      n = n.next;
    }
  }
  
  toString() {
    let v = this.value;
    if (v == undefined || v == null) v = "";
    if (typeof(v) == "object") v = "*";
    return ntypes.dict_a[this.typeNo] + ":" + v;
  }
  
  toStringEx() {
    let res = [];
    // children
    for (const i in this.children) {
      const n = this.children[i];
      if (n instanceof SNode) {
        res.push(n.toStringEx());
      } else {
        res.push(typeof(n) + ":" + n);
      }
    }
    res.push(this.toString());
    return res.join("|");
  }
  
  toStringAll() {
    let res = [this.toStringEx()];
    // next
    let cur = this.next;
    while (cur != null) {
      res.push(cur.toStringEx());
      cur = cur.next;
    }
    return res.join("|");
  }
}

module.exports = SNode; 






