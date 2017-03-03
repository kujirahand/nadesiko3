// basic_func.js
var PluginSystem = {
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
  "JS実行": {
    type:"func",
    josi: [["を"],["で"]],
    fn: function (js) { return eval(js); },
  },
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
  "SIGN": {
    type:"func", josi: [["の"]],
    fn: function (v) { return (v == 0) ? 0 : (v > 0) ? 1 : -1; },
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

