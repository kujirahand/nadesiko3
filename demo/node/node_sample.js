'use strict'

const NakoCompiler = require('../../src/nako3')
const PluginSystem = require('../../src/plugin_system')

const nako = new NakoCompiler()
const js = nako.compile('「こんにちは」と表示。')
const vars = nako.getVarsCode()
const head = nako.getHeader()
const code = head + vars + js

console.log('--- generated ---')
console.log(code)
console.log('--- eval ---')
eval(code)
