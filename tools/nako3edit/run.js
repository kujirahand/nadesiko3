const exec = require('child_process').exec
const spawn = require('child_process').spawn
const execSync = require('child_process').execSync
const opener = require('opener')
const path = require('path')
const nako_home = path.resolve(path.join(__dirname, '../../'))
const cnako3 = path.resolve(path.join(nako_home, 'src/cnako3.js'))
const nako3edit = path.resolve(path.join(__dirname, 'index.nako3'))

const cmd = `node "${cnako3}/" "${nako3edit}"`
let proc = spawn('node', [cnako3, nako3edit])
proc.stdout.on('data', (data) => {
  console.log(data.toString())
})
setTimeout(() => {
  opener("http://localhost:3030")
}, 2000)

