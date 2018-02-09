/**
 * file: plugin_node.js
 * node.js のためのプラグイン
 */
const fs = require('fs')
const path = require('path')

const PluginNode = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__v0['コマンドライン'] = process.argv
      sys.__v0['母艦パス'] = sys.__exec('母艦パス取得', [])
    }
  },
  // @ファイル入出力
  '開': { // @ファイルSを開く // @ひらく
    type: 'func',
    josi: [['を', 'から']],
    fn: function (s) {
      return fs.readFileSync(s, 'utf-8')
    }
  },
  '読': { // @ファイルSを開く // @よむ
    type: 'func',
    josi: [['を', 'から']],
    fn: function (s, sys) {
      return sys.__exec('開', [s])
    }
  },
  '保存': { // @ファイルFヘSを書き込む // @ほぞん
    type: 'func',
    josi: [['へ', 'に'], ['を']],
    fn: function (f, s) {
      fs.writeFileSync(f, s, 'utf-8')
    },
    return_none: true
  },
  '起動': { // @シェルコマンドSを起動 // @きどう
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      const execSync = require('child_process').execSync
      const r = execSync(s)
      return r.toString()
    }
  },
  'ファイル列挙': { // @パスSのファイル名（フォルダ名）一覧を取得する。ワイルドカード可能。「*.jpg;*.png」など複数の拡張子を指定可能。 // @ふぁいるれっきょ
    type: 'func',
    josi: [['の', 'を', 'で']],
    fn: function (s) {
      if (s.indexOf('*') >= 0) { // ワイルドカードがある場合
        const searchPath = path.dirname(s)
        const mask1 = path.basename(s)
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
        const mask2 = (mask1.indexOf(';') < 0)
          ? mask1 + '$' : '(' + mask1.replace(/;/g, '|') + ')$'
        const maskRE = new RegExp(mask2, 'i')
        const list = fs.readdirSync(searchPath)
        const list2 = list.filter((n) => maskRE.test(n))
        return list2
      } else {
        const list = fs.readdirSync(s)
        return list
      }
    }
  },
  '全ファイル列挙': { // @パスS以下の全ファイル名を取得する。ワイルドカード可能。「*.jpg;*.png」のように複数の拡張子を指定可能。 // @ぜんふぁいるれっきょ
    type: 'func',
    josi: [['の', 'を', 'で']],
    fn: function (s) {
      const result = []
      // ワイルドカードの有無を確認
      let mask = '.*'
      let basepath = s
      if (s.indexOf('*') >= 0) {
        basepath = path.dirname(s)
        const mask1 = path.basename(s)
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
        mask = (mask1.indexOf(';') < 0)
          ? mask1 + '$' : '(' + mask1.replace(/;/g, '|') + ')$'
      }
      basepath = path.resolve(basepath)
      const maskRE = new RegExp(mask, 'i')
      // 再帰関数を定義
      const enumR = (base) => {
        const list = fs.readdirSync(base)
        for (const f of list) {
          if (f === '.' || f === '..') continue
          const fullpath = path.join(base, f)
          const st = fs.statSync(fullpath)
          if (st.isDirectory()) {
            enumR(fullpath)
            continue
          }
          if (maskRE.test(f)) result.push(fullpath)
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
    fn: function (path) {
      return fileExists(path)
    }
  },
  'フォルダ存在': { // @ディレクトリPATHが存在するか確認して返す // @ふぃるだそんざい
    type: 'func',
    josi: [['が', 'の']],
    fn: function (path) {
      return isDir(path)
    }
  },
  'フォルダ作成': { // @ディレクトリPATHを作成して返す // @ふぃるださくせい
    type: 'func',
    josi: [['の', 'を', 'に', 'へ']],
    fn: function (path) {
      return fs.mkdirSync(path)
    }
  },
  // @パス操作
  'ファイル名抽出': { // @フルパスのファイル名Sからファイル名部分を抽出して返す // @ふぁいるめいちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    fn: function (s) {
      return path.basename(s)
    }
  },
  'パス抽出': { // @ファイル名Sからパス部分を抽出して返す // @ぱすちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    fn: function (s) {
      return path.dirname(s)
    }
  },
  '相対パス展開': { // @ファイル名AからパスBを展開して返す // @そうたいぱすてんかい
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (a, b) {
      return path.resolve(path.join(a, b))
    }
  },
  // @フォルダ取得
  'カレントディレクトリ取得': { // @カレントディレクトリを返す // @かれんとでぃれくとりしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      const cwd = process.cwd()
      return path.resolve(cwd)
    }
  },
  'カレントディレクトリ変更': { // @カレントディレクトリをDIRに変更する // @かれんとでぃれくとりへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (dir) {
      process.chdir(dir)
    },
    return_none: true
  },
  '作業フォルダ取得': { // @カレントディレクトリを返す // @さぎょうふぉるだしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      const cwd = process.cwd()
      return path.resolve(cwd)
    }
  },
  '作業フォルダ変更': { // @カレントディレクトリをDIRに変更する // @さぎょうふぉるだへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (dir) {
      process.chdir(dir)
    },
    return_none: true
  },
  'ホームディレクトリ取得': { // @ホームディレクトリを取得して返す // @ほーむでぃれくとりしゅとく
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (dir) {
      return process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]
    },
  },
  '母艦パス': { type: 'const', value: ''}, // @スクリプトのあるディレクトリ // @ぼかんぱす
  '母艦パス取得': { // @スクリプトのあるディレクトリを返す // @ぼかんぱすしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      let nakofile
      const cmd = path.basename(process.argv[1])
      if (cmd.indexOf('cnako3') < 0) {
        nakofile = process.argv[1]
      } else {
        nakofile = process.argv[2]
      }
      return path.dirname(path.resolve(nakofile))
    }
  },
  // @環境変数
  '環境変数取得': { // @環境変数Sを返す // @かんきょうへんすうしゅとく
    type: 'func',
    josi: [['の']],
    fn: function (s) {
      return process.env[s]
    }
  },
  '環境変数一覧取得': { // @環境変数の一覧を返す // @かんきょうへんすういちらんしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      return process.env
    }
  },
  // @圧縮・解凍
  '解凍': { // @(v1非互換)ZIPファイルAをBに非同期に解凍(実行には7zが必要-https://goo.gl/YqHSSX) // @かいとう
    type: 'func',
    josi: [['を', 'から'],['に', 'へ']],
    fn: function (a, b, sys) {
      const Zip = require('node-7z')
      const zip = new Zip()
      zip.extractFull(a, b).then(function () {
        const fn = sys.__v0['解凍後:callback']
        if (fn) fn(a, b, sys)
      })
      .catch(function (err) {
        throw err
      })
      return true
    }
  },
  '解凍後': { // 解凍完了したときのcallback処理を指定 // @かいとうご
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['解凍後:callback'] = callback
    },
    return_none: true
  },
  '圧縮': { // @(v1非互換)ファイルAをBに非同期にZIP圧縮(実行には7zが必要-https://goo.gl/YqHSSX) // @あっしゅく
    type: 'func',
    josi: [['を', 'から'],['に', 'へ']],
    fn: function (a, b, sys) {
      const Zip = require('node-7z')
      const zip = new Zip()
      zip.add(b, a).then(function (){
        const fn = sys.__v0['圧縮後:callback']
        if (fn) fn(a, b, sys)
      })
      .catch(function (err) {
        throw err
      })
      return true
    }
  },
  '圧縮後': { // 圧縮完了したときのcallback処理を指定 // @あっしゅくご
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['圧縮後:callback'] = callback
    },
    return_none: true
  },
  // @Nodeプロセス
  '終': { // @Nodeでプログラム実行を強制終了する // @おわる
    type: 'func',
    josi: [],
    fn: function () {
      process.exit()
    },
    return_none: true
  },
  '終了': { // @Nodeでプログラム実行を強制終了する // @しゅうりょう
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__exec('終', [])
    },
    return_none: true
  },
  '秒待': { // @NodeでN秒待つ // @びょうまつ
    type: 'func',
    josi: [['']],
    fn: function (sec, sys) {
      const sleep = require('sleep')
      sleep.msleep(sec * 1000)
    },
    return_none: true
  },
  'OS取得': { // @OSプラットフォームを返す // @OSしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      return process.platform
    }
  },
  'OSアーキテクチャ取得': { // @OSアーキテクチャを返す // @OSあーきてくちゃしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      return process.arch
    }
  },
  // @コマンドライン
  'コマンドライン': {type: 'const', value: ''}, // @こまんどらいん
  '標準入力取得時': { // @標準入力を一行取得した時に、無名関数（あるいは、文字列で関数名を指定）F(s)を実行する // @ひょうじゅんにゅうりょくしゅとくしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback) {
      const reader = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      reader.on('line', function (line) {
        callback(line)
      })
    }
  },
  // @ASSERTテスト
  'ASSERT等': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    fn: function (a, b, sys) {
      const assert = require('assert')
      assert.equal(a, b)
    }
  }
}

// ローカル関数
function fileExists(f) {
  try {
    fs.statSync(f)
    return true
  } catch (err) {
    return false
  }
}

function isDir(f) {
  try {
    const st = fs.statSync(f)
    return st.isDirectory()
  } catch (err) {
    return false
  }
}

module.exports = PluginNode
