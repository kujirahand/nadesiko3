/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// tokenizer
var tokens = __webpack_require__(2);
var charunit = __webpack_require__(5);

// Token class

var Token = function () {
  function Token(typeNo, token) {
    _classCallCheck(this, Token);

    this.typeNo = typeNo;
    this.token = token;
  }

  _createClass(Token, [{
    key: 'toString',
    value: function toString() {
      var label = tokens.dict_a[this.typeNo];
      return this.token + ':' + label;
    }
  }]);

  return Token;
}();

// Josi list


var JosiList = ["について", "ならば", "なら", "とは", "から", "まで", "して", "は", "を", "に", "へ", "で", "と", "が"];
var Josi = {};
JosiList.forEach(function (e) {
  Josi[e] = true;
});

// Tokenizer class

var Tokenizer = function () {
  _createClass(Tokenizer, null, [{
    key: 'split',
    value: function split(src) {
      var tok = new Tokenizer(src);
      tok.tokenize();
      return tok.result;
    }
  }]);

  function Tokenizer(src) {
    _classCallCheck(this, Tokenizer);

    this._src = src;
    this._res = [];
    this._josi = Josi;
    this._josilist = JosiList;
  }

  _createClass(Tokenizer, [{
    key: 'convertToHalf',
    value: function convertToHalf(str) {
      var h1 = str.replace(/[！-～]/g, function (t) {
        return String.fromCharCode(t.charCodeAt(0) - 0xFEE0);
      });
      var h2 = h1.replace(/”/g, "\"").replace(/’/g, "'").replace(/‘/g, "`").replace(/￥/g, "\\").replace(/　/g, " ").replace(/〜/g, "~");
      return h2;
    }
  }, {
    key: 'convertToHalfEx',
    value: function convertToHalfEx(str) {
      var h1 = this.convertToHalf(str);
      var h2 = h1.replace('。', ';').replace('、', ' ');
      return h2;
    }
  }, {
    key: 'tokenize',
    value: function tokenize() {
      this._res = [];
      this._src = this.convertToHalfEx(this._src);
      this.skipSpace();
      while (!this.isEOF) {
        this.getToken();
        this.skipSpace();
      }
    }

    // ソースとなる文字列に対する操作

  }, {
    key: 'peek',
    value: function peek() {
      var ch = this._src.charAt(0);
      return ch;
    }
  }, {
    key: 'peekN',
    value: function peekN(len) {
      return this._src.substr(0, len);
    }
  }, {
    key: 'getChar',
    value: function getChar() {
      var ch = this.peek();
      this._src = this._src.substr(1);
      return ch;
    }
  }, {
    key: 'getCharN',
    value: function getCharN(len) {
      var s = this._src.substr(0, len);
      this._src = this._src.substr(len);
      return s;
    }
  }, {
    key: 'ungetc',
    value: function ungetc(ch) {
      this._src = ch + this, _src;
    }
  }, {
    key: 'skipSpaceRet',
    value: function skipSpaceRet() {
      while (!this.isEOF) {
        var ch = this.peek();
        if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n') {
          this.getChar();
        } else break;
      }
    }
  }, {
    key: 'skipSpace',
    value: function skipSpace() {
      while (!this.isEOF) {
        var ch = this.peek();
        if (ch == ' ' || ch == '\t' || ch == '\r') {
          this.getChar();
        } else break;
      }
    }
  }, {
    key: 'pushToken',
    value: function pushToken(typeNo, token) {
      if (typeNo == undefined) throw new Error('token push error');
      var t = new Token(typeNo, token);
      this._res.push(t);
      console.log("PUSH", t.toString());
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      var s = "";
      var ch = this.peek();
      // 辞書にある記号か
      if (typeof tokens.dict[ch] !== "undefined") {
        var typeNo = tokens.dict[ch];
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
      if (ch == ",") {
        this.getChar();return;
      }
      // 数字
      if ('0' <= ch && ch <= '9') return this.getNumber();
      // 文字列
      if (ch == "「" || ch == "『" || ch == '"' || ch == "'") {
        return this.getString(ch);
      }
      // コメント
      var ch2 = this.peekN(2);
      if (ch == "#" || ch2 == "//") return this.skipLineComment();
      if (ch2 == "/*") return this.skipRangeComment();
      // 演算子
      if (ch == "+" || ch == "-" || ch == "*" || ch == "/" || ch == "%" || ch == "^") {
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
  }, {
    key: 'getJosi',
    value: function getJosi() {
      for (var i in JosiList) {
        var jo = JosiList[i];
        if (this.peekN(jo.length) === jo) {
          return jo;
        }
      }
      return null;
    }
    // 全角||アルファベットトークンの取得 --- 助詞があるまで取得

  }, {
    key: 'checkZenAlphaToken',
    value: function checkZenAlphaToken(ch) {
      if (!charunit.isWord(ch)) return false;
      var word = "";
      var josi = null;
      var typeNo = tokens.WORD;
      while (!this.isEOF) {
        var c = this.peek();
        if (!charunit.isWord(c)) break;
        word += c;
        this.getChar();
        // もしも辞書にある単語だった場合
        if (typeof tokens.dict[word] !== "undefined") {
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
  }, {
    key: 'skipLineComment',
    value: function skipLineComment() {
      while (!this.isEOF) {
        var ch = this.getChar();
        if (ch == "\n") break;
      }
    }
  }, {
    key: 'skipRangeComment',
    value: function skipRangeComment() {
      while (!this.isEOF) {
        var ch2 = this.peekN(2);
        if (ch2 == "*/") {
          this.getCharN(2);
          break;
        }
        this.getChar();
      }
    }
  }, {
    key: 'checkJosi',
    value: function checkJosi() {
      // 助詞判定
      var ch = this.peek();
      if (!charunit.isHiragana(ch)) return false;
      var josi = this.getJosi();
      if (josi == null) return false;
      this.pushToken(tokens.JOSI, josi);
      this.getCharN(josi.length);
      return true;
    }
  }, {
    key: 'getNumber',
    value: function getNumber() {
      var s = "";
      while (!this.isEOF) {
        var ch = this.peek();
        if ('0' <= ch && ch <= '9' || ch == '.') {
          s += ch;
          this.getChar();
        } else break;
      }
      this.pushToken(tokens.NUM, parseFloat(s));
      this.checkJosi();
    }
  }, {
    key: 'getString',
    value: function getString(ch) {
      // begin char
      var end_ch = ch;
      if (ch == "「") end_ch = "」";else if (ch == "『") end_ch = "』";
      this.getChar();
      // search end char
      var s = "";
      while (!this.isEOF) {
        var c = this.getChar();
        if (c == end_ch) break;
        s += c;
      }
      this.pushToken(tokens.STR, s);
      this.checkJosi();
    }
  }, {
    key: 'result',
    get: function get() {
      return this._res;
    }
  }, {
    key: 'isEOF',
    get: function get() {
      return this._src.length == 0;
    }
  }], [{
    key: 'listToString',
    value: function listToString(list) {
      var str = list.map(function (e) {
        return e.toString();
      }).join("|");
      return str;
    }
  }, {
    key: 'removeLastKana',
    value: function removeLastKana(str) {
      var word = "";
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        if (!charunit.isHiragana(ch)) {
          word += ch;
        }
      }
      if (word == "") return str;
      return word;
    }
  }]);

  return Tokenizer;
}();

// exports


module.exports = {
  "Tokenizer": Tokenizer,
  "Token": Token,
  "JosiList": JosiList
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/// generated by batch_nodetypes.js
module.exports = {
  "dict_a": ["NOP", "LET", "VALUE", "PRINT", "NUM", "STR"],
  "NOP": 0,
  "LET": 1,
  "VALUE": 2,
  "PRINT": 3,
  "NUM": 4,
  "STR": 5
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/// generated by batch_tokens.js
module.exports = {
  "dict": {
    "___NOP___": 0,
    "JOSI": 1,
    "WORD": 2,
    "NUM": 3,
    "STR": 4,
    "EOS": 5,
    "SPL": 6,
    "反復": 7,
    "もし": 8,
    "OP": 9,
    "繰返": 10,
    "EQ": 11,
    "表示": 12,
    "間": 13,
    "(": 14,
    ")": 15
  },
  "dict_a": ["NOP", "JOSI", "WORD", "NUM", "STR", "EOS", "SPL", "EACH", "IF", "OP", "FOR", "EQ", "PRINT", "WHILE", "PAREN_BEGIN", "PAREN_END"],
  "NOP": 0,
  "JOSI": 1,
  "WORD": 2,
  "NUM": 3,
  "STR": 4,
  "EOS": 5,
  "SPL": 6,
  "EACH": 7,
  "IF": 8,
  "OP": 9,
  "FOR": 10,
  "EQ": 11,
  "PRINT": 12,
  "WHILE": 13,
  "PAREN_BEGIN": 14,
  "PAREN_END": 15
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// jsgenerator.js

var ntypes = __webpack_require__(1);

var JSGenerator = function () {
  _createClass(JSGenerator, null, [{
    key: "generate",
    value: function generate(node) {
      var useHeader = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var jsgen = new JSGenerator(node);
      var code = jsgen.c_gen(null);
      var head = jsgen.header;
      if (useHeader) {
        return head + "\n" + code;
      } else {
        return code;
      }
    }
  }]);

  function JSGenerator(root) {
    _classCallCheck(this, JSGenerator);

    this.root = root;
    this.header = this.genHeader();
  }

  _createClass(JSGenerator, [{
    key: "genHeader",
    value: function genHeader() {
      return "" + "const __vars = {};\n" + "const __print = (s)=>{ console.log(s); };\n";
    }
  }, {
    key: "c_gen",
    value: function c_gen(node) {
      if (node == null) node = this.root;
      var code = "";
      while (node != null) {
        switch (node.typeNo) {
          case ntypes.NOP:
            code += "";
            break;
          case ntypes.LET:
            code += this.c_let(node) + "\n";
            break;
          case ntypes.PRINT:
            code += this.c_print(node) + "\n";
            break;
          case ntypes.VALUE:
            code += JSON.stringify(node.value);
            break;
        }
        node = node.next;
      }
      console.log(code);
      return code;
    }
  }, {
    key: "c_let",
    value: function c_let(node) {
      var name = node.value;
      var code = this.c_gen(node.children[0]);
      console.log(code);
      return "__vars['" + name + "'] = " + code + ";";
    }
  }, {
    key: "c_print",
    value: function c_print(node) {
      var code = this.c_gen(node.children[0]);
      console.log(code);
      return "__print(" + code + ");";
    }
  }]);

  return JSGenerator;
}();

module.exports = {
  "JSGenerator": JSGenerator
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// parser.js
var tokens = __webpack_require__(2);
var ntypes = __webpack_require__(1);
var tokenizer_js = __webpack_require__(0);
var Tokenizer = tokenizer_js.Tokenizer;
var Token = tokenizer_js.Token;

var SNode = function () {
  function SNode(typeNo, value) {
    _classCallCheck(this, SNode);

    this.typeNo = typeNo;
    this.value = value;
    this.children = [];
    this.next = null;
  }

  _createClass(SNode, [{
    key: 'addChild',
    value: function addChild(n) {
      this.children.push(n);
    }
  }, {
    key: 'addNext',
    value: function addNext(node) {
      var n = this;
      for (;;) {
        if (n.next == null) {
          n.next = node;
          break;
        }
        n = n.next;
      }
    }
  }, {
    key: 'toString',
    value: function toString() {
      var v = this.value;
      if (v == undefined || v == null) v = "";
      return ntypes.dict_a[this.typeNo] + ":" + this.value;
    }
  }, {
    key: 'toStringEx',
    value: function toStringEx() {
      var res = [this.toString()];
      // children
      for (var i in this.children) {
        var n = this.children[i];
        res.push(n.toStringEx());
      }
      return res.join("|");
    }
  }, {
    key: 'toStringAll',
    value: function toStringAll() {
      var res = [this.toStringEx()];
      // next
      var cur = this.next;
      while (cur != null) {
        res.push(cur.toStringEx());
        cur = cur.next;
      }
      return res.join("|");
    }
  }]);

  return SNode;
}();

var Parser = function () {
  function Parser(list) {
    _classCallCheck(this, Parser);

    this.root = this.cur = new SNode(ntypes.NOP, '#');
    this.list = list;
    this.index = 0;
  }

  _createClass(Parser, [{
    key: 'peek',
    value: function peek() {
      return this.list[this.index];
    }
  }, {
    key: 'next',
    value: function next() {
      return this.list[this.index++];
    }
  }, {
    key: 'prev',
    value: function prev() {
      tihs.index--;
    }
  }, {
    key: 'matchType',
    value: function matchType(pat) {
      for (var i = 0; i < pat.length; i++) {
        var idx = this.index + i;
        if (idx >= this.list.length) return false;
        var t = this.list[idx];
        if (t.typeNo != pat[i]) return false;
      }
      return true;
    }
  }, {
    key: 'match',
    value: function match(pat) {
      for (var i = 0; i < pat.length; i++) {
        var idx = this.index + i;
        if (idx >= this.list.length) return false;
        var t = this.list[idx];
        if (t.token != pat[i]) return false;
      }
      return true;
    }
  }, {
    key: 'exec',
    value: function exec() {
      while (!this.isEOF) {
        var prev_index = this.index;
        // console.log("exec=", this.index);
        // # EOS
        this.p_skipEOS();
        // # SENTENSE
        var n = this.p_sentense();
        if (n) {
          this.cur.next = n;
          this.cur = n;
        } else {
          if (prev_index == this.index) this.next();
        }
      }
    }
  }, {
    key: 'p_skipEOS',
    value: function p_skipEOS() {
      while (!this.isEOF) {
        var t = this.peek();
        if (t.typeNo == tokens.EOS) {
          this.next();
          continue;
        }
        break;
      }
    }
  }, {
    key: 'p_sentense',
    value: function p_sentense() {
      // # LET
      var n = this.p_let(null);
      if (n) return n;
      // # PRINT
      n = this.p_print(null);
      if (n) return n;
      return null;
    }
  }, {
    key: 'p_print',
    value: function p_print() {
      // # VALUE JOSI PRINT
      var tmp = this.index;
      var node_value = this.p_value();
      if (node_value == null) return null;
      if (this.matchType([tokens.JOSI, tokens.PRINT])) {
        this.index += 2;
        var node_print = new SNode(ntypes.PRINT, "");
        node_print.addChild(node_value);
        return node_print;
      }
      this.index = tmp;
      return null;
    }
  }, {
    key: 'p_let',
    value: function p_let() {
      // # WORD EQ VALUE
      if (this.matchType([tokens.WORD, tokens.EQ])) {
        console.log("WORD EQ VALUE");
        var t_name = this.next();
        var t_eq = this.next();
        var value_node = this.p_value();
        var let_node = new SNode(ntypes.LET, t_name.token);
        let_node.addChild(value_node);
        return let_node;
      }
      return null;
    }
  }, {
    key: 'p_value',
    value: function p_value() {
      var t = this.peek();
      if (t == undefined) return null;
      // # NUM || STR
      if (t.typeNo == tokens.NUM || t.typeNo == tokens.STR) {
        console.log("p_value=", t);
        this.next();
        var node_value = new SNode(ntypes.VALUE, t.token);
        return node_value;
      }
      return null;
    }
  }, {
    key: 'result',
    get: function get() {
      return this.root;
    }
  }, {
    key: 'isEOF',
    get: function get() {
      return this.index >= this.list.length;
    }
  }], [{
    key: 'parse',
    value: function parse(list) {
      var p = new Parser(list);
      p.exec();
      return p.result;
    }
  }]);

  return Parser;
}();

module.exports = {
  "Parser": Parser,
  "SNode": SNode
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// charunit.js

// コードの範囲
var KANJI_BEGIN = String.fromCharCode(0x4E00);
var KANJI_END = String.fromCharCode(0x9FFF);
var HANKAKU_END = String.fromCharCode(0xFF);
module.exports = {
  "KANJI_BEGIN": KANJI_BEGIN,
  "KANJI_END": KANJI_END,
  isHankaku: function isHankaku(c) {
    return c <= HANKAKU_END;
  },
  isZenkaku: function isZenkaku(c) {
    return c > HANKAKU_END;
  },
  isHiragana: function isHiragana(c) {
    return 'ぁ' <= c && c <= 'ん';
  },
  isKatakana: function isKatakana(c) {
    return 'ァ' <= c && c <= 'ヶ';
  },
  isKanji: function isKanji(c) {
    return KANJI_BEGIN <= c && c <= KANJI_END;
  },
  isAlpha: function isAlpha(c) {
    return 'a' <= c && c <= 'z' || 'A' <= c && c <= 'Z';
  },
  isWord: function isWord(c) {
    return this.isAlpha(c) || c == '_' || this.isHiragana(c) || this.isKatakana(c) || this.isKanji(c);
  }
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//
// nadesiko ver3
//

// なでしこのグローバル変数
var __vars = {};
var __print = function __print(msg) {
  console.log(msg);
};

if ((typeof navigator === "undefined" ? "undefined" : _typeof(navigator)) == "object") {
  setTimeout(function () {
    nako3_browser();
  }, 1);
}

function nako3_browser() {
  // 書き換え
  __print = function __print(msg) {
    var e = document.getElementById("info");
    e.innerHTML += msg;
  };
  // スクリプトタグの中身を得る
  var scripts = document.querySelectorAll("script");
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    var type = script.type;
    if (type == "nako" || type == "なでしこ") {
      nako3_browser_run_script(script);
    }
  }
}

function nako3_browser_run_script(script) {
  var code = script.text;
  var type = script.type;
  var option = script.option;
  nako3_run(code);
}

function nako3_run(code) {
  console.log("今作ってます。");
  //
  var Tokenizer = __webpack_require__(0).Tokenizer;
  var Parser = __webpack_require__(4).Parser;
  var JSGenerator = __webpack_require__(3).JSGenerator;
  //
  var list = Tokenizer.split(code);
  var node = Parser.parse(list);
  var js = JSGenerator.generate(node, false);
  console.log(js);
  eval(js);
}

/***/ })
/******/ ]);