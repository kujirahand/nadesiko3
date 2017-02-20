// tokenizer
const tokens = require(__dirname + '/tokens.js');
const charunit = require(__dirname + '/charunit.js');
const Token = require(__dirname + '/token.js');

// Josi list
const JosiList = [
  "について", "ならば", "なら",
  "とは", "から", "まで", "して",
  "は","を","に","へ","で","と","が",
];
const Josi = {};
JosiList.forEach((e)=>{ Josi[e] = true; });

// Tokenizer class
class Tokenizer {
 
  static split(src) {
    const tok = new Tokenizer(src);
    tok.tokenize();
    return tok.result;
  }

  constructor(src) {
    this._src = src;
    this._res = [];
    this._josi = Josi;
    this._josilist = JosiList;
  }

  static get JosiList() {
    return JosiList;
  }

  get result() {
    return this._res;
  }
  
  static listToString(list) {
    const str = list.map((e)=>{
      return e.toString();
    }).join("|");
    return str;
  }
  
  convertToHalf(str) {
    const h1 = str.replace(/[！-～]/g, (t)=>{
      return String.fromCharCode(
        t.charCodeAt(0) - 0xFEE0
      );
    });
    const h2 = h1.replace(/”/g, "\"")
      .replace(/’/g, "'")
      .replace(/‘/g, "`")
      .replace(/￥/g, "\\")
      .replace(/　/g, " ")
      .replace(/〜/g, "~");
    return h2;
  }
  convertToHalfEx(str) {
    const h1 = this.convertToHalf(str);
    const h2 = h1.replace('。', ';')
                 .replace('、', ' ');
    return h2;
  }

  tokenize() {
    this._res = [];
    this._src = this.convertToHalfEx(this._src);
    this.skipSpace();
    while (!this.isEOF) {
      this.getToken();
      this.skipSpace();
    }
  }

  // ソースとなる文字列に対する操作
  peek() {
    const ch = this._src.charAt(0);
    return ch;
  }
  peekN(len) {
    return this._src.substr(0, len);
  }
  getChar() {
    const ch = this.peek();
    this._src = this._src.substr(1);
    return ch;
  }
  getCharN(len) {
    const s = this._src.substr(0, len);
    this._src = this._src.substr(len);
    return s;
  }
  ungetc(ch) {
    this._src = ch + this,_src;
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

  pushToken(typeNo, token) {
    if (typeNo == undefined) throw new Error('token push error:' + token);
    const t = new Token(typeNo, token);
    this._res.push(t);
    console.log("PUSH", t.toString());
  }

  getToken() {
    let s = "";   
    let ch = this.peek();
    // 辞書にある記号か
    if (typeof(tokens.dict[ch]) !== "undefined") {
      const typeNo = tokens.dict[ch];
      this.pushToken(typeNo, ch);
      this.getChar();
      return;
    }
    // 改行
    if (ch == '\n' || ch == ';') {
      this.pushToken(tokens.EOS, ch);
      this.getChar();
      return;
    }
    if (ch == ",") { this.getChar(); return; }
    // 数字
    if ('0' <= ch && ch <= '9') return this.getNumber();
    // 文字列
    if (ch == "「" || ch == "『" || ch == '"' || ch == "'") {
      return this.getString(ch);
    }
    // コメント
    let ch2 = this.peekN(2);
    if (ch == "#" || ch2 == "//") return this.skipLineComment();
    if (ch2 == "/*") return this.skipRangeComment();
    // 演算子
    if (ch2 == "<=" || ch2 == ">=" || ch2 == "!=" || 
        ch2 == "<>" || ch2 == "||" || ch2 == "&&" ) {
      this.pushToken(tokens.OP, ch2);
      this.getCharN(2);
      return;
    }
    if (ch == "+" || ch == "-" || ch == "*" || ch == "/" || 
        ch == "%" || ch == "^" || ch == "<" || ch == ">") {
      this.pushToken(tokens.OP, ch);
      this.getChar();
      return;
    }
    if (ch == "=") {
      this.pushToken(tokens.EQ, ch);
      this.getChar();
      return;
    }
    // 全角文字||アルファベットの連続
    if (this.checkZenAlphaToken(ch)) return;
    // 英語トークンの
    // その他
    this.pushToken(tokens.WORD, ch);
    this.getChar();
  }
  getJosi() {
    for (const i in JosiList) {
      const jo = JosiList[i];
      if (this.peekN(jo.length) === jo) {
        return jo;
      }
    }
    return null;
  }
  // 全角||アルファベットトークンの取得 --- 助詞があるまで取得
  checkZenAlphaToken(ch) {
    if (!charunit.isWord(ch)) return false;
    let word = "";
    let josi = null;
    let typeNo = tokens.WORD;
    while (!this.isEOF) {
      let c = this.peek();
      if (!charunit.isWord(c)) break;
      word += c;
      this.getChar();
      // もしも辞書にある単語だった場合
      if (typeof(tokens.dict[word]) !== "undefined") {
        typeNo = tokens.dict[word];
        josi = this.getJosi();
        break;
      }
      // 助詞があった場合
      josi = this.getJosi();
      if (josi !== null) break;
    }
    if (word.length > 0) {
      this.pushToken(typeNo, word);
    }
    if (josi !== null) {
      this.pushToken(tokens.JOSI, josi);
      this.getCharN(josi.length);
    }
    return true;
  }
  
  static removeLastKana(str) {
    let word = "";
    for (let i = 0; i < str.length; i++) {
      const ch = str.charAt(i);
      if (!charunit.isHiragana(ch)) {
        word += ch;
      }
    }
    if (word == "") return str;
    return word;
  }
  
  skipLineComment() {
    while (!this.isEOF) {
      const ch = this.getChar();
      if (ch == "\n") break;
    }
  }
  skipRangeComment() {
    while (!this.isEOF) {
      const ch2 = this.peekN(2);
      if (ch2 == "*/") {
        this.getCharN(2);
        break;
      }
      this.getChar();
    }
  }

  checkJosi() {
    // 助詞判定
    let ch = this.peek();
    if (!charunit.isHiragana(ch)) return false;
    let josi = this.getJosi();
    if (josi == null) return false;
    this.pushToken(tokens.JOSI, josi);
    this.getCharN(josi.length);
    return true;
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

// exports
module.exports = Tokenizer;


