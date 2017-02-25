// basic_func.js

module.exports= {
  "足す": {
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a + b; },
  },
  "引く": {
    josi: [["から"],["を"]],
    fn: function (a, b) { return a - b; },
  },
  "掛ける": {
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a * b; },
  },
  "割る": {
    josi: [["を"],["で"]],
    fn: function (a, b) { return a / b; },
  },
  "表示": {
    josi: [["を","と"]],
    fn: function (s) { this.__print(s); },
  },
  /* --- */
  __print: function (s) {
    console.log(s);
  },
  /**
   * @param {string} name - Function name
   * @return {number}
   */
  getArgLength: function (name) {
    const f = this[name];
    if (!f) return 0;
    return f.length; // (function(){}).length で関数の引数の数を返す
  }
};

