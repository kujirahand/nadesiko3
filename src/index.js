module.exports = {
  // Node.jsでモジュールモードでなでしこを利用する場合
  'compiler': require('./nako3.js'),
  'PluginNode': require('./plugin_node.js'),

  // Electron
  'app': require('./enako3').app
}

