// plugin_browser.js
const PluginBrowser = {
    /// 色定数
    "水色": {type: "const", value: "aqua"},
    "紫色": {type: "const", value: "fuchsia"},
    "緑色": {type: "const", value: "lime"},
    "青色": {type: "const", value: "blue"},
    "赤色": {type: "const", value: "red"},
    "黄色": {type: "const", value: "yellow"},
    "黒色": {type: "const", value: "black"},
    "白色": {type: "const", value: "white"},
    "茶色": {type: "const", value: "maroon"},
    "灰色": {type: "const", value: "gray"},
    "金色": {type: "const", value: "gold"},
    "黄金色": {type: "const", value: "gold"},
    "銀色": {type: "const", value: "silver"},
    "白金色": {type: "const", value: "silver"},
    "オリーブ色": {type: "const", value: "olive"},
    "ベージュ": {type: "const", value: "beige"},
    "アリスブルー": {type: "const", value: "aliceblue"},
    /// ダイアログ
    "尋": { /// メッセージSと入力ボックスを出して尋ねる /// たずねる
        type: "func", josi: [["と", "を"]],
        fn: function (s) {
            const r = prompt(s);
            if (r.match(/^[0-9\.]+$/)) return parseFloat(r);
            return r;
        }
    },
    /// DOM操作
    "ID取得": { /// DOMのIDを取得して返す /// あいでぃーしゅとく
        type: "func", josi: [["の", "を"]],
        fn: function (id) {
            return document.getElementById(id);
        },
    },
    "タグ一覧取得": { /// 任意のタグの一覧を取得して返す /// たぐいちらんしゅとく
        type: "func", josi: [["の", "を"]],
        fn: function (tag) {
            return document.getElementsByTagName(tag);
        },
    }
};

module.exports = PluginBrowser;
