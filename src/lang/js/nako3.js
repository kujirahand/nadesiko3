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
  // tokenize
  // compile
  // run
}
