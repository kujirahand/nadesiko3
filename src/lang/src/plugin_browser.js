// plugin_browser.js
const PluginBrowser = {
    /// v1互換:色定数
    "水色": {type: "const", value: "aqua"},
    "紫色": {type: "const", value: "fuchsia"},
    "緑色": {type: "const", value: "lime"},
    "青色": {type: "const", value: "blue"},
    "赤色": {type: "const", value: "red"},
    "黄色": {type: "const", value: "yellow"},
    "黒色": {type: "const", value: "black"},
    "白色": {type: "const", value: "white"},
    /// DOM操作
    "ID取得": { /// DOMのIDを取得して返す
        type: "func", josi: [["の", "を"]],
        fn: function (id) {
            return document.getElementById(id);
        },
    },
    "タグ一覧取得": { /// 任意のタグの一覧を取得して返す
        type: "func", josi: [["の", "を"]],
        fn: function (tag) {
            return document.getElementsByTagName(tag);
        },
    }
};

module.exports = PluginBrowser;
