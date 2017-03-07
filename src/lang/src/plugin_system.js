// basic_func.js

const PluginSystem = {
    "初期化": {
      type: "func", josi: [],
      fn: function (sys) {
        sys.__nako3version = "3.0b2";
        sys.__varslist[0]['ナデシコバージョン'] = sys.__nako3version;
      }
    },
    /// システム定数
    "ナデシコバージョン": {type: "const", value: "?"},
    "ナデシコエンジン": {type: "const", value: "nadesi.com/v3"},
    "はい": {type: "const", value: 1},
    "いいえ": {type: "const", value: 0},
    "オン": {type: "const", value: 1},
    "オフ": {type: "const", value: 0},
    "改行": {type: "const", value: "\n"},
    "タブ": {type: "const", value: "\t"},
    "カッコ": {type: "const", value: "「"},
    "カッコ閉じ": {type: "const", value: "」"},
    "波カッコ": {type: "const", value: "{}"},
    "波カッコ閉じ": {type: "const", value: "}"},
    "OK": {type: "const", value: 1},
    "NG": {type: "const", value: 0},
    "PI": {type: "const", value: Math.PI},
    /// 標準出力
    "表示": { /// Sを表示
        type: "func", josi: [["を", "と"]],
        fn: function (s, sys) {
            if (!sys.silent) {
                console.log(s);
            }
            sys.__varslist[0]["表示ログ"] += (s + "\n");
        },
        return_none: true
    },
    "表示ログ": {type: "const", value: ""},
    "表示ログクリア": { /// 表示ログを空にする
        type: "func", josi: [[]],
        fn: function (sys) {
            sys.__varslist[0]["表示ログ"] = "";
        },
        return_none: true
    },
    "言": { /// Sを表示
        type: "func", josi: [["を", "と"]],
        fn: function (s) {
            console.log(s);
        },
        return_none: true
    },
    "尋": { /// メッセージSと入力ボックスを出して尋ねる
        type: "func",
        josi: [["と", "を"]],
        fn: function (s) {
            const r = prompt(s);
            if (r.match(/^[0-9\.]+$/)) return parseFloat(r);
            return r;
        }
    },
    /// 四則演算
    "足": { /// AとBを足す
        type: "func",
        josi: [["に", "と"], ["を"]],
        fn: function (a, b) {
            return a + b;
        },
    },
    "引": { /// AからBを引く
        type: "func",
        josi: [["から"], ["を"]],
        fn: function (a, b) {
            return a - b;
        },
    },
    "掛": { /// AにBを掛ける
        type: "func",
        josi: [["に", "と"], ["を"]],
        fn: function (a, b) {
            return a * b;
        },
    },
    "倍": { /// AのB倍を求める
        type: "func",
        josi: [["の"], ["を"]],
        fn: function (a, b) {
            return a * b;
        },
    },
    "割": { /// AをBで割る
        type: "func",
        josi: [["を"], ["で"]],
        fn: function (a, b) {
            return a / b;
        },
    },
    "割った余": { /// AをBで割った余りを求める
        type: "func",
        josi: [["を"], ["で"]],
        fn: function (a, b) {
            return a % b;
        },
    },
    /// 特殊命令
    "JS実行": { /// JavaScriptのコードSを実行する
        type: "func",
        josi: [["を"], ["で"]],
        fn: function (js) {
            return eval(js);
        },
    },
    ///型変換
    "変数型確認": { /// 変数Vの型を返す
        type: "func",
        josi: [["の"]],
        fn: function (v) {
            return typeof(v);
        },
    },
    "TYPEOF": {/// 変数Vの型を返す
        type: "func",
        josi: [["の"]],
        fn: function (v) {
            return typeof(v);
        },
    },
    "文字列変換": {/// 値Vを文字列に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return String(v);
        },
    },
    "TOSTR": { /// 値Vを文字列に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return String(v);
        },
    },
    "整数変換": { /// 値Vを整数に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return parseInt(v);
        },
    },
    "TOINT": {/// 値Vを整数に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return parseInt(v);
        },
    },
    "実数変換": {/// 値Vを実数に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return parseFloat(v);
        },
    },
    "実数変換": {/// 値Vを実数に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return parseFloat(v);
        },
    },
    "TOFLOAT": {/// 値Vを実数に変換
        type: "func",
        josi: [["を"]],
        fn: function (v) {
            return parseFloat(v);
        },
    },
    "INT": {/// 値Vを整数に変換
        type: "func", josi: [["の"]],
        fn: function (v) {
            return parseInt(v);
        },
    },
    "FLOAT": {/// 値Vを実数に変換
        type: "func", josi: [["の"]],
        fn: function (v) {
            return parseFloat(v);
        },
    },
    "HEX": {/// 値Vを16進数に変換
        type: "func", josi: [["の"]],
        fn: function (a) {
            return parseInt(a).toString(16);
        },
    },
    /// 三角関数
    "SIN": {/// ラジアン単位VのSINを求める
        type: "func", josi: [["の"]],
        fn: function (v) {
            return Math.sin(v);
        },
    },
    "COS": {/// ラジアン単位VのCOSを求める
        type: "func", josi: [["の"]],
        fn: function (v) {
            return Math.cos(v);
        },
    },
    "TAN": {/// ラジアン単位VのTANを求める
        type: "func", josi: [["の"]],
        fn: function (v) {
            return Math.tan(v);
        },
    },
    "ARCSIN": {/// ラジアン単位VのARCSINを求める
        type: "func", josi: [["の"]],
        fn: function (v) {
            return Math.asin(v);
        },
    },
    "ARCCOS": {/// ラジアン単位VのARCCOSを求める
        type: "func", josi: [["の"]],
        fn: function (v) {
            return Math.acos(v);
        },
    },
    "ARCTAN": {/// ラジアン単位VのARCTANを求める
        type: "func", josi: [["の"]],
        fn: function (v) {
            return Math.atan(v);
        },
    },
    "RAD2DEG": {/// ラジアンから度に変換
        type: "func", josi: [["を"]],
        fn: function (v) {
            return v / Math.PI * 180;
        },
    },
    "DEG2RAD": { /// 度からラジアンに変換
        type: "func", josi: [["を"]],
        fn: function (v) {
            return (v / 180) * Math.PI;
        },
    },
    "度変換": { /// ラジアンから度に変換
        type: "func", josi: [["を"]],
        fn: function (v) {
            return v / Math.PI * 180;
        },
    },
    "ラジアン変換": { /// 度からラジアンに変換
        type: "func", josi: [["を"]],
        fn: function (v) {
            return (v / 180) * Math.PI;
        },
    },
    /// 算術関数
    "SIGN": { /// Vが0なら0を、0超なら1を、0未満なら-1を返す
        type: "func", josi: [["の"]],
        fn: function (v) {
            return (v == 0) ? 0 : (v > 0) ? 1 : -1;
        },
    },
    "ABS": { /// Vの絶対値を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.abs(a)
        },
    },
    "EXP": { /// e（自然対数の底）の A 乗の値を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.exp(a)
        },
    },
    "HYPOT": { /// 直角三角形の二辺の長さA,Bから斜辺を求めて返す。
        type: "func", josi: [["と"], ["の"]],
        fn: function (a, b) {
            return Math.sqrt(a * b)
        },
    },
    "LN": { /// 実数式 A の自然対数（Ln(A) = 1）を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.log(a)
        },
    },
    "LOG": { /// Aの自然対数（底はE）を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.log(a)
        },
    },
    "LOGN": { ///指定された底AでBの対数を計算して返す
        type: "func", josi: [["で"], ["の"]],
        fn: function (a, b) {
            if (a == 2) return Math.LOG2E * Math.log(b);
            if (a == 10) return Math.LOG10E * Math.log(b);
            return Math.log(b) / Math.log(a);
        },
    },
    "FRAC": { /// 実数Aの小数部分を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return a % 1
        },
    },
    "乱数": { /// 0から(A-1)までの乱数を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.floor(Math.random() * a);
        },
    },
    "SQRT": { /// Aの平方根を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.sqrt(a);
        },
    },
    "平方根": { /// Aの平方根を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            return Math.sqrt(a);
        },
    },
    "RGB": { /// HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255
        type: "func", josi: [["と"], ["の"], ["で"]],
        fn: function (r, g, b) {
            const z2 = (v) => {
                const v2 = "00" + parseInt(v).toString(16);
                return v2.substr(v2.length - 2, 2);
            };
            return '#' + z2(r) + z2(g) + z2(b);
        },
    },
    "ROUND": { /// 実数型の値Vを丸めてもっとも近い整数値を返す
        type: "func", josi: [["を"]],
        fn: function (v) {
            return Math.round(v);
        },
    },
    "四捨五入": { /// 整数Aの一桁目を丸めて返す。
        type: "func", josi: [["を", "の"]],
        fn: function (v) {
            return Math.round(v / 10) * 10;
        },
    },
    "CEIL": { /// 数値を正の無限大方向へ切り上げて返す。
        type: "func", josi: [["を"]],
        fn: function (v) {
            return Math.ceil(v);
        },
    },
    "切り上げ": { /// 数値を正の無限大方向へ切り上げて返す。
        type: "func", josi: [["を"]],
        fn: function (v) {
            return Math.ceil(v);
        },
    },
    "FLOOR": { /// 数値を負の無限大方向へ切り下げて返す。
        type: "func", josi: [["を"]],
        fn: function (v) {
            return Math.floor(v);
        },
    },
    "切り捨て": { /// 数値を負の無限大方向へ切り下げて返す。
        type: "func", josi: [["を"]],
        fn: function (v) {
            return Math.floor(v);
        },
    },
    "NOT": { /// 値Vが0ならば1、それ以外ならば0を返す
        type: "func", josi: [["の"]],
        fn: function (v) {
            return (!v) ? 1 : 0;
        },
    },
    /// 論理演算
    "OR": { /// AとBの論理和を返す。AまたばBが0以外ならば1を、それ以外は0を返す
        type: "func", josi: [["と"], ["の"]],
        fn: function (a, b) {
            return (a || b) ? 1 : 0;
        },
    },
    "AND": { /// AとBの論理積を返す。日本語の「AかつB」に相当する
        type: "func", josi: [["と"], ["の"]],
        fn: function (a, b) {
            return (a && b) ? 1 : 0;
        },
    },
    "XOR": {/// AとBの排他的論理和を返す。
        type: "func", josi: [["と"], ["の"]],
        fn: function (a, b) {
            return (a ^ b) ? 1 : 0;
        },
    },
    /// ビット演算
    "SHIFT_L": { /// VをAビット左へシフトして返す
        type: "func", josi: [["を"], ["で"]],
        fn: function (a, b) {
            return (a << b);
        },
    },
    "SHIFT_R": { /// VをAビット右へシフトして返す
        type: "func", josi: [["を"], ["で"]],
        fn: function (a, b) {
            return (a >> b);
        },
    },
    /// 文字列処理
    "文字数": { /// 文字列Vの文字数を返す
        type: "func", josi: [["の"]],
        fn: function (v) {
            return String(v).length;
        },
    },
    "何文字目": { /// 文字列SでAが何文字目にあるか調べて返す
        type: "func", josi: [["で", "の"], ["が"]],
        fn: function (s, a) {
            return String(s).indexOf(a) + 1;
        },
    },
    "CHR": { /// 文字コードから文字を返す
        type: "func", josi: [["の"]],
        fn: function (v) {
            return String.fromCharCode(v);
        },
    },
    "ASC": { /// 文字列Vの最初の文字の文字コードを返す
        type: "func", josi: [["の"]],
        fn: function (v) {
            return String(v).charCodeAt(0);
        },
    },
    "文字挿入": { /// 文字列SのI文字目に文字列Aを挿入する
        type: "func", josi: [["で", "の"], ["に", "へ"], ["を"]],
        fn: function (s, i, a) {
            if (i <= 0) i = 1;
            const ss = String(s);
            const mae = ss.substr(0, i - 1);
            const usi = ss.substr(i - 1);
            return mae + a + usi;
        },
    },
    "文字検索": { /// 文字列Sで文字列Aが何文字目にあるか調べて返す
        type: "func", josi: [["で", "の"], ["を"]],
        fn: function (s, a) {
            return String(s).indexOf(a) + 1;
        },
    },
    "追加": { /// v1非互換:文字列SにAを追加して返す
        type: "func", josi: [["で", "に", "へ"], ["を"]],
        fn: function (s, a) {
            return String(s) + String(a);
        },
    },
    "一行追加": { /// v1非互換:文字列SにAと改行を追加して返す
        type: "func", josi: [["で", "に", "へ"], ["を"]],
        fn: function (s, a) {
            return String(s) + String(a) + "\n";
        },
    },
    "文字列分解": {/// 文字列Vを一文字ずつに分解して返す
        type: "func", josi: [["を", "の", "で"]],
        fn: function (v) {
            return String(v).split("");
        },
    },
    "リフレイン": { /// v1非互換:文字列VをCNT回繰り返す
        type: "func", josi: [["を", "の"], ["で"]],
        fn: function (v, cnt) {
            let s = "";
            for (let i = 0; i < cnt; i++) s += String(v);
            return s;
        },
    },
    "出現回数": {///文字列SにAが何回出現するか数える
        type: "func", josi: [["で"], ["の"]],
        fn: function (s, a) {
            let cnt = 0;
            const re = new RegExp(a.replace(/(.)/g, '\\$1'), 'g');
            String(s).replace(re, m => {
                cnt++;
            });
            return cnt;
        },
    },
    "MID": {/// 文字列SのA文字目からCNT文字を抽出する
        type: "func", josi: [["で", "の"], ["から"], ["を"]],
        fn: function (s, a, cnt) {
            return (String(s).substr(a - 1, cnt));
        }
    },
    "文字抜き出す": { /// v1非互換:文字列SのA文字目からCNT文字を抽出する
        type: "func", josi: [["で", "の"], ["から"], ["を"]],
        fn: function (s, a, cnt) {
            return (String(s).substr(a - 1, cnt));
        }
    },
    "LEFT": {/// 文字列Sの左端からCNT文字を抽出する
        type: "func", josi: [["の", "で"], ["だけ"]],
        fn: function (s, cnt) {
            return (String(s).substr(0, cnt));
        }
    },
    "文字左部分": { /// v1非互換:文字列Sの左端からCNT文字を抽出する
        type: "func", josi: [["の", "で"], ["だけ"]],
        fn: function (s, cnt) {
            return (String(s).substr(0, cnt));
        }
    },
    "RIGHT": {/// 文字列Sの右端からCNT文字を抽出する
        type: "func", josi: [["の", "で"], ["だけ"]],
        fn: function (s, cnt) {
            s = "" + s;
            return (s.substr(s.length - cnt, cnt));
        }
    },
    "文字右部分": {/// v1非互換:文字列Sの右端からCNT文字を抽出する
        type: "func", josi: [["の", "で"], ["だけ"]],
        fn: function (s, cnt) {
            s = "" + s;
            return (s.substr(s.length - cnt, cnt));
        }
    },
    "切り取": { /// v1非互換: 文字列Sから文字列Aまでの部分を抽出する
        type: "func", josi: [["から", "の"], ["まで", "を"]],
        fn: function (s, a) {
            s = String(s);
            const i = s.indexOf(a);
            if (i < 0) return s;
            return s.substr(0, i);
        }
    },
    "文字削除": { /// v1非互換:文字列SのA文字目からB文字分を削除して返す
        type: "func", josi: [["の"], ["から"], ["だけ", "を"]],
        fn: function (s, a, b) {
            s = "" + s;
            const mae = s.substr(0, a - 1);
            const usi = s.substr((a - 1 + b));
            return mae + usi;
        }
    },
    /// 置換・トリム
    "置換": {/// 文字列Sのうち文字列AをBに全部置換して返す
        type: "func", josi: [["の", "で"], ["を"], ["に", "へ"]],
        fn: function (s, a, b) {
            s = String(s);
            const re = new RegExp(a.replace(/(.)/g, "\\$1"), "g");
            return s.replace(re, b);
        }
    },
    "単置換": { /// 文字列Sのうち、最初に出現するAだけをBに置換して返す
        type: "func", josi: [["の", "で"], ["を"], ["に", "へ"]],
        fn: function (s, a, b) {
            s = String(s);
            const re = new RegExp(a.replace(/(.)/g, "\\$1"), "");
            return s.replace(re, b);
        }
    },
    "トリム": { /// 文字列Sの前後にある空白を削除する
        type: "func", josi: [["の", "を"]],
        fn: function (s) {
            s = String(s).replace(/^\s+/, '').replace(/\s+$/, '');
            return s;
        }
    },
    "空白除去": {/// 文字列Sの前後にある空白を削除する
        type: "func", josi: [["の", "を"]],
        fn: function (s) {
            s = String(s).replace(/^\s+/, '').replace(/\s+$/, '');
            return s;
        }
    },
    /// JSON
    "JSONエンコード": { /// オブジェクトvをJSON形式にエンコードする
        type: "func", josi: [["を", "の"]],
        fn: function (v) {
            return JSON.stringify(v);
        }
    },
    "JSONデコード": { /// JSON文字列Sをオブジェクトにデコードする
        type: "func", josi: [["を", "の", "から"]],
        fn: function (s) {
            return JSON.parse(s);
        }
    },

    /// 正規表現
    "正規表現マッチ": {/// 文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは/pat/optで指定)
        type: "func", josi: [["を", "が"], ["で", "に"]],
        fn: function (a, b) {
            let re;
            let f = b.match(/\/(.+)\/([a-zA-Z]*)/);
            if (f == null) { // パターンがある場合
                re = new RegExp(b, "g");
            } else {
                re = new RegExp(f[1], f[2]);
            }
            return String(a).match(re);
        }
    },
    "正規表現置換": {/// 文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定)
        type: "func", josi: [["の"], ["を", "から"], ["で", "に", "へ"]],
        fn: function (s, a, b) {
            let re;
            let f = a.match(/\/(.+)\/([a-zA-Z]*)/);
            if (f == null) { // パターンがある場合
                re = new RegExp(a, "g");
            } else {
                re = new RegExp(f[1], f[2]);
            }
            return String(s).replace(re, b);
        }
    },
    "正規表現区切": {/// 文字列Sを正規表現パターンAで区切って配列で返す(パターンAは/pat/optで指定)
        type: "func", josi: [["を"], ["で"]],
        fn: function (s, a) {
            let re;
            let f = a.match(/\/(.+)\/([a-zA-Z]*)/);
            if (f == null) { // パターンがある場合
                re = new RegExp(a, "g");
            } else {
                re = new RegExp(f[1], f[2]);
            }
            return String(s).split(re);
        }
    },
    /// 指定形式
    "通貨形式": { /// 数値Vを三桁ごとにカンマで区切る
        type: "func", josi: [["を", "の"]],
        fn: function (v) {
            return String(v).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        }
    },
    "ゼロ埋": { /// 数値VをA桁の0で埋める
        type: "func", josi: [["を"], ["で"]],
        fn: function (v, a) {
            v = String(v);
            let z = "0";
            for (let i = 0; i < a; i++) z += "0";
            a = parseInt(a);
            if (a < v.length) a = v.length;
            const s = z + String(v);
            return s.substr(s.length - a, a);
        }
    },
    /// 文字種類
    "かなか判定": { /// 文字列Sの1文字目がひらがなか判定
        type: "func", josi: [["を", "の", "が"]],
        fn: function (s) {
            const c = String(s).charCodeAt(0);
            return (0x3041 <= c && c <= 0x309F);
        }
    },
    "カタカナか判定": { /// 文字列Sの1文字目がカタカナか判定
        type: "func", josi: [["を", "の", "が"]],
        fn: function (s) {
            const c = String(s).charCodeAt(0);
            return (0x30A1 <= c && c <= 0x30FA);
        }
    },
    "数字か判定": { /// 文字列Sの1文字目が数字か判定
        type: "func", josi: [["を", "が"]],
        fn: function (s) {
            const c = String(s).charAt(0);
            return ('0' <= c && c <= '9' || '０' <= c && c <= '９');
        }
    },
    "数列か判定": { /// 文字列S全部が数字か判定
        type: "func", josi: [["を", "が"]],
        fn: function (s) {
            return (null != String(s).match(/^[0-9\.]+$/));
        }
    },
    /// 配列操作
    "配列結合": { /// 配列Aを文字列Sでつなげて文字列で返す
        type: "func", josi: [["を"], ["で"]],
        fn: function (a, s) {
            if (a instanceof Array) { // 配列ならOK
                return a.join("" + s);
            }
            const a2 = String(a).split("\n"); // 配列でなければ無理矢理改行で区切ってみる
            return a2.join("" + s);
        }
    },
    "配列検索": { /// 配列Aから文字列Sを探してインデックス番号(0起点)を返す。見つからなければ-1を返す。
        type: "func", josi: [["の", "から"], ["を"]],
        fn: function (a, s) {
            if (a instanceof Array) { // 配列ならOK
                return a.indexOf(s);
            }
            return -1;
        }
    },
    "配列要素数": { /// 配列Aの要素数を返す
        type: "func", josi: [["の"]],
        fn: function (a) {
            if (a instanceof Array) { // 配列ならOK
                return a.length;
            }
            if (typeof(a) == "object") {
                return Object.keys(a).length;
            }
            return 1;
        }
    },
    "配列挿入": { /// v1非互換:配列AのI番目(0起点)に要素Sを追加して返す
        type: "func", josi: [["の"], ["に", "へ"], ["を"]],
        fn: function (a, i, s) {
            if (a instanceof Array) { // 配列ならOK
                return a.splice(i, 0, s);
            }
            throw new Error("『配列挿入』で配列以外の要素への挿入。");
        }
    },
    "配列一括挿入": { /// v1非互換:配列AのI番目(0起点)に配列bを追加して返す
        type: "func", josi: [["の"], ["に", "へ"], ["を"]],
        fn: function (a, i, b) {
            if (a instanceof Array && b instanceof Array) { // 配列ならOK
                for (let j = 0; j < b.length; j++) {
                    a.splice(i + j, 0, b[j]);
                }
                return a;
            }
            throw new Error("『配列一括挿入』で配列以外の要素への挿入。");
        }
    },
    "配列ソート": { /// 配列Aをソートして返す
        type: "func", josi: [["の", "を"]],
        fn: function (a) {
            if (a instanceof Array) { // 配列ならOK
                return a.sort();
            }
            throw new Error("『配列ソート』で配列以外の処理。");
        }
    },
    "配列数値ソート": { /// 配列Aをソートして返す
        type: "func", josi: [["の", "を"]],
        fn: function (a) {
            if (a instanceof Array) { // 配列ならOK
                return a.sort((a, b) => {
                    return parseFloat(a) - parseFloat(b)
                });
            }
            throw new Error("『配列数値ソート』で配列以外の処理。");
        }
    },
    "配列カスタムソート": { /// 配列Aを関数Bでソートして返す
        type: "func", josi: [["の", "を"], ["で"]],
        fn: function (a, f_name, sys) {
            if (a instanceof Array) { // 配列ならOK
                return a.sort(sys.__varslist[1][f_name]);
            }
            throw new Error("『配列数値ソート』で配列以外の処理。");
        }
    },
    "配列逆順": { /// 配列Aを逆にして返す。Aを書き換える。
        type: "func", josi: [["の", "を"]],
        fn: function (a) {
            if (a instanceof Array) { // 配列ならOK
                return a.reverse();
            }
            throw new Error("『配列ソート』で配列以外の処理。");
        }
    },
    "配列シャッフル": { /// 配列Aをシャッフルして返す。Aを書き換える
        type: "func", josi: [["の", "を"]],
        fn: function (a) {
            if (a instanceof Array) { // 配列ならOK
                for (var i = a.length - 1; i > 0; i--) {
                    var r = Math.floor(Math.random() * (i + 1));
                    var tmp = a[i];
                    a[i] = a[r];
                    a[r] = tmp;
                }
                return a;
            }
            throw new Error("『配列シャッフル』で配列以外の処理。");
        }
    },
    "配列切り取": { /// 配列AのI番目(0起点)の要素を切り取って返す。Aの内容を書き換える。
        type: "func", josi: [["の"], ["を"]],
        fn: function (a, i) {
            if (a instanceof Array) { // 配列ならOK
                return a.splice(i, 1);
            }
            throw new Error("『配列切り取』で配列以外の処理。");
        }
    },
    "配列取り出": { /// 配列AのI番目(0起点)からCNT個の応訴を取り出して返す。Aの内容を書き換える
        type: "func", josi: [["の"], ["から"], ["を"]],
        fn: function (a, i, cnt) {
            if (a instanceof Array) { // 配列ならOK
                return a.splice(i, cnt);
            }
            throw new Error("『配列切り取』で配列以外の処理。");
        }
    },
    "配列ポップ": { /// 配列Aの末尾を取り出して返す。Aの内容を書き換える。
        type: "func", josi: [["の", "から"]],
        fn: function (a) {
            if (a instanceof Array) { // 配列ならOK
                return a.pop();
            }
            throw new Error("『配列ポップ』で配列以外の処理。");
        }
    },
    "配列追加": { /// 配列Aの末尾にBを追加して返す。Aの内容を書き換える。
        type: "func", josi: [["に", "へ"], ["を"]],
        fn: function (a, b) {
            if (a instanceof Array) { // 配列ならOK
                a.push(b);
                return a;
            }
            throw new Error("『配列追加』で配列以外の処理。");
        }
    },
    /// 日時処理
    "今": { /// 現在時刻を「hh:nn:ss」の形式で返す
        type: "func", josi: [],
        fn: function () {
            var t = new Date();
            var z2 = function (s) {
                s = "00" + s;
                return s.substr(s.length - 2, 2);
            };
            return z2(t.getHours()) + ":" + z2(t.getMinutes()) + ":" + z2(t.getSeconds());
        }
    },
    "システム時間": { /// UTC(1970/1/1)からの経過時間をミリ秒単位で返す
        type: "func", josi: [],
        fn: function () {
            var t = new Date();
            return t.getTime();
        }
    },
    "今日": { /// 今日の日付を「YYYY/MM/DD」の形式で返す
        type: "func", josi: [],
        fn: function () {
            var t = new Date();
            var z2 = function (s) {
                s = "00" + s;
                return s.substr(s.length - 2, 2);
            };
            return t.getFullYear() + "/" + z2(t.getMonth() + 1) + "/" + z2(t.getDate());
        }
    },
    "今年": { /// 今年で返す
        type: "func", josi: [],
        fn: function () {
            var t = new Date();
            return t.getFullYear();
        }
    },
    "曜日": { /// 日付Sの曜日を返す
        type: "func", josi: [["の"]],
        fn: function (s) {
            var week = ["日", "月", "火", "水", "木", "金", "土"];
            var t = new Date(s);
            return week[t.getDay()];
        }
    },
    "UNIXTIME変換": { /// 日時SをUNIXTIME(ミリ秒付き)に変換して返す
        type: "func", josi: [["の", "を", "から"]],
        fn: function (s) {
            var t = new Date(s);
            return t.getTime() / 1000;
        }
    },
    "日時変換": { /// UNIXTIMEを年/月/日に変換
        type: "func", josi: [["を", "から"]],
        fn: function (tm) {
            var t = new Date();
            t.setTime(tm * 1000);
            var z2 = function (s) {
                s = "00" + s;
                return s.substr(s.length - 2, 2);
            };
            return t.getFullYear() + "/" + z2(t.getMonth() + 1) + "/" + z2(t.getDate()) +
                " " + z2(t.getHours()) + ":" + z2(t.getMinutes()) + ":" + z2(t.getSeconds());
        }
    },
};

module.exports = PluginSystem;
