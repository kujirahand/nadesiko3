module.exposts = {
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
