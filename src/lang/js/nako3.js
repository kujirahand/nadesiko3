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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nmodule.exports = {\n  print: function print(msg) {\n    console.log(msg);\n  }\n};//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvdGVzdC5qcz9mNmMyIl0sInNvdXJjZXNDb250ZW50IjpbIlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByaW50OiBmdW5jdGlvbiAobXNnKSB7XG4gICAgY29uc29sZS5sb2cobXNnKTtcbiAgfVxufTtcblxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHNyYy90ZXN0LmpzIl0sIm1hcHBpbmdzIjoiOztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBSEEiLCJzb3VyY2VSb290IjoiIn0=");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _typeof = typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; };\n\n//\n// nadesiko ver3\n//\nvar test = __webpack_require__(0);\ntest.print('hoge2');\n\nif ((typeof navigator === 'undefined' ? 'undefined' : _typeof(navigator)) == \"object\") {\n  setTimeout(function () {\n    nako3_browser();\n  }, 1);\n}\n\nfunction nako3_browser() {\n  // スクリプトタグの中身を得る\n  var scripts = document.querySelectorAll(\"script\");\n  for (var i = 0; i < scripts.length; i++) {\n    var script = scripts[i];\n    var type = script.type;\n    if (type == \"nako\" || type == \"なでしこ\") {\n      nako3_browser_run_script(script);\n    }\n  }\n}\n\nfunction nako3_browser_run_script(script) {\n  var code = script.text;\n  var type = script.type;\n  var option = script.option;\n  nako3_run(code);\n}\n\nfunction nako3_run(code) {\n  console.log(\"今作ってます。\");\n  // tokenize\n  // compile\n  // run\n}//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMS5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvbmFrbzMuanM/ZGYwOSJdLCJzb3VyY2VzQ29udGVudCI6WyIvL1xuLy8gbmFkZXNpa28gdmVyM1xuLy9cbmNvbnN0IHRlc3QgPSByZXF1aXJlKCcuL3Rlc3QnKTtcbnRlc3QucHJpbnQoJ2hvZ2UyJyk7XG5cblxuaWYgKHR5cGVvZihuYXZpZ2F0b3IpID09IFwib2JqZWN0XCIpIHtcbiAgc2V0VGltZW91dCgoKT0+e1xuICAgIG5ha28zX2Jyb3dzZXIoKTtcbiAgfSwxKTtcbn1cblxuZnVuY3Rpb24gbmFrbzNfYnJvd3Nlcigpe1xuICAvLyDjgrnjgq/jg6rjg5fjg4jjgr/jgrDjga7kuK3ouqvjgpLlvpfjgotcbiAgbGV0IHNjcmlwdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwic2NyaXB0XCIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgc2NyaXB0ID0gc2NyaXB0c1tpXTtcbiAgICBsZXQgdHlwZSA9IHNjcmlwdC50eXBlO1xuICAgIGlmICh0eXBlID09IFwibmFrb1wiIHx8IHR5cGUgPT1cIuOBquOBp+OBl+OBk1wiKSB7XG4gICAgICBuYWtvM19icm93c2VyX3J1bl9zY3JpcHQoc2NyaXB0KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbmFrbzNfYnJvd3Nlcl9ydW5fc2NyaXB0KHNjcmlwdCkge1xuICBsZXQgY29kZSA9IHNjcmlwdC50ZXh0O1xuICBsZXQgdHlwZSA9IHNjcmlwdC50eXBlO1xuICBsZXQgb3B0aW9uID0gc2NyaXB0Lm9wdGlvbjtcbiAgbmFrbzNfcnVuKGNvZGUpO1xufVxuXG5mdW5jdGlvbiBuYWtvM19ydW4oY29kZSkge1xuICBjb25zb2xlLmxvZyhcIuS7iuS9nOOBo+OBpuOBvuOBmeOAglwiKTtcbiAgLy8gdG9rZW5pemVcbiAgLy8gY29tcGlsZVxuICAvLyBydW5cbn1cblxuXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gc3JjL25ha28zLmpzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==");

/***/ })
/******/ ]);