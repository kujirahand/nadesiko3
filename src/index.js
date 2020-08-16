module.exports = {
  // Node.jsのモジュールモードでなでしこを利用する場合
  'compiler': require('./nako3.js'),
  'PluginNode': require('./plugin_node.js'),

  // Electronでなでしこを利用する場合
  'app': require('./enako3.js').app
}

