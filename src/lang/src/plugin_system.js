// basic_func.js
var PluginSystem = {
  /// システム定数
  "ナデシコバージョン": { type:"const", value:"3.0"},
  "ナデシコエンジン":{ type:"const", value:"nadesi.com/v3" },
  "はい": { type:"const", value:1 },
  "いいえ": { type:"const", value:0 },
  "オン": { type:"const", value:1 },
  "オフ": { type:"const", value:0 },
  "改行": { type:"const", value:"\n"},
  "タブ": { type:"const", value:"\t"},
  "カッコ": { type:"const", value:"「"},
  "カッコ閉じ": { type:"const", value:"」"},
  "波カッコ": { type:"const", value:"{}"},
  "波カッコ閉じ": { type:"const", value:"}"},
  "OK": { type:"const", value:1 },
  "NG": { type:"const", value:0 },
  "PI": { type:"const", value:Math.PI },
  /// 標準出力
  "表示": {
    type:"func",
    josi: [["を","と"]],
    fn: function (s) { PluginSystem.__print(s); },
    return_none: true
  },
  "言": {
    type:"func",
    josi: [["を","と"]],
    fn: function (s) { PluginSystem.__print(s); },
    return_none: true
  },
  "尋": {
    type:"func",
    josi: [["と","を"]],
    fn: function (s) {
      const r = prompt(s);
      if (r.match(/^[0-9\.]+$/)) return parseFloat(r);
      return r;
    }
  },
  /// 四則演算 
  "足": {
    type:"func",
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a + b; },
  },
  "引": {
    type:"func",
    josi: [["から"],["を"]],
    fn: function (a, b) { return a - b; },
  },
  "掛": {
    type:"func",
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a * b; },
  },
  "倍": {
    type:"func",
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a * b; },
  },
  "割": {
    type:"func",
    josi: [["を"],["で"]],
    fn: function (a, b) { return a / b; },
  },
  "割った余": {
    type:"func",
    josi: [["を"],["で"]],
    fn: function (a, b) { return a % b; },
  },
  /// 特殊命令
  "JS実行": {
    type:"func",
    josi: [["を"],["で"]],
    fn: function (js) { return eval(js); },
  },
  ///型変換
  "変数型確認": {
    type:"func",
    josi: [["の"]],
    fn: function (v) { return typeof(v); },
  },
  "TYPEOF": {
    type:"func",
    josi: [["の"]],
    fn: function (v) { return typeof(v); },
  },
  "文字列変換": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return String(v); },
  },
  "TOSTR": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return String(v); },
  },
  "整数変換": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return parseInt(v); },
  },
  "TOINT": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return parseInt(v); },
  },
  "実数変換": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return parseFloat(v); },
  },
  "実数変換": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return parseFloat(v); },
  },
  "TOFLOAT": {
    type:"func",
    josi: [["を"]],
    fn: function (v) { return parseFloat(v); },
  },
  "INT": {
    type:"func", josi: [["の"]],
    fn: function (v) { return parseInt(v); },
  },
  "FLOAT": {
    type:"func", josi: [["の"]],
    fn: function (v) { return parseFloat(v); },
  },
  "HEX": {
    type:"func", josi: [["の"]],
    fn: function (a) { return parseInt(a).toString(16); },
  },
  /// 三角関数
  "SIN": {
    type:"func", josi: [["の"]],
    fn: function (v) { return Math.sin(v); },
  },
  "COS": {
    type:"func", josi: [["の"]],
    fn: function (v) { return Math.cos(v); },
  },
  "TAN": {
    type:"func", josi: [["の"]],
    fn: function (v) { return Math.tan(v); },
  },
  "ARCSIN": {
    type:"func", josi: [["の"]],
    fn: function (v) { return Math.asin(v); },
  },
  "ARCCOS": {
    type:"func", josi: [["の"]],
    fn: function (v) { return Math.acos(v); },
  },
  "ARCTAN": {
    type:"func", josi: [["の"]],
    fn: function (v) { return Math.atan(v); },
  },
  "RAD2DEG": {
    type:"func", josi: [["を"]],
    fn: function (v) { return v / Math.PI * 180; },
  },
  "DEG2RAD": {
    type:"func", josi: [["を"]],
    fn: function (v) { return (v / 180) * Math.PI; },
  },
  "度変換": {
    type:"func", josi: [["を"]],
    fn: function (v) { return v / Math.PI * 180; },
  },
  "ラジアン変換": {
    type:"func", josi: [["を"]],
    fn: function (v) { return (v / 180) * Math.PI; },
  },
  /// 算術関数
  "SIGN": {
    type:"func", josi: [["の"]],
    fn: function (v) { return (v == 0) ? 0 : (v > 0) ? 1 : -1; },
  },
  "ABS": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.abs(a) },
  },
  "EXP": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.exp(a) },
  },
  "HYPOT": {
    type:"func", josi: [["と"],["の"]],
    fn: function (a, b) { return Math.sqrt(a * b) },
  },
  "LN": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.log(a) },
  },
  "LOG": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.log(a) },
  },
  "LOGN": {
    type:"func", josi: [["で"],["の"]],
    fn: function (a, b) {
      if (a == 2) return Math.LOG2E * Math.log(b);
      if (a == 10) return Math.LOG10E * Math.log(b);
      return Math.log(b) / Math.log(a);
    },
  },
  "FRAC": {
    type:"func", josi: [["の"]],
    fn: function (a) { return a % 1 },
  },
  "乱数": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.floor(Math.random() * a); },
  },
  "SQRT": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.sqrt(a); },
  },
  "平方根": {
    type:"func", josi: [["の"]],
    fn: function (a) { return Math.sqrt(a); },
  },
  "RGB": {
    type:"func", josi: [["と"],["の"],["で"]],
    fn: function (r,g,b) {
      const z2 = (v)=>{ const v2 = "00" + parseInt(v).toString(16); return v2.substr(v2.length-2,2); };
      return '#' + z2(r) + z2(g) + z2(b);
    },
  },
  "ROUND": {
    type:"func", josi: [["を"]],
    fn: function (v) { return Math.round(v); },
  },
  "四捨五入": {
    type:"func", josi: [["を"]],
    fn: function (v) { return Math.round(v); },
  },
  "CEIL": {
    type:"func", josi: [["を"]],
    fn: function (v) { return Math.ceil(v); },
  },
  "切り上げ": {
    type:"func", josi: [["を"]],
    fn: function (v) { return Math.ceil(v); },
  },
  "FLOOR": {
    type:"func", josi: [["を"]],
    fn: function (v) { return Math.floor(v); },
  },
  "切り捨て": {
    type:"func", josi: [["を"]],
    fn: function (v) { return Math.floor(v); },
  },
  "NOT": {
    type:"func", josi: [["の"]],
    fn: function (v) { return (!v) ? 1 : 0; },
  },
  /// 論理演算
  "OR": {
    type:"func", josi: [["と"],["の"]],
    fn: function (a, b) { return (a || b) ? 1 : 0; },
  },
  "AND": {
    type:"func", josi: [["と"],["の"]],
    fn: function (a, b) { return (a && b) ? 1 : 0; },
  },
  "XOR": {
    type:"func", josi: [["と"],["の"]],
    fn: function (a, b) { return (a ^ b) ? 1 : 0; },
  },
  /// ビット演算
  "SHIFT_L": {
    type:"func", josi: [["を"],["で"]],
    fn: function (a, b) { return (a << b); },
  },
  "SHIFT_R": {
    type:"func", josi: [["を"],["で"]],
    fn: function (a, b) { return (a >> b); },
  },
  /// 文字列処理
  "文字数": {
    type:"func", josi: [["の"]],
    fn: function (v) { return String(v).length; },
  },
  "何文字目": {
    type:"func", josi: [["で","の"],["が"]],
    fn: function (s, a) { return String(s).indexOf(a) + 1; },
  },
  "CHR": {
    type:"func", josi: [["の"]],
    fn: function (v) { return String.fromCharCode(v); },
  },
  "ASC": {
    type:"func", josi: [["の"]],
    fn: function (v) { return String(v).charCodeAt(0); },
  },
  "文字挿入": {
    type:"func", josi: [["で","の"],["に","へ"],["を"]],
    fn: function (s, cnt, a) {
      if (cnt <= 0) cnt = 1;
      const ss = String(s);
      const mae = ss.substr(0, cnt -1);
      const usi = ss.substr(cnt - 1);
      return mae + a + usi;
    },
  },
  "文字検索": {
    type:"func", josi: [["で","の"],["を"]],
    fn: function (s, a) { return String(s).indexOf(a) + 1; },
  },
  "追加": { /// v1非互換
    type:"func", josi: [["で","に","へ"],["を"]],
    fn: function (s, a) { return String(s) + String(a); },
  },
  "一行追加": { /// v1非互換
    type:"func", josi: [["で","に","へ"],["を"]],
    fn: function (s, a) { return String(s) + String(a) + "\n"; },
  },
  "文字列分解": {
    type:"func", josi: [["を","の","で"]],
    fn: function (v) { return String(v).split(""); },
  },
  "リフレイン": { /// v1非互換
    type:"func", josi: [["を","の"],["で"]],
    fn: function (v, cnt) {
      let s = "";
      for (let i = 0; i < cnt; i++) s += String(v);
      return s;
    },
  },
  "出現回数": {
    type:"func", josi: [["で"],["の"]],
    fn: function (s, a) {
      let cnt = 0;
      const re = new RegExp(a.replace(/(.)/g,'\\$1'), 'g');
      String(s).replace(re, m=>{ cnt++; });
      return cnt;
    },
  },
  "MID": {
    type:"func", josi: [["で"],["から"],["を"]],
    fn: function (s, a, cnt) { return (String(s).substr(a-1,cnt)); }
  },
  "文字抜き出す": {
    type:"func", josi: [["で"],["から"],["を"]],
    fn: function (s, a, cnt) { return (String(s).substr(a-1,cnt)); }
  },
  
  /* --- */
  __print_log: {
    type:"var",
    value:"",
  },
  __print: function (s) {
    console.log(s);
    PluginSystem.__print_log.value += s + "\n";
  },
};

module.exports= PluginSystem;

