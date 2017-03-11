// plugin_node.js

const PluginNode = {
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
    "カレントディレクトリ取得": { /// カレントディレクトリを返す
        type: "func", josi: [],
        fn: function () {
            const cwd = process.cwd();
            const path = require('path');
            return path.resolve(cwd);
        },
    },
    "カレントディレクトリ変更": { /// カレントディレクトリをDIRに変更する
        type: "func", josi: [["に", "へ"]],
        fn: function (dir) {
            process.chdir(dir);
        },
        return_none: true
    },
    "作業フォルダ取得": { /// カレントディレクトリを返す
        type: "func", josi: [],
        fn: function () {
            const cwd = process.cwd();
            const path = require('path');
            return path.resolve(cwd);
        },
    },
    "作業フォルダ変更": { /// カレントディレクトリをDIRに変更する
        type: "func", josi: [["に", "へ"]],
        fn: function (dir) {
            process.chdir(dir);
        },
        return_none: true
    },
    "母艦パス取得": { /// スクリプトのあるディレクトリを返す
        type: "func", josi: [],
        fn: function () {
            const path = require('path');
            let nakofile;
            const cmd = path.basename(process.argv[1]);
            if (cmd.indexOf('cnako3') < 0) {
                nakofile = process.argv[1];
            } else {
                nakofile = process.argv[2];
            }
            return path.dirname(path.resolve(nakofile));
        },
    },
    "環境変数取得": { /// 環境変数の一覧を返す
        type: "func", josi: [],
        fn: function () {
            return process.env;
        }
    },
    "ファイル列挙": { /// パスSのファイル名（フォルダ名）一覧を取得する。ワイルドカード可能。「*.jpg;*.png」など複数の拡張子を指定可能。
        type: "func", josi: [["の", "を", "で"]],
        fn: function (s) {
            const fs = require('fs');
            const path = require('path');
            if (s.indexOf('*') >= 0) { // ワイルドカードがある場合
                const search_path = path.dirname(s);
                const mask1 = path.basename(s)
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                const mask2 = (mask1.indexOf(';') < 0) ?
                    mask1 + "$" : "(" + mask1.replace(/\;/g, '|') + ")$";
                const mask_re = new RegExp(mask2, "i");
                const list = fs.readdirSync(search_path);
                const list2 = list.filter((n) => mask_re.test(n));
                return list2;
            } else {
                const list = fs.readdirSync(s);
                return list;
            }
        }
    },
    "全ファイル列挙": { /// パスS以下の全ファイル名を取得する。ワイルドカード可能。「*.jpg;*.png」のように複数の拡張子を指定可能。
        type: "func", josi: [["の", "を", "で"]],
        fn: function (s) {
            const fs = require('fs');
            const path = require('path');
            const result = [];
            // ワイルドカードの有無を確認
            let mask = ".*";
            let basepath = s;
            if (s.indexOf('*') >= 0) {
                basepath = path.dirname(s);
                const mask1 = path.basename(s)
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                mask = (mask1.indexOf(';') < 0) ?
                    mask1 + "$" : "(" + mask1.replace(/\;/g, '|') + ")$";
            }
            basepath = path.resolve(basepath);
            const mask_re = new RegExp(mask, "i");
            // 再帰関数を定義
            const enum_r = (base) => {
                const list = fs.readdirSync(base);
                for (const f of list) {
                    if (f == "." || f == "..") continue;
                    const fullpath = path.join(base, f);
                    const st = fs.statSync(fullpath);
                    if (st.isDirectory()) {
                        enum_r(fullpath);
                        continue;
                    }
                    if (mask_re.test(f)) result.push(fullpath);
                }
            };
            // 検索実行
            enum_r(basepath);
            return result;
        }
    },
    "ファイル名抽出": { /// フルパスのファイル名Sからファイル名部分を抽出して返す
        type: "func", josi: [["から", "の"]],
        fn: function (s) {
            const path = require('path');
            return path.basename(s);
        }
    },
    "パス抽出": { /// ファイル名Sからパス部分を抽出して返す
        type: "func", josi: [["から", "の"]],
        fn: function (s) {
            const path = require('path');
            return path.dirname(s);
        }
    }
};

module.exports = PluginNode;
