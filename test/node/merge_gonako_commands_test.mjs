/* eslint-disable no-undef */
// batch/merge_gonako_commands.nako3 のテスト (#2465)
// gonako(なでしこ3go)側のcommand-list.jsonを、command.txt形式の断片に
// 変換してマージできることを確認する。
import assert from 'assert'
import fs from 'fs'
import os from 'os'
import path from 'path'
import url from 'url'
import { spawnSync } from 'child_process'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../')
const cnako3Path = path.join(rootDir, 'src/cnako3.mjs')
const mergeScriptSrc = path.join(rootDir, 'batch/merge_gonako_commands.nako3')

/**
 * 一時ディレクトリに「gonakoが隣にあるプロジェクト」を模した構成を作り、
 * merge_gonako_commands.nako3 を実行して結果の文字列を返す。
 * @param {object|null} gonakoCommands nullならgonako側のファイルを作らない
 * @param {string} baseText マージ前のテキスト
 */
function runMerge (gonakoCommands, baseText = '元のテキスト\n') {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nako3-gonako-test-'))
  try {
    // merge_gonako_commands.nako3 は
    //   基本パス = dirname(母艦パス取得)  (実際のnadesiko3ではPROJECT_ROOT/batchの親=PROJECT_ROOT)
    //   REPOSパス = dirname(基本パス)     (実際のnadesiko3ではワークスペースのルート)
    // という2段階でパスを求めるため、実プロジェクトと同じ深さ
    // 「tmpRoot/fakeproject/batch/entry.nako3」に配置して揃える。
    const projDir = path.join(tmpRoot, 'fakeproject', 'batch')
    fs.mkdirSync(projDir, { recursive: true })
    fs.copyFileSync(mergeScriptSrc, path.join(projDir, 'merge_gonako_commands.nako3'))

    if (gonakoCommands !== null) {
      const uiDir = path.join(tmpRoot, 'nadesiko3go/cmd/gonako-gui/ui')
      fs.mkdirSync(uiDir, { recursive: true })
      fs.writeFileSync(path.join(uiDir, 'command-list.json'), JSON.stringify(gonakoCommands), 'utf-8')
    }

    const entryPath = path.join(projDir, 'entry.nako3')
    const src = [
      '!「merge_gonako_commands.nako3」を取り込む。',
      `R＝「${baseText}」をgonakoコマンド一覧マージ。`,
      'Rを表示。'
    ].join('\n')
    fs.writeFileSync(entryPath, src, 'utf-8')

    const r = spawnSync(process.execPath, [cnako3Path, entryPath], {
      encoding: 'utf-8',
      timeout: 15000
    })
    if (r.error) { throw r.error }
    assert.strictEqual(r.status, 0, `merge_gonako_commands.nako3の実行に失敗: ${r.stdout}${r.stderr}`)
    return r.stdout
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  }
}

describe('merge_gonako_commands.nako3 (#2465)', () => {
  it('gonakoのファイルが無ければ元のテキストのままスキップする', () => {
    const out = runMerge(null, 'ここはそのまま\n')
    assert.ok(out.includes('ここはそのまま'))
    assert.ok(!out.includes('■gonako'))
  })

  it('gonakoの命令一覧を■gonakoセクションとしてマージする', () => {
    const gonako = [
      {
        name: 'テスト送信',
        type: 'func',
        josi: [['へ', 'に'], ['を']],
        category: 'テスト用命令',
        desc: 'URLへデータを送信する',
        template: '【A】へ【B】をテスト送信',
        yomi: 'てすとそうしん'
      },
      {
        name: 'テスト初期化',
        type: 'func',
        josi: null,
        category: 'テスト用命令',
        desc: '状態を初期化する',
        template: 'テスト初期化'
      }
    ]
    const out = runMerge(gonako, '元のテキスト\n')
    assert.ok(out.includes('元のテキスト'), '元のテキストが保持されていません')
    assert.ok(out.includes('■gonako(拡張プラグイン,gonako)'), 'gonakoセクションの見出しがありません')
    assert.ok(out.includes('●テスト用命令'), 'カテゴリ見出しがありません')

    const line1 = out.split('\n').find((l) => l.includes('テスト送信'))
    assert.ok(line1, 'テスト送信の行が見つかりません')
    const cols1 = line1.split('|').map((s) => s.trim())
    // cols[0]は「|」の前の空文字列
    assert.strictEqual(cols1[1], '関数')
    assert.strictEqual(cols1[2], 'テスト送信')
    assert.strictEqual(cols1[3], 'AへBを/Aに')
    assert.strictEqual(cols1[4], 'URLへデータを送信する')
    assert.strictEqual(cols1[5], 'てすとそうしん')
    assert.match(cols1[6], /^https:\/\//)

    const line2 = out.split('\n').find((l) => l.includes('テスト初期化'))
    assert.ok(line2, 'テスト初期化の行が見つかりません')
    const cols2 = line2.split('|').map((s) => s.trim())
    assert.strictEqual(cols2[3], '', '引数無しの命令なのに引数欄が空になっていません')
    // yomiが無いフィールドは「undefined」という文字列にならず空になること
    assert.strictEqual(cols2[5], '', 'yomiが無い場合にundefinedという文字列が出力されています')
  })

  it('type=funcでない命令は無視する', () => {
    const gonako = [
      { name: '無視される定数', type: 'const', category: 'その他', desc: '無視されるはず' }
    ]
    const out = runMerge(gonako)
    assert.ok(!out.includes('無視される定数'))
  })

  it('descに含まれる「|」は「/」に置換される(表の列崩れ防止)', () => {
    const gonako = [
      {
        name: 'パイプ入り命令',
        type: 'func',
        josi: [['を']],
        category: 'テスト用命令',
        desc: 'A|Bのように区切り文字を含む説明',
        template: '【S】をパイプ入り命令'
      }
    ]
    const out = runMerge(gonako)
    const line = out.split('\n').find((l) => l.includes('パイプ入り命令'))
    const cols = line.split('|').map((s) => s.trim())
    assert.strictEqual(cols.length, 7) // 先頭の空文字列 + 型/名前/引数/説明/よみ/URL の6列
    assert.strictEqual(cols[4], 'A/Bのように区切り文字を含む説明')
  })
})
