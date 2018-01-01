/**
 * file: plugin_node.js
 * node.js のためのプラグイン
 */
const PluginNode = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      sys.__varslist[0]['コマンドライン'] = process.argv
    }
  },
  // @ファイル入出力
  '開': { // @ファイルSを開く // @ひらく
    type: 'func',
    josi: [['を', 'から']],
    fn: function (s) {
      const fs = require('fs')
      return fs.readFileSync(s, 'utf-8')
    }
  },
  '読': { // @ファイルSを開く // @よむ
    type: 'func',
    josi: [['を', 'から']],
    fn: function (s) {
      const fs = require('fs')
      return fs.readFileSync(s, 'utf-8')
    }
  },
  '保存': { // @ファイルFヘSを書き込む // @ほぞん
    type: 'func',
    josi: [['へ', 'に'], ['を']],
    fn: function (f, s) {
      const fs = require('fs')
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
  'カレントディレクトリ取得': { // @カレントディレクトリを返す // @かれんとでぃれくとりしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      const cwd = process.cwd()
      const path = require('path')
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
      const path = require('path')
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
  '母艦パス取得': { // @スクリプトのあるディレクトリを返す // @ぼかんぱすしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      const path = require('path')
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
  '環境変数取得': { // @環境変数の一覧を返す // @かんきょうへんすうしゅとく
    type: 'func',
    josi: [],
    fn: function () {
      return process.env
    }
  },
  'ファイル列挙': { // @パスSのファイル名（フォルダ名）一覧を取得する。ワイルドカード可能。「*.jpg;*.png」など複数の拡張子を指定可能。 // @ふぁいるれっきょ
    type: 'func',
    josi: [['の', 'を', 'で']],
    fn: function (s) {
      const fs = require('fs')
      const path = require('path')
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
      const fs = require('fs')
      const path = require('path')
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
  'ファイル名抽出': { // @フルパスのファイル名Sからファイル名部分を抽出して返す // @ふぁいるめいちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    fn: function (s) {
      const path = require('path')
      return path.basename(s)
    }
  },
  'パス抽出': { // @ファイル名Sからパス部分を抽出して返す // @ぱすちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    fn: function (s) {
      const path = require('path')
      return path.dirname(s)
    }
  },
  '存在': { // @ファイルPATHが存在するか確認して返す // @そんざい
    type: 'func',
    josi: [['が', 'の']],
    fn: function (path) {
      const fs = require('fs')
      try {
        fs.statSync(path)
        return true
      } catch (err) {
        return false
      }
    }
  },
  // @Nodeプロセス
  '終': { // @Nodeでプログラム実行を強制終了する // @終わる
    type: 'func',
    josi: [],
    fn: function () {
      process.exit()
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

module.exports = PluginNode
