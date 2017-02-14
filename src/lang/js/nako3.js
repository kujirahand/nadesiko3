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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// tokenizer
var tokens = __webpack_require__(1);

var Token = function Token(type, token) {
  _classCallCheck(this, Token);

  this.type = type;
  this.token = token;
};

var Tokenizer = function () {
  function Tokenizer(src) {
    _classCallCheck(this, Tokenizer);

    this._src = src;
    this._josi = {};
    this._dic = {};
    this._res = [];
    this.initDic();
  }

  _createClass(Tokenizer, [{
    key: "initDic",
    value: function initDic() {
      var _this = this;

      // josi
      var josi = ["について", "とは", "から", "まで", "して", "は", "を", "に", "へ", "で", "と"];
      josi.forEach(function (e) {
        _this._josi[e] = true;
      });
      this._josilist = josi;
      // dic
      this._dic = {
        "。": ";", "、": ",",
        "（": "(", "）": ")",
        "＋": "+", "−": "-", "×": "*", "÷": "/", "＊": "*", "／": "/", "＾": "^",
        "％": "%"
      };
    }
  }, {
    key: "tokenize",
    value: function tokenize() {
      this._res = [];
      while (!this.isEOF) {
        this.getToken();
      }
    }
  }, {
    key: "peek",
    value: function peek() {
      return this._src.charAt(0);
    }
  }, {
    key: "getChar",
    value: function getChar() {
      var ch = this._src.charAt(0);
      this._src = this._src.substr(1);
      return ch;
    }
  }, {
    key: "skipSpaceRet",
    value: function skipSpaceRet() {
      while (!this.isEOF) {
        var ch = this.peek();
        if (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n') {
          this.getChar();
        } else break;
      }
    }
  }, {
    key: "skipSpace",
    value: function skipSpace() {
      while (!this.isEOF) {
        var ch = this.peek();
        if (ch == ' ' || ch == '\t' || ch == '\r') {
          this.getChar();
        } else break;
      }
    }
  }, {
    key: "pushToken",
    value: function pushToken(type, token) {
      if (type == undefined) throw new Exception('token push error');
      console.log("PUSH", token, type);
      this._res.push(new Token(type, token));
    }
  }, {
    key: "getToken",
    value: function getToken() {
      this.skipSpace();
      var s = "";
      var ch = this.peek();
      if (this._dic[ch] !== undefined) ch = this._dic[ch];
      // 演算子
      if (ch == "+" || ch == "-" || ch == "*" || ch == "/" || ch == "%" || ch == "^") {
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
  }, {
    key: "isHiragana",
    value: function isHiragana(c) {
      return 'ぁ' <= c && c <= 'ん';
    }
  }, {
    key: "checkJosi",
    value: function checkJosi() {
      // 助詞判定
      var ch = this.peek();
      if (this.isHiragana(ch)) {
        var hira = "";
        while (!this.isEOF) {
          var _ch = this.peek();
          if (this.isHiragana(_ch)) {
            hira += _ch;
            this.getChar();
            if (typeof this._josi[hira] == "boolean") {
              this.pushToken(tokens.JOSI, hira);
              return;
            }
          }
          break;
        }
        // 助詞ではなかったので書き戻す
        this._src = hira + this._src;
      }
    }
  }, {
    key: "getNumber",
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
    key: "getString",
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
    key: "result",
    get: function get() {
      return this._res;
    }
  }, {
    key: "isEOF",
    get: function get() {
      return this._src.length == 0;
    }
  }]);

  return Tokenizer;
}();

module.exports = {
  "Tokenizer": Tokenizer
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  NOP: 'NOP',
  OP: 'OP',
  RET: 'RET',
  WORD: 'WORD',
  NUM: 'NUM',
  STR: 'STR',
  JOSI: 'JOSI'
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//
// nadesiko ver3
//

if ((typeof navigator === "undefined" ? "undefined" : _typeof(navigator)) == "object") {
  setTimeout(function () {
    nako3_browser();
  }, 1);
}

function nako3_browser() {
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
  var Tokenizer = __webpack_require__(0).Tokenizer;
  var tok = new Tokenizer(code);
  tok.tokenize();
  var tokenlist = tok.result;
  console.log(tokenlist);
  // tokenize
  // compile
  // run
}

/***/ })
/******/ ]);