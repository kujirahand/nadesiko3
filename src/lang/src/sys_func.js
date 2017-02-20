module.exposts = {
  "足す": function (a, b) { return a + b; },
  "引く": function (a, b) { return a - b; },
  "掛ける": function (a, b) { return a * b; },
  "割る": function (a, b) { return a / b; },
  
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
