#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'

// __dirname のために
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nakoHome = path.resolve(path.join(__dirname, '../../'))
const cnako3 = path.resolve(path.join(nakoHome, 'src/cnako3.mjs'))
const nako3edit = path.resolve(path.join(__dirname, 'index.nako3'))

let proc = spawn('node', [cnako3, nako3edit])
proc.stdout.on('data', (data) => {
  console.log(data.toString())
})
