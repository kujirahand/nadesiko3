#!/usr/bin/env node

const spawn = require('child_process').spawn
const path = require('path')
const nakoHome = path.resolve(path.join(__dirname, '../../'))
const cnako3 = path.resolve(path.join(nakoHome, 'src/cnako3.js'))
const nako3edit = path.resolve(path.join(__dirname, 'index.nako3'))

let proc = spawn('node', [cnako3, nako3edit])
proc.stdout.on('data', (data) => {
  console.log(data.toString())
})
