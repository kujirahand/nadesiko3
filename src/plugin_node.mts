/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * file: plugin_node.mjs
 * node.js のためのプラグイン
 */
import fs from 'node:fs'
import fse from 'fs-extra'
import fetch, { FormData, Blob } from 'node-fetch'
import { exec, execSync } from 'node:child_process'
import shellQuote from 'shell-quote'
import path from 'node:path'
import iconv from 'iconv-lite'
import opener from 'opener'
import assert from 'node:assert'
// ハッシュ関数で利用
import crypto from 'node:crypto'
import os from 'node:os'
import url from 'node:url'
import { NakoSystem } from '../core/src/plugin_api.mjs'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getEnv, isWindows, getCommandLineArgs, exit } from './deno_wrapper.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ローカル関数
function fileExists (f: string): boolean {
  try {
    fs.statSync(f)
    return true
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return false
  }
}

function isDir (f: string): boolean {
  try {
    const st = fs.statSync(f)
    return st.isDirectory()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return false
  }
}

let nodeProcess: any = globalThis.process

// Denoのためのラッパー
if (typeof (globalThis as any).Deno !== 'undefined') {
  nodeProcess = {
    platform: (globalThis as any).Deno.build.os,
    arch: (globalThis as any).Deno.build.arch,
    argv: getCommandLineArgs(),
    exit: (code: number) => {
      (globalThis as any).Deno.exit(code)
    },
    cwd: () => {
      return (globalThis as any).Deno.cwd()
    }
  }
}

