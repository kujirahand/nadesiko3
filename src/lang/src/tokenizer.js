// tokenizer
const tokens = require('./tokens.js');

class Token {
  constructor(type, token) {
    this.type = type;
    this.token = token;
  }
}

class Tokenizer {
  
  constructor(src) {
    this._src = src;
    this._josi = {};
    this._dic = {};
    this._res = [];
    this.initDic();
  }
  
  initDic() {
    // josi
    const josi = [
      "について",
      "とは", "から", "まで", "して",
      "は","を","に","へ","で","と",
    ];
    josi.forEach((e)=>{
      this._josi[e] = true;
    });
    this._josilist = josi;
    // dic
    this._dic = {
      "。":";", "、":",",
      "（":"(", "）":")",
      "＋":"+", "−": "-", "×": "*", "÷":"/", "＊":"*", "／":"/","＾":"^",
      "％":"%",
    };
  }

  get result() {
    return this._res;
  }

  tokenize() {
    this._res = [];
    while (!this.isEOF) {
      this.getToken();
    }
  }

  peek() {
    return this._src.charAt(0);
  }

  getChar() {
    const ch = this._src.charAt(0);
    this._src = this._src.substr(1);
    return ch;
  }

  get isEOF() {
    return (this._src.length == 0);
  }

  skipSpaceRet() {
    while (!this.isEOF) {
      let ch = this.peek();
      if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n') {
        this.getChar();
      } else break;
    }
  }
  skipSpace() {
    while (!this.isEOF) {
      let ch = this.peek();
      if (ch == ' ' || ch == '\t' || ch == '\r') {
        this.getChar();
      } else break;
    }
  }

  pushToken(type, token) {
    if (type == undefined) throw new Exception('token push error');
    console.log("PUSH", token, type);
    this._res.push(new Token(type, token));
  }

  getToken() {
    this.skipSpace();
    let s = "";   
    let ch = this.peek();
    if (this._dic[ch] !== undefined) ch = this._dic[ch];
    // 演算子
    if (ch == "+" || ch == "-" || ch == "*" || ch == "/" || 
        ch == "%" || ch == "^") {
      this.pushToken(tokens.OP, ch);
      this.getChar();
      return;
    }
    // 改行
    if (ch == '\n') {
      this.pushToken(tokens.RET, ch);
      this.getChar();
      return;
    }
    // 数字
    if ('0' <= ch && ch <= '9') {
      return this.getNumber();
    }
    // 文字列
    if (ch == "「" || ch == "『" || ch == '"' || ch == "'") {
      return this.getString(ch);
    }
    // その他
    this.pushToken(tokens.WORD, ch);
    this.getChar();
  }
  
  isHiragana(c) {
    return ('ぁ' <= c && c <= 'ん');
  }

  checkJosi() {
    // 助詞判定
    let ch = this.peek();
    if (this.isHiragana(ch)) {
      let hira = "";
      while (!this.isEOF) {
        let ch = this.peek();
        if (this.isHiragana(ch)) {
          hira += ch;
          this.getChar();
          if (typeof(this._josi[hira]) == "boolean") {
            this.pushToken(tokens.JOSI, hira);
            return;
          }
        }
        break
      }
      // 助詞ではなかったので書き戻す
      this._src = hira + this._src;
    }
  }
  
  getNumber() {
    let s = "";
    while (!this.isEOF) {
      let ch = this.peek();
      if ('0' <= ch && ch <= '9' || ch == '.') {
        s += ch;
        this.getChar();
      } else break;
    }
    this.pushToken(tokens.NUM, parseFloat(s));
    this.checkJosi();
  }
  getString(ch) {
    // begin char
    let end_ch = ch;
    if (ch == "「") end_ch = "」";
    else if (ch == "『") end_ch = "』";
    this.getChar();
    // search end char
    let s = "";
    while (!this.isEOF) {
      let c = this.getChar();
      if (c == end_ch) break;
      s += c;
    }
    this.pushToken(tokens.STR, s);
    this.checkJosi();
  }
}

module.exports = {
  "Tokenizer": Tokenizer
};


