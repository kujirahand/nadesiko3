import fs from 'node:fs/promises'
import path from 'node:path'
import { NakoCompiler } from '../../src/nako3.mjs'

export async function runAlgorithmTest (sampleRoot, source, testPath) {
  const sourcePath = path.resolve(sampleRoot, source)
  const sourceCode = await fs.readFile(sourcePath, 'utf8')
  const test = await fs.readFile(testPath, 'utf8')
  const code = `${sourceCode}\n${test}\n`
  const compiler = new NakoCompiler()
  const result = await compiler.runAsync(code, testPath)
  return result.log
}
