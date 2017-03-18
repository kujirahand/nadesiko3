// plugin_browser.js
const PluginBrowser = {
    /// 色定数
    "水色": {type: "const", value: "aqua"}, /// みずいろ
    "紫色": {type: "const", value: "fuchsia"}, /// むらさきいろ
    "緑色": {type: "const", value: "lime"}, /// みどりいろ
    "青色": {type: "const", value: "blue"}, /// あおいろ
    "赤色": {type: "const", value: "red"}, /// あかいろ
    "黄色": {type: "const", value: "yellow"}, /// きいろ
    "黒色": {type: "const", value: "black"}, /// くろいろ
    "白色": {type: "const", value: "white"}, /// しろいろ
    "茶色": {type: "const", value: "maroon"}, /// ちゃいろ
    "灰色": {type: "const", value: "gray"}, /// はいいろ
    "金色": {type: "const", value: "gold"}, /// きんいろ
    "黄金色": {type: "const", value: "gold"}, /// こがねいろ
    "銀色": {type: "const", value: "silver"}, /// ぎんいろ
    "白金色": {type: "const", value: "silver"}, /// しろがねいろ
    "オリーブ色": {type: "const", value: "olive"}, /// おりーぶいろ
    "ベージュ色": {type: "const", value: "beige"}, /// べーじゅいろ
    "アリスブルー色": {type: "const", value: "aliceblue"},///ありすぶるーいろ
    /// システム
    "終": { /// ブラウザでプログラムの実行を強制終了する /// おわる
        type: "func", josi: [],
        fn: function (s) {
            throw new Error('__終わる__');
        }
    },
    /// ダイアログ
    "言": { /// メッセージダイアログにSを表示 /// いう
        type: "func", josi: [["と", "を"]],
        fn: function (s) {
            alert(s);
        }
    },
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
