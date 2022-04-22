const assert = require('assert')

class PluginUtHelper {
  constructor (targePlugin) {
    this.plugin = targePlugin
  }

  cmptypeof (typename, obj) {
    assert.equal((typeof obj).toLowerCase(), typename.toLowerCase())
  }

  cmpinstanceof (classtype, obj) {
    assert.ok(obj instanceof classtype, 'not as specified instance')
  }

  cmpfn (funcname, args, res) {
    assert.equal(this.plugin[funcname].fn.apply(this, args), res)
  }

  cmpifn (funcname, args, res) {
    assert.equal(this.plugin[funcname].fn.apply(this, args).toUpperCase(), res.toUpperCase())
  }

  cmpfnex (funcname, args, err, msg) {
    assert.throws(() => this.plugin[funcname].fn.apply(this, args), { name: err, message: msg })
  }

  cmpfnexdetail (funcname, args, err) {
    assert.throws(() => this.plugin[funcname].fn.apply(this, args), err)
  }
}

module.exports = { PluginUtHelper }
