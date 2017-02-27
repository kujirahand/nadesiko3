// basic_func.js
var NakoBasicFunc = {
  "表示": {
    josi: [["を","と"]],
    fn: function (s) { NakoBasicFunc.__print(s); }
  },
  "言": {
    josi: [["を","と"]],
    fn: function (s) { NakoBasicFunc.__print(s); }
  },
  "尋": {
    josi: [["と","を"]],
    fn: function (s) {
      const r = prompt(s);
      if (r.match(/^[0-9\.]+$/)) return parseFloat(r);
      return r;
    }
  },
  "足": {
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a + b; },
  },
  "引": {
    josi: [["から"],["を"]],
    fn: function (a, b) { return a - b; },
  },
  "掛": {
    josi: [["に","と"],["を"]],
    fn: function (a, b) { return a * b; },
  },
  "割": {
    josi: [["を"],["で"]],
    fn: function (a, b) { return a / b; },
  },
  /* --- */
  __print_log: "",
  __print: function (s) {
    console.log(s);
    NakoBasicFunc.__print_log += s + "\n";
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

module.exports= NakoBasicFunc;

