// blockinfo.js

const SNode = require(__dirname + "/snode.js").SNode;
const NodeTypes = require(__dirname + "/nodetypes.js");

class BlockInfo {

  constructor() {
    this.variables = {};
    this.parent = null;
    this.children = [];
    this.stack = [];
  }
  
  findBlock(name) {
    return this.variables[name];
  }
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

module.exports = {
  "BlockInfo": BlockInfo,
};


