/**
 * トークンを表すクラス
 * @class
 */
 const tokens = require('./tokens.js');
 
class Token {
  /**
   * @property {number} typeNo - トークンの種類
   * @property {?} token - トークンのラベル、または、数値
   */
  constructor(typeNo, token) {
    this.typeNo = typeNo;
    this.token = token;
  }
  toString() {
    const label = tokens.dict_a[this.typeNo];
    return `${this.token}:${label}`;
  }
  /**
   * 引数に指定したトークンタイプかどうかを判断
   * @param {Array.<number>} types - トークンタイプ番号
   * @return {boolean}
   */
  isType(types) {
    return (types.indexOf(this.typeNo) >= 0);
  }
}

module.exports = Token;