export default {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_node', // プラグインの名前
      description: 'Node.js向けプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['cnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      // OS判定
      const isWin = isWindows()
      sys.tags.isWin = isWin
      // プラグインの初期化
      sys.tags.__quotePath = (fpath: string) => {
        if (isWin) {
          fpath = fpath.replace(/"/g, '')
          fpath = fpath.replace(/%/g, '"^%"')
          fpath = '"' + fpath + '"'
        } else {
          // console.log('before:', fpath)
          fpath = shellQuote.quote([fpath])
          // console.log('after:', fpath)
        }
        return fpath
      }
      sys.tags.__getBinPath = (tool: any) => {
        let fpath = tool
        if (isWin) {
          if (!fileExists(tool)) {
            const root = path.resolve(path.join(__dirname, '..'))
            fpath = path.join(root, 'bin', tool + '.exe')
            if (fileExists(fpath)) { return `${fpath}` }
            return tool
          }
        }
        return fpath
      }
      sys.tags.__getBokanPath = () => {
        // Electronから実行した場合
        if (nodeProcess.argv.length === 1) {
          return path.dirname(path.resolve(nodeProcess.argv[0]))
        }
        // cnako3のときランタイムを除いたメインファイルのパスを取得する
        let mainfile = '.'
        for (let i = 0; i < nodeProcess.argv.length; i++) {
          const f = nodeProcess.argv[i]
          const bf = path.basename(f)
          if (bf === 'node' || bf === 'node.exe') { continue } // runtime
          if (bf === 'cnako3.mjs' || bf === 'cnako3.mts') { continue } // mts/mjs
          if (bf.substring(0, 1) === '-') { continue } // options
          mainfile = f
          break
        }
        return path.dirname(path.resolve(mainfile))
      }
      sys.__setSysVar('コマンドライン', nodeProcess.argv)
      sys.__setSysVar('ナデシコランタイムパス', nodeProcess.argv[0])
      sys.__setSysVar('ナデシコランタイム', path.basename(nodeProcess.argv[0]))
      sys.__setSysVar('母艦パス', sys.tags.__getBokanPath())
      sys.__setSysVar('AJAX:ONERROR', null)

      // 『尋』『文字尋』『標準入力取得時』『標準入力全取得』のための一時変数
      // nadesiko3-serverを起動した時、ctrl+cでプロセスが止まらない(#1668)を考慮した設計にする
      // 非同期通信を使うと標準入力を占有してしまうため、一時的に全部の標準入力を取得しておいて、残りをバッファに入れておく仕組みにする
      // 加えて、pause/resumeを使わない仕掛けにする
      sys.tags.readBuffers = []
      sys.tags.readline = (question: string, handler?: (line: string) => void) => {
        if (question) {
          nodeProcess.stdout.write(question)
        }
        if (sys.tags.readBuffers.length > 0) {
          const buf = sys.tags.readBuffers.shift()
          return buf
        }
        let data: string = ''
        nodeProcess.stdin.on('data', (buf: Buffer) => {
          const bufStr = buf.toString()
          let line: string = data
          for (let i = 0; i < bufStr.length; i++) {
            const c = bufStr.charAt(i)
            if (c === '\r') {
              continue
            }
            if (c === '\n') {
              if (handler) {
                handler(line)
              } else {
                sys.tags.readBuffers.push(line)
              }
              line = ''
              continue
            }
            line += c
          }
          data = line
        })
        nodeProcess.stdin.on('end', () => {
          if (handler) {
            handler(data)
          } else {
            if (data !== '') {
              sys.tags.readBuffers.push(data)
            }
          }
          data = ''
        })
        if (handler !== undefined) { return true }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return new Promise((resolve, _reject) => {
          const timerCallback = () => {
            if (sys.tags.readBuffers.length > 0) {
              const buf = sys.tags.readBuffers.shift()
              nodeProcess.stdin.removeAllListeners()
              resolve(buf)
            } else {
              setTimeout(timerCallback, 100)
            }
          }
          // 100msごとにチェック
          setTimeout(() => { timerCallback() }, 10)
        })
      }
    }
  },
  // @ファイル入出力
  '開': { // @ファイルFを開く // @ひらく
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (f: string) {
      return fs.readFileSync(f, 'utf-8')
    }
  },
  '読': { // @ファイFSを開く // @よむ
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (f: string) {
      return fs.readFileSync(f, 'utf-8')
    }
  },
  'バイナリ読': { // @ファイルSをバイナリ(Buffer)として開く // @ばいなりよむ
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: string, sys: NakoSystem) {
      return fs.readFileSync(s)
    }
  },
  '保存': { // @データSをファイルFヘ書き込む(文字コードはUTF-8) // @ほぞん
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    asyncFn: true,
    fn: function (s: any, f: string) {
      return new Promise((resolve, reject) => {
        // 引数sの型によって書き込みオプションを変更する
        const options: any = {}
        if (typeof s === 'string') { options.encoding = 'utf-8' }
        if (s instanceof ArrayBuffer) { s = Buffer.from(s) }
        // データをファイルへ書き込む
        fs.writeFile(f, s, options, (err: any) => {
          if (err) {
            reject(new Error(`ファイル『${f}』に保存できませんでした。理由:${err.message}`))
            return
          }
          resolve(null)
        })
      })
    },
    return_none: true
  },
  'SJISファイル読': { // @SJIS形式のファイルSを読み込む // @SJISふぁいるよむ
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: string, sys: NakoSystem) {
      // iconv.skipDecodeWarning = true
      const buf = fs.readFileSync(s)
      const text = iconv.decode(Buffer.from(buf), 'sjis')
      return text
    }
  },
  'SJISファイル保存': { // @SをSJIS形式でファイルFへ書き込む // @SJISふぁいるほぞん
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: string, f: string, sys: NakoSystem) {
      // iconv.skipDecodeWarning = true
      const buf = iconv.encode(s, 'Shift_JIS')
      fs.writeFileSync(f, buf)
    },
    return_none: true
  },
  'EUCファイル読': { // @euc-jp形式のファイルSを読み込む // @EUCふぁいるよむ
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: string, sys: NakoSystem) {
      const buf = fs.readFileSync(s)
      const text = iconv.decode(Buffer.from(buf), 'euc-jp')
      return text
    }
  },
  'EUCファイル保存': { // @Sをeuc-jp形式でファイルFへ書き込む // @EUCふぁいるほぞん
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: string, f: string, sys: NakoSystem) {
      const buf = iconv.encode(s, 'euc-jp')
      fs.writeFileSync(f, buf)
    },
    return_none: true
  },
  '起動待機': { // @シェルコマンドSを起動し実行終了まで待機する // @きどうたいき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s: string) {
      const r = execSync(s)
      return r.toString()
    }
  },
  '起動': { // @シェルコマンドSを起動 // @きどう
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s: string) {
      exec(s, (err, stdout, stderr) => {
        if (err) { console.error(stderr) } else {
          if (stdout) { console.log(stdout) }
        }
      })
    }
  },
  '起動時': { // @シェルコマンドSを起動 // @きどうしたとき
    type: 'func',
    josi: [['で'], ['を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (callback: any, s: string, sys: NakoSystem) {
      exec(s, (err, stdout, stderr) => {
        if (err) { throw new Error(stderr) } else { callback(stdout) }
      })
    }
  },
  'ブラウザ起動': { // @ブラウザでURLを起動 // @ぶらうざきどう
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (url: string) {
      opener(url)
    }
  },
  'ファイル列挙': { // @パスSのファイル名（フォルダ名）一覧を取得する。ワイルドカード可能。「*.jpg;*.png」など複数の拡張子を指定可能。 // @ふぁいるれっきょ
    type: 'func',
    josi: [['の', 'を', 'で']],
    pure: true,
    fn: function (s: string) {
      if (s.indexOf('*') >= 0) { // ワイルドカードがある場合
        const searchPath = path.dirname(s)
        const mask1 = path.basename(s)
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
        const mask2 = (mask1.indexOf(';') < 0)
          ? mask1 + '$'
          : '(' + mask1.replace(/;/g, '|') + ')$'
        const maskRE = new RegExp(mask2, 'i')
        const list = fs.readdirSync(searchPath)
        return list.filter((n) => maskRE.test(n))
      } else { return fs.readdirSync(s) }
    }
  },
  '全ファイル列挙': { // @パスS以下の全ファイル名を取得する。ワイルドカード可能。「*.jpg;*.png」のように複数の拡張子を指定可能。 // @ぜんふぁいるれっきょ
    type: 'func',
    josi: [['の', 'を', 'で']],
    pure: true,
    fn: function (s: string) {
      /** @type {string[]} */
      const result: string[] = []
      // ワイルドカードの有無を確認
      let mask = '.*'
      let basepath = s
      if (s.indexOf('*') >= 0) {
        basepath = path.dirname(s)
        const mask1 = path.basename(s)
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
        mask = (mask1.indexOf(';') < 0)
          ? mask1 + '$'
          : '(' + mask1.replace(/;/g, '|') + ')$'
      }
      basepath = path.resolve(basepath)
      const maskRE = new RegExp(mask, 'i')
      // 再帰関数を定義
      const enumR = (base: any) => {
        const list = fs.readdirSync(base)
        for (const f of list) {
          if (f === '.' || f === '..') { continue }
          const fullpath = path.join(base, f)
          let st: fs.Stats
          try {
            st = fs.statSync(fullpath)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            continue
          }
          if (st.isDirectory()) {
            enumR(fullpath)
            continue
          }
          if (maskRE.test(f)) { result.push(fullpath) }
        }
      }
      // 検索実行
      enumR(basepath)
      return result
    }
  },
  '存在': { // @ファイルPATHが存在するか確認して返す // @そんざい
    type: 'func',
    josi: [['が', 'の']],
    pure: true,
    fn: function (path: string) {
      return fileExists(path)
    }
  },
  'フォルダ存在': { // @ディレクトリPATHが存在するか確認して返す // @ふぉるだそんざい
    type: 'func',
    josi: [['が', 'の']],
    pure: true,
    fn: function (path: string) {
      return isDir(path)
    }
  },
  'フォルダ作成': { // @ディレクトリPATHを作成して返す(再帰的に作成) // @ふぉるださくせい
    type: 'func',
    josi: [['の', 'を', 'に', 'へ']],
    pure: true,
    fn: function (path: string) {
      return fse.mkdirpSync(path)
    }
  },
  'ファイルコピー': { // @パスAをパスBへファイルコピーする // @ふぁいるこぴー
    type: 'func',
    josi: [['から', 'を'], ['に', 'へ']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (a: string, b: string, sys: NakoSystem) {
      return fse.copySync(a, b)
    }
  },
  'ファイルコピー時': { // @パスAをパスBへファイルコピーしてcallbackを実行 // @ふぁいるこぴーしたとき
    type: 'func',
    josi: [['で'], ['から', 'を'], ['に', 'へ']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (callback: any, a: string, b: string, sys: NakoSystem) {
      return fse.copy(a, b, (err: any) => {
        if (err) { throw new Error('ファイルコピー時:' + err) }
        callback()
      })
    },
    return_none: false
  },
  'ファイル移動': { // @パスAをパスBへ移動する // @ふぁいるいどう
    type: 'func',
    josi: [['から', 'を'], ['に', 'へ']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (a: string, b: string, sys: NakoSystem) {
      return fse.moveSync(a, b)
    }
  },
  'ファイル移動時': { // @パスAをパスBへ移動してcallbackを実行 // @ふぁいるいどうしたとき
    type: 'func',
    josi: [['で'], ['から', 'を'], ['に', 'へ']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (callback: any, a: string, b: string, sys: NakoSystem) {
      fse.move(a, b, (err: any) => {
        if (err) { throw new Error('ファイル移動時:' + err) }
        callback()
      })
    },
    return_none: false
  },
  'ファイル削除': { // @パスPATHを削除する // @ふぁいるさくじょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (path: string, sys: NakoSystem) {
      return fse.removeSync(path)
    }
  },
  'ファイル削除時': { // @パスPATHを削除してcallbackを実行 // @ふぁいるさくじょしたとき
    type: 'func',
    josi: [['で'], ['の', 'を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (callback: any, path: string, sys: NakoSystem) {
      return fse.remove(path, (err: any) => {
        if (err) { throw new Error('ファイル削除時:' + err) }
        callback()
      })
    },
    return_none: false
  },
  'ファイル情報取得': { // @パスPATHの情報を調べてオブジェクトで返す // @ふぁいるじょうほうしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (path: string, sys: NakoSystem) {
      return fs.statSync(path)
    }
  },
  'ファイルサイズ取得': { // @パスPATHのファイルサイズを調べて返す // @ふぁいるさいずしゅとく
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (path: string, sys: NakoSystem) {
      const st = fs.statSync(path)
      if (!st) { return -1 }
      return st.size
    }
  },
  // @パス操作
  'ファイル名抽出': { // @フルパスのファイル名Sからファイル名部分を抽出して返す // @ふぁいるめいちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function (s: string) {
      return path.basename(s)
    }
  },
  'パス抽出': { // @ファイル名Sからパス部分を抽出して返す // @ぱすちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function (s: string) {
      return path.dirname(s)
    }
  },
  '絶対パス変換': { // @相対パスから絶対パスに変換して返す // @ぜったいぱすへんかん
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (a: string) {
      return path.resolve(a)
    }
  },
  '相対パス展開': { // @ファイル名AからパスBを展開して返す // @そうたいぱすてんかい
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a: string, b: string) {
      return path.resolve(path.join(a, b))
    }
  },
  // @フォルダ取得
  'カレントディレクトリ取得': { // @カレントディレクトリを返す // @かれんとでぃれくとりしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const cwd = nodeProcess.cwd()
      return path.resolve(cwd)
    }
  },
  'カレントディレクトリ変更': { // @カレントディレクトリをDIRに変更する // @かれんとでぃれくとりへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (dir: string) {
      nodeProcess.chdir(dir)
    },
    return_none: true
  },
  '作業フォルダ取得': { // @カレントディレクトリを返す // @さぎょうふぉるだしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const cwd = nodeProcess.cwd()
      return path.resolve(cwd)
    }
  },
  '作業フォルダ変更': { // @カレントディレクトリをDIRに変更する // @さぎょうふぉるだへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (dir: string) {
      nodeProcess.chdir(dir)
    },
    return_none: true
  },
  'ホームディレクトリ取得': { // @ホームディレクトリを取得して返す // @ほーむでぃれくとりしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      return nodeProcess.env[sys.tags.isWin ? 'USERPROFILE' : 'HOME']
    }
  },
  'デスクトップ': { // @デスクトップパスを取得して返す // @ですくとっぷ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const home = sys.__exec('ホームディレクトリ取得', [sys])
      return path.join(home, 'Desktop')
    }
  },
  'マイドキュメント': { // @マイドキュメントのパスを取得して返す // @まいどきゅめんと
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const home = sys.__exec('ホームディレクトリ取得', [sys])
      return path.join(home, 'Documents')
    }
  },
  '母艦パス': { type: 'const', value: '' }, // @ぼかんぱす
  '母艦パス取得': { // @スクリプトのあるディレクトリを返す // @ぼかんぱすしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      return sys.tags.__getBokanPath()
    }
  },
  'テンポラリフォルダ': { // @テンポラリフォルダのパスを取得して返す // @てんぽらりふぉるだ
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      // 環境変数からテンポラリフォルダを取得
      return os.tmpdir()
    }
  },
  '一時フォルダ作成': { // @指定のフォルダに作業用の一時フォルダを作成して取得して返す // @いちじふぉるださくせい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (dir: string, sys: NakoSystem) {
      if (dir === '' || !dir) {
        dir = os.tmpdir()
      }
      // 環境変数からテンポラリフォルダを取得
      return fs.mkdtempSync(dir)
    }
  },
  // @環境変数
  '環境変数取得': { // @環境変数Sを返す // @かんきょうへんすうしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s: string) {
      return nodeProcess.env[s]
    }
  },
  '環境変数一覧取得': { // @環境変数の一覧を返す // @かんきょうへんすういちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return nodeProcess.env
    }
  },
  // @圧縮・解凍
  '圧縮解凍ツールパス': { type: 'const', value: '7z' }, // @あっしゅくかいとうつーるぱす
  '圧縮解凍ツールパス変更': { // @圧縮解凍に使うツールを取得変更する // @あっしゅくかいとうつーるぱすへんこう
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (v: string, sys: NakoSystem) {
      sys.__setSysVar('圧縮解凍ツールパス', v)
    },
    return_none: true
  },
  '解凍': { // @(v1非互換)ZIPファイルAをBに解凍(実行には7-zipが必要-https://goo.gl/LmKswH) // @かいとう
    type: 'func',
    josi: [['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function (a: string, b: string, sys: NakoSystem) {
      const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')))
      a = sys.tags.__quotePath(a)
      b = sys.tags.__quotePath(b)
      const cmd = `${tpath} x ${a} -o${b} -y`
      execSync(cmd)
      return true
    }
  },
  '解凍時': { // @解凍処理を行い、処理が完了したときにcallback処理を実行 // @かいとうしたとき
    type: 'func',
    josi: [['で'], ['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function (callback: any, a: string, b: string, sys: NakoSystem) {
      const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')))
      a = sys.tags.__quotePath(a)
      b = sys.tags.__quotePath(b)
      const cmd = `${tpath} x ${a} -o${b} -y`
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exec(cmd, (err, stdout, stderr) => {
        if (err) { throw new Error('[エラー]『解凍時』' + err) }
        callback(stdout)
      })
    },
    return_none: false
  },
  '圧縮': { // @(v1非互換)ファイルAをBにZIP圧縮(実行には7-zipが必要-https://goo.gl/LmKswH) // @あっしゅく
    type: 'func',
    josi: [['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function (a: string, b: string, sys: NakoSystem) {
      const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')))
      a = sys.tags.__quotePath(a)
      b = sys.tags.__quotePath(b)
      const cmd = `${tpath} a -r ${b} ${a} -y`
      execSync(cmd)
      return true
    }
  },
  '圧縮時': { // @圧縮処理を行い完了したときにcallback処理を指定 // @あっしゅくしたとき
    type: 'func',
    josi: [['で'], ['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function (callback: any, a: string, b: string, sys: NakoSystem) {
      const tpath = sys.tags.__quotePath(sys.tags.__getBinPath(sys.__getSysVar('圧縮解凍ツールパス')))
      a = sys.tags.__quotePath(a)
      b = sys.tags.__quotePath(b)
      const cmd = `${tpath} a -r ${b} ${a} -y`
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exec(cmd, (err, stdout, stderr) => {
        if (err) { throw new Error('[エラー]『圧縮時』' + err) }
        callback(stdout)
      })
    },
    return_none: true
  },
  // @Nodeプロセス
  '終': { // @Nodeでプログラム実行を強制終了する // @おわる
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      nodeProcess.exit()
    },
    return_none: true
  },
  '強制終了時': { // @Nodeでctrl+cでプログラムの実行が終了した時FUNCを実行する。もしFUNCが偽を返すと終了しない。非同期処理のとき動作する(#1010) // @きょうせいしゅうりょうしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (func: any, sys: NakoSystem) {
      if (typeof (func) === 'string') {
        func = sys.__findFunc(func, '強制終了時')
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      nodeProcess.on('SIGINT', (signal: any) => {
        const flag = func(sys)
        if (flag) { nodeProcess.exit() }
      })
    },
    return_none: true
  },
  '終了': { // @Nodeでプログラム実行を強制終了する // @しゅうりょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      sys.__exec('終', [])
    },
    return_none: true
  },
  'OS取得': { // @OSプラットフォームを返す(darwin/win32/linux) // @OSしゅとく
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      return nodeProcess.platform
    }
  },
  'OSアーキテクチャ取得': { // @OSアーキテクチャを返す // @OSあーきてくちゃしゅとく
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      return nodeProcess.arch
    }
  },
  // @コマンドラインと標準入出力
  'コマンドライン': { type: 'const', value: '' }, // @こまんどらいん
  'ナデシコランタイム': { type: 'const', value: '' }, // @なでしこらんたいむ
  'ナデシコランタイムパス': { type: 'const', value: '' }, // @なでしこらんたいむぱす
  '標準入力取得時': { // @標準入力を一行取得した時に、変数『対象』に取得した文字列を代入し、無名関数（あるいは、文字列で関数名を指定）F(s: string)を実行する // @ひょうじゅんにゅうりょくしゅとくしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (callback: (f: string)=>void, sys: NakoSystem) {
      if (!sys.tags.readline) {
        throw new Error('『標準入力取得時』命令で標準入力が取得できません')
      }
      if (typeof callback === 'string') {
        callback = sys.__findFunc(callback, '標準入力取得時')
      }
      sys.tags.readline('', (line: string) => {
        sys.__setSysVar('対象', line)
        callback(line)
      })
    }
  },
  '尋': { // @標準入力を一行取得する // @たずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function (msg: string, sys: NakoSystem) {
      if (!sys.tags.readline) {
        throw new Error('『尋』命令で標準入力が取得できません')
      }
      const line = await sys.tags.readline(msg)
      const lineAsNumber = Number(line)
      if (isNaN(lineAsNumber)) {
        return line
      } else {
        return lineAsNumber
      }
    }
  },
  '文字尋': { // @標準入力を一行取得する。ただし自動で数値に変換しない // @もじたずねる
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    asyncFn: true,
    fn: async function (msg: string, sys: NakoSystem) {
      if (!sys.tags.readline) {
        throw new Error('『尋』命令で標準入力が取得できません')
      }
      const line = await sys.tags.readline(msg)
      return line
    }
  },
  '標準入力全取得': { // @標準入力を全部取得して返す // @ひょうじゅんにゅうりょくぜんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    asyncFn: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem): Promise<string> {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return new Promise((resolve, _reject) => {
        let dataStr = ''
        nodeProcess.stdin.on('data', (data: any) => {
          dataStr += data.toString()
        })
        nodeProcess.stdin.on('end', () => {
          nodeProcess.stdin.removeAllListeners()
          resolve(dataStr)
        })
      })
    }
  },
  // @テスト
  'ASSERT等': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (a: any, b: any, sys: NakoSystem) {
      assert.strictEqual(a, b)
    }
  },
  // @ネットワーク
  '自分IPアドレス取得': { // @ネットワークアダプターからIPアドレス(IPv4)を取得して配列で返す // @じぶんIPあどれすしゅとく
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      const nif = os.networkInterfaces()
      if (!nif) { throw new Error('『自分IPアドレス取得』でネットワークのインターフェイスが種畜できません。') }
      /**
       * @type {string[]}
       */
      const result: string[] = []
      for (const dev in nif) {
        const n = nif[dev]
        if (!n) { continue }
        n.forEach((detail) => {
          if (detail.family === 'IPv4') { result.push(detail.address) }
        })
      }

      return result
    }
  },
  '自分IPV6アドレス取得': { // @ネットワークアダプターからIPアドレス(IPv6)を取得して配列で返す // @じぶんIPV6あどれすしゅとく
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      const nif = os.networkInterfaces()
      if (!nif) { throw new Error('『自分IPアドレス取得』でネットワークのインターフェイスが種畜できません。') }
      const result: string[] = []
      for (const dev in nif) {
        const n = nif[dev]
        if (!n) { continue }
        n.forEach((detail) => {
          if (detail.family === 'IPv6') { result.push(detail.address) }
        })
      }

      return result
    }
  },
  // @Ajax
  'AJAX送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: true,
    fn: function (callback: any, url: string, sys: NakoSystem) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      fetch(url, options).then((res: any) => {
        return res.text()
      }).then((text: string) => {
        sys.__setSysVar('対象', text)
        callback(text)
      }).catch((err: any) => {
        console.log('[fetch.error]', err)
        throw err
      })
    },
    return_none: true
  },
  'AJAX受信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['で'], ['から', 'を']],
    pure: true,
    fn: function (callback: any, url: string, sys: NakoSystem) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'GET送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @GETそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    pure: true,
    fn: function (callback: any, url: string, sys: NakoSystem) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'POST送信時': { // @AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定 // @POSTそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (callback: any, url: string, params: [key: string], sys: NakoSystem) {
      const flist: Array<string> = []
      for (const key in params) {
        const v: string = params[key]
        const kv: string = encodeURIComponent(key) + '=' + encodeURIComponent(v)
        flist.push(kv)
      }
      const bodyData = flist.join('&')
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      fetch(url, options).then((res: any) => {
        return res.text()
      }).then((text: string) => {
        sys.__setSysVar('対象', text)
        callback(text)
      }).catch((err: any) => {
        sys.__getSysVar('AJAX:ONERROR')(err)
      })
    }
  },
  'POSTフォーム送信時': { // @AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定 // @POSTふぉーむそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    pure: true,
    fn: function (callback: any, url: string, params: any, sys: NakoSystem) {
      const fd = new FormData()
      for (const key in params) { fd.set(key, params[key]) }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: fd
      }
      fetch(url, options).then((res: any) => {
        return res.text()
      }).then((text: string) => {
        sys.__setSysVar('対象', text)
        callback(text)
      }).catch((err: any) => {
        sys.__getSysVar('AJAX:ONERROR')(err)
      })
    }
  },
  'AJAX失敗時': { // @Ajax命令でエラーが起きたとき // @AJAXえらーしっぱいしたとき
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (callback: any, sys: NakoSystem) {
      sys.__setSysVar('AJAX:ONERROR', callback)
    }
  },
  'AJAXオプション': { type: 'const', value: '' }, // @Ajax関連のオプションを指定 // @AJAXおぷしょん
  'AJAXオプション設定': { // @Ajax命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    pure: true,
    fn: function (option: any, sys: NakoSystem) {
      sys.__setSysVar('AJAXオプション', option)
    },
    return_none: true
  },
  'AJAX保障送信': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @AJAXほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url: string, sys: NakoSystem) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      return fetch(url, options)
    },
    return_none: false
  },
  'HTTP保障取得': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @HTTPほしょうしゅとく
    type: 'func',
    josi: [['の', 'から', 'を']],
    pure: true,
    fn: function (url: string, sys: NakoSystem) {
      return sys.__exec('AJAX保障送信', [url, sys])
    },
    return_none: false
  },
  'GET保障送信': { // @非同期通信(Ajax)でURLにデータの送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @GETほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に']],
    pure: true,
    fn: function (url: string, sys: NakoSystem) {
      return sys.__exec('AJAX保障送信', [url, sys])
    },
    return_none: false
  },
  'POST保障送信': { // @非同期通信(Ajax)でURLにPARAMSをPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。 // @POSTほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (url: string, params: [key: string], sys: NakoSystem) {
      const flist: Array<string> = []
      for (const key in params) {
        const v: string = params[key]
        const kv: string = encodeURIComponent(key) + '=' + encodeURIComponent(v)
        flist.push(kv)
      }
      const bodyData = flist.join('&')
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData
      }
      return fetch(url, options)
    },
    return_none: false
  },
  'POSTフォーム保障送信': { // @非同期通信(Ajax)でURLにPARAMSをフォームとしてPOST送信を開始する非同期処理オブジェクト(Promise)を作成する。  // @POSTふぉーむほしょうそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (url: string, params: any, sys: NakoSystem) {
      const fd = new FormData()
      for (const key in params) { fd.set(key, params[key]) }

      const options = {
        method: 'POST',
        body: fd
      }
      return fetch(url, options)
    },
    return_none: false
  },
  'AJAX内容取得': { // @非同期通信(Ajax)の応答から内容を指定した形式で取り出すための非同期処理オブジェクト(Promise)を返す。  // @AJAXないようしゅとく
    type: 'func',
    josi: [['から'], ['で']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (res: any, type: string, sys: NakoSystem) {
      type = type.toString().toUpperCase()
      if (type === 'TEXT' || type === 'テキスト') {
        return res.text()
      } else
        if (type === 'JSON') {
          return res.json()
        } else
          if (type === 'BLOB') {
            return res.blob()
          } else
            if (type === 'ARRAY' || type === '配列') {
              return res.arrayBuffer()
            } else
              if (type === 'BODY' || type === '本体') {
                return res.body
              }
      return res.body()
    },
    return_none: false
  },
  'AJAX受信': { // @「!非同期モード」で非同期通信(Ajax)でURLからデータを受信する。『AJAXオプション』を指定できる。結果は変数『対象』に入る// @AJAXじゅしん
    type: 'func',
    josi: [['から', 'を']],
    pure: true,
    fn: function (url: string, sys: NakoSystem) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      // fetch 実行
      fetch(url, options).then((res: any) => {
        if (res.ok) { // 成功したとき
          return res.text()
        } else { // 失敗したとき
          throw new Error('status=' + res.status)
        }
      }).then((text: string) => {
        sys.__setSysVar('対象', text)
      }).catch((err: any) => {
        console.error('[AJAX受信のエラー]', err)
      })
    },
    return_none: true
  },
  'POSTデータ生成': { // @辞書形式のデータPARAMSをkey=value&key=value...の形式に変換する // @POSTでーたせいせい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (params: any, sys: NakoSystem) {
      const flist: Array<string> = []
      for (const key in params) {
        const v = params[key]
        const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v)
        flist.push(kv)
      }
      return flist.join('&')
    }
  },
  'POST送信': { // @非同期通信(AJAX)でPOSTメソッドにてURLへPARAMS(辞書型)を送信して応答を戻す。 // @POSTそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    asyncFn: true,
    fn: function (url: any, params: any, sys: any) {
      return new Promise((resolve, reject) => {
        const bodyData = sys.__exec('POSTデータ生成', [params, sys])
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyData
        }
        fetch(url, options).then(res => {
          return res.text()
        }).then(text => {
          resolve(text)
        }).catch(err => {
          reject(err.message)
        })
      })
    }
  },
  'POSTフォーム送信': { // @非同期通信(AJAX)でURLにPARAMS(辞書型)をフォームとしてPOSTメソッドにてURLへ送信し応答を返す。 // @POSTふぉーむそうしん
    type: 'func',
    josi: [['まで', 'へ', 'に'], ['を']],
    pure: true,
    asyncFn: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (url: any, params: any, sys: any) {
      return new Promise((resolve, reject) => {
        const fd = new FormData()
        for (const key in params) { fd.set(key, params[key]) }
        const options = {
          method: 'POST',
          body: fd
        }
        fetch(url, options).then(res => {
          return res.text()
        }).then(text => {
          resolve(text)
        }).catch(err => {
          reject(err.message)
        })
      })
    }
  },
  // @新AJAX
  'AJAXテキスト取得': { // @AJAXでURLにアクセスしテキスト形式で結果を得る。送信時AJAXオプションの値を参照。 // @AJAXてきすとしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url: string, sys: NakoSystem) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      // console.log(url, options)
      const res = await fetch(url, options)
      const txt = await res.text()
      return txt
    },
    return_none: false
  },
  'AJAX_JSON取得': { // @AJAXでURLにアクセスしJSONの結果を得て、送信時AJAXオプションの値を参照。 // @AJAX_JSONしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url: string, sys: NakoSystem) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const txt = await res.json()
      return txt
    },
    return_none: false
  },
  'AJAXバイナリ取得': { // @AJAXでURLにアクセスしバイナリ(arrayBuffer)形式で結果を得る。送信時AJAXオプションの値を参照。 // @AJAXばいなりしゅとく
    type: 'func',
    josi: [['から']],
    pure: true,
    asyncFn: true,
    fn: async function (url: string, sys: NakoSystem) {
      let options = sys.__getSysVar('AJAXオプション')
      if (options === '') { options = { method: 'GET' } }
      const res = await fetch(url, options)
      const bin = await res.arrayBuffer()
      return bin
    },
    return_none: false
  },
  // @LINE
  'LINE送信': { // @ LINEにメッセージを送信する。先にLINE Notifyのページで宛先のトークンを取得する。TOKENへMESSAGEをLINE送信する。 // @LINEそうしん
    type: 'func',
    josi: [['へ', 'に'], ['を']],
    pure: true,
    asyncFn: true,
    fn: async function (token: string, message: string, sys: NakoSystem) {
      const lineNotifyUrl = 'https://notify-api.line.me/api/notify'
      const bodyData = sys.__exec('POSTデータ生成', [{ message }, sys])
      const options = {
        'method': 'POST',
        'headers': {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        'body': bodyData
      }
      const res = await fetch(lineNotifyUrl, options)
      const jsonObj = await res.json()
      return JSON.stringify(jsonObj)
    },
    return_none: false
  },
  'LINE画像送信': { // @ LINEにメッセージを送信する。先にLINE Notifyのページで宛先のトークンを取得する。TOKENへIMAGE_FILEとMESSAGEをLINE画像送信する。 // @LINEがぞうそうしん
    type: 'func',
    josi: [['へ', 'に'], ['と'], ['を']],
    pure: true,
    asyncFn: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: async function (token: string, imageFile: string, message: string, sys: NakoSystem) {
      const lineNotifyUrl = 'https://notify-api.line.me/api/notify'
      const formData = new FormData()
      formData.append('message', message)
      const imageData = fs.readFileSync(imageFile)
      formData.append('imageFile', new Blob([imageData]))
      const options = {
        'method': 'POST',
        'headers': {
          'Authorization': `Bearer ${token}`
        },
        'body': formData
      }
      const res = await fetch(lineNotifyUrl, options)
      const jsonObj = await res.json()
      return JSON.stringify(jsonObj)
    },
    return_none: false
  },
  // @文字コード
  '文字コード変換サポート判定': { // @文字コードCODEをサポートしているか確認 // @もじこーどさぽーとはんてい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (code: string, sys: NakoSystem) {
      return iconv.encodingExists(code)
    }
  },
  'SJIS変換': { // @(v1非互換)文字列をShift_JISのバイナリバッファに変換 // @SJISへんかん
    type: 'func',
    josi: [['に', 'へ', 'を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (str: string, sys: NakoSystem) {
      // iconv.skipDecodeWarning = true
      return iconv.encode(str, 'Shift_JIS')
    }
  },
  'SJIS取得': { // @Shift_JISのバイナリバッファを文字列に変換 // @SJISしゅとく
    type: 'func',
    josi: [['から', 'を', 'で']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (buf: any, sys: NakoSystem) {
      // iconv.skipDecodeWarning = true
      return iconv.decode(Buffer.from(buf), 'sjis')
    }
  },
  'エンコーディング変換': { // @文字列SをCODEへ変換してバイナリバッファを返す // @ えんこーでぃんぐへんかん
    type: 'func',
    josi: [['を'], ['へ', 'で']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: string, code: string, sys: NakoSystem) {
      // iconv.skipDecodeWarning = true
      return iconv.encode(s, code)
    }
  },
  'エンコーディング取得': { // @バイナリバッファBUFをCODEから変換して返す // @えんこーでぃんぐしゅとく
    type: 'func',
    josi: [['を'], ['から', 'で']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (buf: any, code: string, sys: NakoSystem) {
      // iconv.skipDecodeWarning = true
      return iconv.decode(Buffer.from(buf), code)
    }
  },
  // @ハッシュ関数
  'ハッシュ関数一覧取得': { // @利用可能なハッシュ関数の一覧を返す // @ はっしゅかんすういちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      return crypto.getHashes()
    }
  },
  'ハッシュ値計算': { // @データSをアルゴリズムALG(sha256/sha512/md5)のエンコーディングENC(hex/base64)でハッシュ値を計算して返す // @ はっしゅちけいさん
    type: 'func',
    josi: [['を'], ['の'], ['で']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (s: any, alg: string, enc: any, sys: NakoSystem) {
      const hashsum = crypto.createHash(alg)
      hashsum.update(s)
      return hashsum.digest(enc)
    }
  },
  'ランダムUUID生成': { // @ランダムに生成された36文字のv4 UUID(文字列)を返す // @ らんだむUUIDせいせい
    type: 'func',
    josi: [],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (sys: NakoSystem) {
      const uuid = crypto.randomUUID()
      return uuid
    }
  },
  'ランダム配列生成': { // @暗号強度の強い乱数のバイト配列(Uint8Array)を指定個数返す // @ らんだむはいれつせいせい
    type: 'func',
    josi: [['の']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (cnt: number, sys: NakoSystem) {
      const a = new Uint8Array(cnt)
      crypto.getRandomValues(a)
      return a
    }
  }
}
