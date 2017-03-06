// plugin_node.js

var PluginNode = {
    /// ファイル入出力
    "開": { /// ファイルSを開く
        type: "func", josi: [["を", "から"]],
        fn: function (s) {
            const fs = require('fs');
            return fs.readFileSync(s, 'utf-8');
        },
    },
    "読": { /// ファイルSを開く
        type: "func", josi: [["を", "から"]],
        fn: function (s) {
            const fs = require('fs');
            return fs.readFileSync(s, 'utf-8');
        },
    },
    "保存": { /// ファイルFヘSを書き込む
        type: "func", josi: [["へ", "に"], ["を"]],
        fn: function (f, s) {
            const fs = require('fs');
            fs.writeFileSync(f, s, "utf-8");
        },
        return_none: true
    },
    "起動": { /// シェルコマンドSを起動
        type: "func", josi: [["を"]],
        fn: function (s) {
            const execSync = require('child_process').execSync;
            const r = execSync(s);
            return r.toString();
        },
    },
};

module.exports = PluginNode;
