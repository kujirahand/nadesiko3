//
// snode.js
//

const ntypes = require('./nodetypes.js');

class SNode {
  
  constructor(typeNo, value) {
    this.typeNo = typeNo;
    this.value = value;
    this.children = [];
    this.next = null;
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
    let res = [this.toString()];
    // children
    for (const i in this.children) {
      const n = this.children[i];
      res.push(n.toStringEx());
    }
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






