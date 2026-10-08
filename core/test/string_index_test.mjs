import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { NakoCompiler } from '../src/nako3.mjs'
import { createReadIndex } from '../src/nako_read_index.mjs'

describe('文字列の添字アクセス #2590', () => {
  const cmp = async (code, expected) => {
    const nako = new NakoCompiler()
    assert.equal((await nako.runAsync(code, 'main.nako3')).log, expected)
  }

  it('0起点の添字と負の添字で1文字を取得する', async () => {
    await cmp('文章=「あいうえお」;文章[0]を表示;文章[1]を表示;文章[-1]を表示;文章@-5を表示', 'あ\nい\nお\nあ')
    await cmp('文章=「あいう」;位置=1;文章[位置]を表示;文章[「2」]を表示', 'い\nう')
  })

  it('範囲の末尾を含めず部分文字列を取得する', async () => {
    await cmp('文章=「あいうえお」;文章[0…2]を表示;文章[1...4]を表示;文章[1…-1]を表示;文章[-3…5]を表示', 'あい\nいうえ\nいうえ\nうえお')
    await cmp('文章=「あいうえお」;区間=0…2;文章[区間]を表示;文章@(区間)を表示', 'あい\nあい')
    await cmp('文章=「あいうえお」;文章[-99…99]を表示;文章の0…2を参照して表示', 'あいうえお\nあいう')
  })

  it('空文字列と範囲外の位置・空の範囲を扱う', async () => {
    const nako = new NakoCompiler()
    const g = await nako.runAsync('文章=「あいう」;結果=[文章[3],文章[-4],文章[2…1],文章[1…1],文章[9…10],(「」)[0],(「」)[0…2]]', 'main.nako3')
    assert.deepEqual(g.__varslist[2].get('main__結果'), [undefined, undefined, '', '', '', undefined, ''])
  })

  it('絵文字をUnicodeコードポイント単位で取得する', async () => {
    await cmp('文章=「あ😀𠮷い」;文章[1]を表示;文章[2]を表示;文章[-2]を表示;文章[1…3]を表示', '😀\n𠮷\n𠮷\n😀𠮷')
  })

  it('繰り返し参照後に文字列を変更しても文字と範囲を正しく取得する', async () => {
    await cmp('文章=「あ😀い」;文章[1]を表示;文章[-2]を表示;文章[0…2]を表示;文章=「かきく」;文章[1]を表示;文章[0…2]を表示;文章=「😀𠮷」;文章[1]を表示;文章[-2]を表示;文章[0…2]を表示', '😀\n😀\nあ😀\nき\nかき\n𠮷\n😀\n😀𠮷')
  })

  it('長い文字列の添字ループを全文の配列化を繰り返さず実行できる', () => {
    // 修正前は10万文字のループに数十秒かかる。通常は数十msで終了するため、
    // CIの速度差を許容する5秒の上限で大幅な性能退行を検出する。
    // 子プロセスにすることで同期ループでもタイムアウト時に停止できる。
    const script = `
      import { NakoCompiler } from ${JSON.stringify(new URL('../src/nako3.mjs', import.meta.url).href)}
      for (const unit of ['あ', '😀']) {
        const code = 'S=「' + unit.repeat(100000) + '」\\nIで0から99999まで繰り返す:\\n    C=S[I]\\nCを表示'
        console.log((await new NakoCompiler().runAsync(code, 'main.nako3')).log)
      }
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      timeout: 5000
    })
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), 'あ\n😀')
  })

  it('範囲と同じ構造の辞書でも部分文字列を取得する', async () => {
    await cmp('文章=「あ😀いう」;区間={「先頭」:1,「末尾」:3};文章[区間]を表示', '😀い')
  })

  it('長い2つの文字列を交互に読む添字ループも高速に実行できる', () => {
    // 1件だけのキャッシュでは毎回入れ替わるため、2つの異なる文字列で検証する。
    const script = `
      import { NakoCompiler } from ${JSON.stringify(new URL('../src/nako3.mjs', import.meta.url).href)}
      for (const [a, b] of [['あ', 'い'], ['😀', '🚀']]) {
        const code = 'S=「' + a.repeat(100000) + '」\\nT=「' + b.repeat(100000) + '」\\nIで0から99999まで繰り返す:\\n    C=S[I]&T[I]\\nCを表示'
        console.log((await new NakoCompiler().runAsync(code, 'main.nako3')).log)
      }
    `
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      timeout: 5000
    })
    assert.ifError(result.error)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), 'あい\n😀🚀')
  })

  it('多数の文字列を読んだ後も負の添字と範囲が正しい', () => {
    const readIndex = createReadIndex()
    const strings = ['あ😀い', 'か🚀き', 'さ𠮷し', 'た🐳ち', 'な🌸に', 'はひふ']
    for (const texts of [strings, strings.toReversed()]) {
      for (const text of texts) {
        assert.equal(readIndex(text, -1), text.slice(-1))
        assert.equal(readIndex(text, { 先頭: 0, 末尾: 3 }), text)
      }
    }
  })

  it('括弧内の値・関数の戻り値・入れ子の要素を参照する', async () => {
    await cmp('(「あいう」)[0…2]を表示;(「あいう」)@-1を表示', 'あい\nう')
    await cmp('A=[「あいう」];A[0][0…2]を表示;A[0,1]を表示;(A@0)[-1]を表示', 'あい\nい\nう')
    await cmp('●文字列取得とは\n「かきく」を戻す\nここまで\n(文字列取得)[0…2]を表示', 'かき')
  })

  it('参照元と添字の式を一度だけ評価する', async () => {
    await cmp('回数=0\n●文字列取得とは\n回数を1増やす\n「abc」を戻す\nここまで\n●位置取得とは\n回数を10増やす\n1を戻す\nここまで\n(文字列取得)[位置取得]を表示\n回数を表示', 'b\n11')
  })

  it('配列・辞書・文字列プロパティの動作を維持する', async () => {
    await cmp('A=[1,2];A[-1]=9;A[-1]を表示;A[1]=3;AをJSONエンコードして表示', '9\n[1,3]')
    await cmp('A={「名前」:「abc」,「-1」:7};A[「名前」][1]を表示;A[-1]を表示;A[「名前」][「length」]を表示', 'b\n7\n3')
  })

  it('基本プラグインなしでも文字列の添字を参照する', async () => {
    const nako = new NakoCompiler({ useBasicPlugin: false })
    const g = await nako.runAsync('文章=「あ😀い」;結果=文章[-2]', 'main.nako3')
    assert.equal(g.__varslist[2].get('main__結果'), '😀')
  })

  it('単体JavaScriptでも文字列・配列の範囲が動作する #2599', async () => {
    const nako = new NakoCompiler()
    const code = nako.compileStandalone('文章=「あ😀いう」;文章[1]を表示;文章[0…2]を表示;文章[-1]を表示;A=[0,1,2,3];A[0…3]をJSONエンコードして表示', 'main.nako3')
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nadesiko3-string-index-'))
    try {
      await fs.symlink(fileURLToPath(new URL('../src/', import.meta.url)), path.join(tempDir, 'nako3runtime'), 'dir')
      const mainFile = path.join(tempDir, 'main.mjs')
      await fs.writeFile(mainFile, code)
      const result = spawnSync(process.execPath, [mainFile], { encoding: 'utf8' })
      assert.equal(result.status, 0, result.stderr)
      assert.equal(result.stdout.trim(), '😀\nあ😀\nう\n[0,1,2]')
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})
