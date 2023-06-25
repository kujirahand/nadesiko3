/// 
/// Node.js用の非同期テストを行うためのテンプレート
///

import os from 'os'
import fs from 'node:fs'
import assert from 'assert'
import path from 'path'
import { execSync } from 'child_process'

import { NakoCompiler } from '../../core/src/nako3.mjs'
import PluginNode from '../../src/plugin_node.mjs'
import PluginCSV from '../../core/src/plugin_csv.mjs'

// __dirname のために
import url from 'url'
// @ts-ignore
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function cmp(/** @type {string} */code, /** @type {string} */res, /** @type {number} */ms) {
  // (原則) EvalやFunctionの中で行う非同期処理は、その中で行うこと！
  // @see https://qiita.com/kujirahand/items/880917172bb0de8d30b9
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginNode', 'plugin_node.js', PluginNode)
  nako.addPluginFile('PluginCSV', 'plugin_csv.js', PluginCSV)
  const g = await nako.runAsync(code, 'main')
  await forceWait(ms)
  assert.strictEqual(g.log, res) // 強制的に指定ミリ秒待つ
  return g
}
// 強制的にミリ秒待機
function forceWait(/** @type {number} */ms) {
  return /** @type {Promise<void>} */(new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, ms);
  }));
}

describe('async_test', () => {
  // --- test ---
  it('秒待', async () =>{
    await cmp('A=3; 0.1秒待つ; 「{A}」を表示;', '3', 150)
  })
  // --- test ---
  it('表示', async () => {
    await cmp('A=3;「{A}」を表示;', '3', 1)
  })
})

