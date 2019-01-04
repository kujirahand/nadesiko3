/**
 * file: plugin_node.js
 * node.js のためのプラグイン
 */
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const fetch = require('node-fetch')
const childProcess = require('child_process')
const execSync = childProcess.execSync
const exec = childProcess.exec
const iconv = require('iconv-lite')

const PluginNode = {
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      const path = require('path')
      sys.__getBinPath = (tool) => {
        let fpath = tool
        if (process.platform === 'win32')
          if (!fileExists(tool)) {
            const nodeDir = path.dirname(process.argv[0])
            const root = path.resolve(path.join(nodeDir, '..'))
            fpath = path.join(root, 'bin', tool + '.exe')
            if (fileExists(fpath)) return `"${fpath}"`
            return tool
          }

        return fpath
      }
      sys.__getBokanPath = () => {
        let nakofile
        const cmd = path.basename(process.argv[1])
        if (cmd.indexOf('cnako3') < 0)
          nakofile = process.argv[1]
         else
          nakofile = process.argv[2]

        return path.dirname(path.resolve(nakofile))
      }
      sys.__v0['コマンドライン'] = process.argv
      sys.__v0['ナデシコランタイムパス'] = process.argv[0]
      sys.__v0['ナデシコランタイム'] = path.basename(process.argv[0])
      sys.__v0['母艦パス'] = sys.__getBokanPath()
      sys.__v0['AJAX:ONERROR'] = null
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
  'バイナリ読': { // @ファイルSをバイナリ(Buffer)として開く // @ばいなりよむ
    type: 'func',
    josi: [['を', 'から']],
    fn: function (s, sys) {
      return fs.readFileSync(s)
    }
  },
  '保存': { // @データSをファイルFヘ書き込む // @ほぞん
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    fn: function (s, f) {
      // Buffer?
      if (s instanceof String)
        fs.writeFileSync(f, s, 'utf-8')
       else
        fs.writeFileSync(f, s)

    },
    return_none: true
  },
  '起動待機': { // @シェルコマンドSを起動し実行終了まで待機する // @きどうたいき
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      const r = execSync(s)
      return r.toString()
    }
  },
  '起動': { // @シェルコマンドSを起動 // @きどう
    type: 'func',
    josi: [['を']],
    fn: function (s) {
      exec(s, (err, stdout, stderr) => {
        if (err)
          console.error(stderr)
         else
          if (stdout) console.log(stdout)

      })
    }
  },
  '起動時': { // @シェルコマンドSを起動 // @きどうしたとき
    type: 'func',
    josi: [['で'], ['を']],
    fn: function (callback, s, sys) {
      exec(s, (err, stdout, stderr) => {
        if (err)
          throw new Error(stderr)
         else
          callback(stdout)

      })
    }
  },
  'ブラウザ起動': { // @ブラウザでURLを起動 // @ぶらうざきどう
    type: 'func',
    josi: [['を']],
    fn: function (url) {
      const opener = require('opener')
      opener(url)
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
        return list.filter((n) => maskRE.test(n))
      } else
        return fs.readdirSync(s)

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
          let st = null
          try {
            st = fs.statSync(fullpath)
          } catch (e) {
            st = null
          }
          if (st == null) continue
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
  'フォルダ存在': { // @ディレクトリPATHが存在するか確認して返す // @ふぉるだそんざい
    type: 'func',
    josi: [['が', 'の']],
    fn: function (path) {
      return isDir(path)
    }
  },
  'フォルダ作成': { // @ディレクトリPATHを作成して返す(再帰的に作成) // @ふぉるださくせい
    type: 'func',
    josi: [['の', 'を', 'に', 'へ']],
    fn: function (path) {
      return fse.mkdirpSync(path)
    }
  },
  'ファイルコピー': { // @パスAをパスBへファイルコピーする // @ふぁいるこぴー
    type: 'func',
    josi: [['から', 'を'], ['に', 'へ']],
    fn: function (a, b, sys) {
      return fse.copySync(a, b)
    }
  },
  'ファイルコピー時': { // @パスAをパスBへファイルコピーしてcallbackを実行 // @ふぁいるこぴーしたとき
    type: 'func',
    josi: [['で'], ['から', 'を'], ['に', 'へ']],
    fn: function (callback, a, b, sys) {
      return fse.copy(a, b, err => {
        if (err) throw new Error('ファイルコピー時:' + err)
        callback()
      })
    },
    return_none: false
  },
  'ファイル移動': { // @パスAをパスBへ移動する // @ふぁいるいどう
    type: 'func',
    josi: [['から', 'を'], ['に', 'へ']],
    fn: function (a, b, sys) {
      return fse.moveSync(a, b)
    }
  },
  'ファイル移動時': { // @パスAをパスBへ移動してcallbackを実行 // @ふぁいるいどうしたとき
    type: 'func',
    josi: [['で'], ['から', 'を'], ['に', 'へ']],
    fn: function (callback, a, b, sys) {
      fse.move(a, b, err => {
        if (err) throw new Error('ファイル移動時:' + err)
        callback()
      })
    },
    return_none: false
  },
  'ファイル削除': { // @パスPATHを削除する // @ふぁいるさくじょ
    type: 'func',
    josi: [['の', 'を']],
    fn: function (path, sys) {
      return fse.removeSync(path)
    }
  },
  'ファイル削除時': { // @パスPATHを削除してcallbackを実行 // @ふぁいるさくじょしたとき
    type: 'func',
    josi: [['で'], ['の', 'を']],
    fn: function (callback, path, sys) {
      return fse.remove(path, err => {
        if (err) throw new Error('ファイル削除時:' + err)
        callback()
      })
    },
    return_none: false
  },
  'ファイル情報取得': { // @パスPATHの情報を調べてオブジェクトで返す // @ふぁいるじょうほうしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (path, sys) {
      return fs.statSync(path)
    }
  },
  'ファイルサイズ取得': { // @パスPATHのファイルサイズを調べて返す // @ふぁいるさいずしゅとく
    type: 'func',
    josi: [['の', 'から']],
    fn: function (path, sys) {
      const st = fs.statSync(path)
      if (!st) return -1
      return st.size
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
    josi: [],
    fn: function () {
      return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
    }
  },
  'デスクトップ': { // @デスクトップパスを取得して返す // @ですくとっぷ
    type: 'func',
    josi: [],
    fn: function (sys) {
      const home = sys.__exec('ホームディレクトリ取得', [sys])
      return path.join(home, 'Desktop')
    }
  },
  'マイドキュメント': { // @マイドキュメントのパスを取得して返す // @まいどきゅめんと
    type: 'func',
    josi: [],
    fn: function (sys) {
      const home = sys.__exec('ホームディレクトリ取得', [sys])
      return path.join(home, 'Documents')
    }
  },
  '母艦パス': {type: 'const', value: ''}, // @ぼかんぱす
  '母艦パス取得': { // @スクリプトのあるディレクトリを返す // @ぼかんぱすしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      return sys.__getBokanPath()
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
  '圧縮解凍ツールパス': {type: 'const', value: '7z'},
  '圧縮解凍ツールパス変更': { // @圧縮解凍に使うツールを取得変更する // @あっしゅくかいとうつーるぱすへんこう
    type: 'func',
    josi: [['に', 'へ']],
    fn: function (v, sys) {
      sys.__setVar('圧縮解凍ツールパス', v)
    },
    return_none: true
  },
  '解凍': { // @(v1非互換)ZIPファイルAをBに解凍(実行には7-zipが必要-https://goo.gl/LmKswH) // @かいとう
    type: 'func',
    josi: [['を', 'から'], ['に', 'へ']],
    fn: function (a, b, sys) {
      const path = sys.__getBinPath(sys.__v0['圧縮解凍ツールパス'])
      const cmd = `${path} x "${a}" -o"${b}" -y`
      execSync(cmd)
      return true
    }
  },
  '解凍時': { // @解凍処理を行い、処理が完了したときにcallback処理を実行 // @かいとうしたとき
    type: 'func',
    josi: [['で'], ['を', 'から'], ['に', 'へ']],
    fn: function (callback, a, b, sys) {
      const path = sys.__getBinPath(sys.__v0['圧縮解凍ツールパス'])
      const cmd = `${path} x "${a}" -o"${b}" -y`
      exec(cmd, (err, stdout, stderr) => {
        if (err) throw new Error('[エラー]『解凍時』' + err)
        callback(stdout)
      })
    },
    return_none: false
  },
  '圧縮': { // @(v1非互換)ファイルAをBにZIP圧縮(実行には7-zipが必要-https://goo.gl/LmKswH) // @あっしゅく
    type: 'func',
    josi: [['を', 'から'], ['に', 'へ']],
    fn: function (a, b, sys) {
      const path = sys.__getBinPath(sys.__v0['圧縮解凍ツールパス'])
      const cmd = `${path} a -r "${b}" "${a}" -y`
      execSync(cmd)
      return true
    }
  },
  '圧縮時': { // @圧縮処理を行い完了したときにcallback処理を指定 // @あっしゅくしたとき
    type: 'func',
    josi: [['で'], ['を', 'から'], ['に', 'へ']],
    fn: function (callback, a, b, sys) {
      const path = sys.__getBinPath(sys.__v0['圧縮解凍ツールパス'])
      const cmd = `${path} a -r "${b}" "${a}" -y`
      exec(cmd, (err, stdout, stderr) => {
        if (err) throw new Error('[エラー]『圧縮時』' + err)
        callback(stdout)
      })
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
      const msleep = (n) => {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n) // eslint-disable-line no-undef
      }
      msleep(sec * 1000)
    },
    return_none: true
  },
  'OS取得': { // @OSプラットフォームを返す(darwin|win32|linux) // @OSしゅとく
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
  // @クリップボード
  'クリップボード': { // @クリップボードを取得設定（『クリップボード＝値』で書換が可能） // @くりっぷぼーど
    type: 'func',
    josi: [['を']],
    fn: function (v, sys) {
      const ncp = require('copy-paste')
      if (sys && sys['isSetter']) return ncp.copy(v)
      return ncp.paste()
    }
  },
  // @コマンドライン
  'コマンドライン': {type: 'const', value: ''}, // @こまんどらいん
  'ナデシコランタイム': {type: 'const', value: ''}, // @なでしこらんたいむ
  'ナデシコランタイムパス': {type: 'const', value: ''}, // @なでしこらんたいむぱす
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
  // @テスト
  'ASSERT等': { // @ mochaによるテストで、ASSERTでAとBが正しいことを報告する // @ASSERTひとしい
    type: 'func',
    josi: [['と'], ['が']],
    fn: function (a, b, sys) {
      const assert = require('assert')
      assert.equal(a, b)
    }
  },
  // @ネットワーク
  '自分IPアドレス取得': { // @ネットワークアダプターからIPアドレス(IPv4)を取得して配列で返す // @じぶんIPあどれすしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      const os = require('os')
      const nif = os.networkInterfaces()
      const result = []
      for (let dev in nif)
        nif[dev].forEach((detail) => {
          if (detail.family === 'IPv4') result.push(detail.address)
        })

      return result
    }
  },
  '自分IPV6アドレス取得': { // @ネットワークアダプターからIPアドレス(IPv6)を取得して配列で返す // @じぶんIPV6あどれすしゅとく
    type: 'func',
    josi: [],
    fn: function (sys) {
      const os = require('os')
      const nif = os.networkInterfaces()
      const result = []
      for (let dev in nif)
        nif[dev].forEach((detail) => {
          if (detail.family === 'IPv6') result.push(detail.address)
        })

      return result
    }
  },
  // @Ajax
  'AJAX送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @AJAXそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    fn: function (callback, url, sys) {
      let options = sys.__v0['AJAXオプション']
      if (options === '') options = null
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        console.log('[fetch.error]', err)
        sys.__v0['AJAX:ONERROR'](err)
      })
    },
    return_none: true
  },
  'GET送信時': { // @非同期通信(Ajax)でURLにデータを送信し、成功するとcallbackが実行される。その際『対象』にデータが代入される。 // @GETそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に']],
    fn: function (callback, url, sys) {
      sys.__exec('AJAX送信時', [callback, url, sys])
    },
    return_none: true
  },
  'POST送信時': { // @AjaxでURLにPARAMSをPOST送信し『対象』にデータを設定 // @POSTそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    fn: function (callback, url, params, sys) {
      let flist = []
      for (let key in params) {
        const v = params[key]
        const kv = encodeURIComponent(key) + '=' + encodeURIComponent(v)
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
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'POSTフォーム送信時': { // @AjaxでURLにPARAMSをフォームとしてPOST送信し『対象』にデータを設定 // @POSTふぉーむそうしんしたとき
    type: 'func',
    josi: [['の'], ['まで', 'へ', 'に'], ['を']],
    fn: function (callback, url, params, sys) {
      const fd = new FormData()
      for (let key in params)
        fd.set(key, params[key])

      let options = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        body: fd
      }
      fetch(url, options).then(res => {
        return res.text()
      }).then(text => {
        sys.__v0['対象'] = text
        callback(text)
      }).catch(err => {
        sys.__v0['AJAX:ONERROR'](err)
      })
    }
  },
  'AJAX失敗時': { // @Ajax命令でエラーが起きたとき // @AJAXえらーしっぱいしたとき
    type: 'func',
    josi: [['の']],
    fn: function (callback, sys) {
      sys.__v0['AJAX:ONERROR'] = callback
    }
  },
  'AJAXオプション': {type: 'const', value: ''}, // @Ajax関連のオプションを指定 // @AJAXおぷしょん
  'AJAXオプション設定': { // @Ajax命令でオプションを設定 // @AJAXおぷしょんせってい
    type: 'func',
    josi: [['に', 'へ', 'と']],
    fn: function (option, sys) {
      sys.__v0['AJAXオプション'] = option
    },
    return_none: true
  },
  // @文字コード
  '文字コード変換サポート判定': { // @文字コードCODEをサポートしているか確認 // @もじこーどさぽーとはんてい
    type: 'func',
    josi: [['の', 'を']],
    fn: function (code, sys) {
      return iconv.encodingExists(code)
    }
  },
  'SJIS変換': { // @(v1非互換)文字列をShift_JISのバイナリバッファに変換 // @SJISへんかん
    type: 'func',
    josi: [['に', 'へ', 'を']],
    fn: function (str, sys) {
      return iconv.encode(str, 'Shift_JIS')
    }
  },
  'SJIS取得': { // @Shift_JISのバイナリバッファを文字列に変換 // @SJISしゅとく
    type: 'func',
    josi: [['から', 'を', 'で']],
    fn: function (buf, sys) {
      return iconv.decode(buf, 'Sfhit_JIS')
    }
  },
  'エンコーディング変換': { // @文字列SをCODEへ変換してバイナリバッファを返す // @ えんこーでぃんぐへんかん
    type: 'func',
    josi: [['を'], ['へ', 'で']],
    fn: function (s, code, sys) {
      return iconv.encode(s, code)
    }
  },
  'エンコーディング取得': { // @バイナリバッファBUFをCODEから変換して返す // @えんこーでぃんぐしゅとく
    type: 'func',
    josi: [['を'], ['から', 'で']],
    fn: function (buf, code, sys) {
      return iconv.decode(buf, code)
    }
  },
  // @マウスとキーボード操作
  'キー送信': { // @Sのキーを送信 // @きーそうしん
    type: 'func',
    josi: [['を', 'の']],
    fn: function (s, sys) {
      const keys = require('sendkeys-js')
      keys.sendKeys(s)
    },
    return_none: true
  },
  '窓アクティブ': { // @Sの窓をアクティブにする // @まどあくてぃぶ
    type: 'func',
    josi: [['を', 'の']],
    fn: function (s, sys) {
      const keys = require('sendkeys-js')
      keys.activate(s)
    },
    return_none: true
  }
}

// ローカル関数
function fileExists (f) {
  try {
    fs.statSync(f)
    return true
  } catch (err) {
    return false
  }
}

function isDir (f) {
  try {
    const st = fs.statSync(f)
    return st.isDirectory()
  } catch (err) {
    return false
  }
}

module.exports = PluginNode
