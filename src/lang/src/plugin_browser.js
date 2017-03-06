// plugin_browser.js

var PluginBrowser = {
    /// 色定数
    "赤色": { type:"const", value:"#FF0000"},
    /// DOM操作
    "ID取得": { /// DOMのIDを取得して返す
        type:"func", josi: [["の","を"]],
        fn: function (id) {
          return document.getElementById(id);
        },
    },
    "タグ一覧取得": { /// 任意のタグの一覧を取得して返す
        type:"func", josi: [["の","を"]],
        fn: function (tag) {
          return document.getElementByTags(tag);
        },
    }
};
module.exports = PluginBrowser;

