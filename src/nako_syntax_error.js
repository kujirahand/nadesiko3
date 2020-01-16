/**
 * なでしこの文法エラーを表示するクラス
 */
const PluginSystem = require('./plugin_system')

class NakoSyntaxError extends Error {
  constructor (msg, line, fname) {
    const line2 = line + 1
    const fname2 = (fname === undefined) ? '' : fname
    const dummy = {__v0: {}}
    PluginSystem['!PluginSystem:初期化'].fn(dummy)
    const title = `[文法エラー]${fname}(${line2}行目): ${msg}\n[version]: ${dummy.__v0.ナデシコバージョン}`
    super(title)
    
  }
}

module.exports = NakoSyntaxError
