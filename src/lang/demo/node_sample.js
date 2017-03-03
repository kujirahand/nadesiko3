"use strict";

const NakoCompiler = require('../src/nako3.js');
const PluginSystem = require('../src/plugin_system.js');

const nako = new NakoCompiler();
const js = nako.compile('「こんにちは」と表示。');
const vars = nako.getVarsCode();
const head = nako.getHeader();
const code = head + vars + js;

console.log(code);
eval(code);

