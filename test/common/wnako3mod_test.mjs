import assert from 'assert'
import { WebNakoCompiler } from '../../src/wnako3mod.mjs'

describe('wnako3mod_test', () => {
  let originalWindow

  before(() => {
    // window のモック
    originalWindow = globalThis.window
    globalThis.window = {
      location: {
        href: 'http://localhost:8888/index.html'
      }
    }
  })

  after(() => {
    globalThis.window = originalWindow
  })

  it('resolvePath で baseDir が / のときの // スタートの不具合が修正されていること', () => {
    const compiler = new WebNakoCompiler()
    const token = { file: 'main', line: 1 }
    
    // http://localhost:8888/index.html から hoge.nako3 を取り込む想定
    const result = compiler.resolvePath('hoge.nako3', token, '')
    // 結果が /hoge.nako3 になるべき（//hoge.nako3 ではなく）
    assert.strictEqual(result.filePath, '/hoge.nako3')
  })

  it('resolvePath で baseDir が /dir/ のとき', () => {
    const compiler = new WebNakoCompiler()
    const token = { file: 'main', line: 1 }
    
    globalThis.window.location.href = 'http://localhost:8888/dir/index.html'
    const result = compiler.resolvePath('hoge.nako3', token, '')
    assert.strictEqual(result.filePath, '/dir/hoge.nako3')
  })

  it('resolvePath で baseDir が /dir/subdir/ のとき', () => {
    const compiler = new WebNakoCompiler()
    const token = { file: 'main', line: 1 }
    
    globalThis.window.location.href = 'http://localhost:8888/dir/subdir/index.html'
    const result = compiler.resolvePath('hoge.nako3', token, '')
    assert.strictEqual(result.filePath, '/dir/subdir/hoge.nako3')
  })
})
