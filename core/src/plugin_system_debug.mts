/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 特殊命令・デバッグ支援・プラグイン管理の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
import { NakoSystem } from './plugin_api.mjs'

export default {
  // @特殊命令
  'JS実行': { // @JavaScriptのコードSRCを実行する(変数sysでなでしこシステムを参照できる) // @JSじっこう
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function(src: string, sys: NakoSystem) {
      return sys.__evalJS(src, sys) // #1733
    }
  },
  'JSオブジェクト取得': { // @なでしこで定義した関数や変数nameのJavaScriptオブジェクトを取得する // @JSおぶじぇくとしゅとく
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function(name: string, sys: any) {
      return sys.__findVar(name, null)
    }
  },
  'JS関数実行': { // @JavaScriptの関数NAMEを引数ARGS(配列)で実行する // @JSかんすうじっこう
    type: 'func',
    josi: [['を'], ['で']],
    fn: function(name: any, args: any, sys: NakoSystem) {
      // nameが文字列ならevalして関数を得る
       
      if (typeof name === 'string') { name = sys.__evalJS(name, sys) }
      if (typeof name !== 'function') { throw new Error('JS関数取得で実行できません。') }

      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }

      // 実行
      // eslint-disable-next-line prefer-spread
      return name.apply(null, args)
    }
  },
  'ASYNC': { // @なでしこのユーザー関数定義でASYNC(非同期関数である)ことを宣言する // @ASYNC
    type: 'func',
    josi: [],
    asyncFn: true,
    pure: true,
    fn: async function() {
      // empty
    },
    return_none: true
  },
  'AWAIT実行': { // @JavaScriptの非同期関数(Promise/async関数)のFを引数ARGSでawait実行する // @AWAITじっこう
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    asyncFn: true,
    fn: async function(f: any, args: any, sys: any) {
      // nameが文字列ならevalして関数を得る
      if (typeof f === 'string') { f = sys.__findFunc(f, 'AWAIT実行') }
      if (!(f instanceof Function)) { throw new Error('『AWAIT実行』の第一引数はなでしこ関数名かFunction型で指定してください。') }
      // 実行
      return await f(...args)
    }
  },
  'JSメソッド実行': { // @JavaScriptのオブジェクトOBJのメソッドMを引数ARGS(配列)で実行する // @JSめそっどじっこう
    type: 'func',
    josi: [['の'], ['を'], ['で']],
    fn: function(obj: any, m: any, args: any, sys: NakoSystem) {
      // objが文字列ならevalして関数を得る
       
      if (typeof obj === 'string') { obj = sys.__evalJS(obj, sys) }
      if (typeof obj !== 'object') { throw new Error('JSオブジェクトを取得できませんでした。') }

      // method を求める
      if (typeof m !== 'function') {
        m = obj[m]
      }

      // argsがArrayでなければArrayに変換する
      if (!(args instanceof Array)) { args = [args] }

      // 実行
      return m.apply(obj, args)
    }
  },

  'ナデシコ': { // @なでしこのコードCODEを実行する // @なでしこする
    type: 'func',
    josi: [['を', 'で']],
    pure: false,
    asyncFn: true,
    fn: async function(code: string, sys: any) {
      const options = {
        resetEnv: false,
        resetAll: true,
        nakoGlobal: sys
      }
      const tmpLog = String(sys.__getSysVar('表示ログ', ''))
      sys.__setSysVar('表示ログ', '')
      await sys.__self.runAsync(code, sys.__modName, options)
      const outLog = String(sys.__getSysVar('表示ログ'))
      sys.__setSysVar('表示ログ', tmpLog + outLog)
      return outLog
    }
  },
  'ナデシコ続': { // @なでしこのコードCODEを実行する // @なでしこつづける
    type: 'func',
    josi: [['を', 'で']],
    pure: false,
    asyncFn: true,
    fn: async function(code: string, sys: any) {
      const options = {
        resetEnv: false,
        resetAll: false,
        nakoGlobal: sys.__self
      }
      const tmpLog = sys.__getSysVar('表示ログ', '')
      sys.__setSysVar('表示ログ', '')
      await sys.__self.runAsync(code, sys.__modName, options)
      const outLog = String(sys.__getSysVar('表示ログ'))
      if (outLog) {
        sys.logger.trace(outLog)
      }
      sys.__setSysVar('表示ログ', tmpLog + outLog)
      return outLog
    }
  },
  '実行': { // @ 無名関数（あるいは、文字列で関数名を指定）Fを実行する(Fが関数でなければ無視する) // @じっこう
    type: 'func',
    josi: [['を', 'に', 'で']],
    pure: false,
    fn: function(f: any, sys: any) {
      // #938 の規則に従って処理
      // 引数が関数なら実行
      if (typeof f === 'function') { return f(sys) }
      // 文字列なら関数に変換できるか判定して実行
      if (typeof f === 'string') {
        const tf = sys.__findFunc(f, '実行')
        if (typeof tf === 'function') {
          return tf(sys)
        }
      }
      // それ以外ならそのまま値を返す
      return f
    }
  },
  '実行時間計測': { // @ 関数Fを実行して要した時間をミリ秒で返す // @じっこうじかんけいそく
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function(f: any, sys: any) {
      if (typeof f === 'string') { f = sys.__findFunc(f, '実行時間計測') }
      //
      if (performance && performance.now) {
        const t1 = performance.now()
        f(sys)
        const t2 = performance.now()
        return (t2 - t1)
      } else {
        const t1 = Date.now()
        f(sys)
        const t2 = Date.now()
        return (t2 - t1)
      }
    }
  },
  '終': { // @終わる // @おわる
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      // デバッグモードでなければ例外を投げることでプログラムを終了させる
      sys.__setSysVar('__forceClose', true)
      if (!sys.__getSysVar('__useDebug')) { throw new Error('__終わる__') }
    }
  },

  // @デバッグ支援
  'デバッグ表示': { // @デバッグ用にSを表示する // @でばっぐひょうじ
    type: 'func',
    josi: [['と', 'を', 'の']],
    pure: true,
    fn: function(s: any, sys: NakoSystem) {
      // 行番号の情報を得る
      const lineInfo: string = String(sys.__getSysVar('__line', 0)) + '::'
      const a = lineInfo.split(':', 2)
      const no = parseInt(String(a[0]).replace('l', '')) + 1
      const fname = a[1]
      // オブジェクトならJSON文字列に変換
      if (typeof s === 'object') {
        s = JSON.stringify(s)
      }
      s = `${fname}(${no}): ${s}`
      sys.__exec('表示', [s, sys])
    },
    return_none: true
  },
  'ハテナ関数設定': { // @ハテナ関数「?? (計算式)」の動作をカスタマイズする。文字列の配列を指定可能で、システム関数名か「js:code」を指定可能。 // @はてなかんすうせってい
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(s: any, sys: NakoSystem) {
      if (typeof s === 'function') {
        sys.__hatena = s
        return
      }
      if (typeof s === 'string') {
        sys.__hatena = sys.__getSysVar(s, 'デバッグ表示')
        return
      }
      if (s instanceof Array) {
        const fa: ((s: string, sys: NakoSystem)=>string)[] = (s as Array<string>).map((fstr: string) => {
          if (fstr.substring(0, 3) === 'JS:') {
            const code = fstr.substring(3)
            return sys.__evalJS(code, sys)
          } else {
            return sys.__getSysVar(fstr, 'デバッグ表示')
          }
        })
        sys.__hatena = (p: any, sys: NakoSystem) => {
          let param: any = p
          for (const f of fa) {
            param = f(param, sys)
          }
        }
        return
      }
      sys.__hatena = sys.__getSysVar('デバッグ表示')
    },
    return_none: true
  },
  'ハテナ関数実行': { // @『ハテナ関数設定』で設定した関数を実行する // @はてなかんすうじっこう
    type: 'func',
    josi: [['の', 'を', 'と']],
    pure: true,
    fn: function(s: any, sys: NakoSystem) {
      sys.__hatena(s, sys)
    },
    return_none: true
  },
  'エラー発生': { // @故意にエラーSを発生させる // @えらーはっせい
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function(s: any) {
      throw new Error(s)
    },
    return_none: true
  },
  '__DEBUG': { // @デバッグモードにする // @__DEBUG
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      sys.isDebug = true
      console.log(sys)
    }
  },
  '__DEBUG強制待機': { type: 'const', value: 0 }, // @__DEBUGきょうせいたいき
  '__DEBUGブレイクポイント一覧': { type: 'const', value: [] }, // @__DEBUGぶれいくぽいんといちらん
  '__DEBUG待機フラグ': { type: 'const', value: 0 }, // @__DEBUGたいきふらぐ
  '__DEBUG_BP_WAIT': { // @エディタのブレイクポイント機能のための待機 // @__DEBUG_BP_WAIT
    type: 'func',
    josi: [['で']],
    pure: true,
    asyncFn: true,
    fn: function(curLine: number, sys: any) {
      return new Promise((resolve) => {
        const breakpoints = sys.__getSysVar('__DEBUGブレイクポイント一覧')
        const forceLine = sys.__getSysVar('__DEBUG強制待機')
        sys.__setSysVar('__DEBUG強制待機', 0)
        // ブレイクポイント or __DEBUG強制待機 が指定されたか？
        if (breakpoints.indexOf(curLine) >= 0 || forceLine) {
          if (sys.__getSysVar('プラグイン名') !== 'メイン') { return } // 現状メインのみデバッグする
          console.log(`@__DEBUG_BP_WAIT(${curLine})`)
          const timerId = setInterval(() => {
            if (sys.__getSysVar('__DEBUG待機フラグ') === 1) {
              sys.__setSysVar('__DEBUG待機フラグ', 0)
              clearInterval(timerId)
              resolve(curLine)
            }
          }, 500)
        } else {
          resolve(curLine)
        }
      })
    }
  },
  'グローバル関数一覧取得': { // @グローバル変数にある関数一覧を取得 // @ぐろーばるかんすういちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      const vars: Map<string, any> = (sys as any).__varslist[1]
      const res: string[] = []
      for (const key of vars.keys()) {
        res.push(key)
      }
      return res
    }
  },
  'システム関数一覧取得': { // @システム関数の一覧を取得 // @しすてむかんすういちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      const vars: Map<string, any> = (sys as any).__v0
      const res: string[] = []
      for (const key of vars.keys()) {
        if (key.startsWith('__') || key.startsWith('!') || key === 'meta') { continue }
        res.push(key)
      }
      return res
    }
  },
  'システム関数存在': { // @文字列で関数名を指定してシステム関数が存在するかを調べる // @しすてむかんすうそんざい
    type: 'func',
    josi: [['が', 'の']],
    pure: true,
    fn: function(fname: string, sys: any) {
      return (typeof sys.__getSysVar(fname) !== 'undefined')
    }
  },
  'プラグイン一覧取得': { // @利用中のプラグイン一覧を得る // @ぷらぐいんいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      const a = []
      for (const f in (sys as any).pluginfiles) { a.push(f) }
      return a
    }
  },
  'モジュール一覧取得': { // @取り込んだモジュール一覧を得る // @もじゅーるいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      const a = []
      for (const f in (sys as any).__module) { a.push(f) }
      return a
    }
  },
  '助詞一覧取得': { // @文法として定義されている助詞の一覧を取得する // @じょしいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    asyncFn: false,
    fn: function(sys: NakoSystem) {
      return sys.josiList
    }
  },
  '予約語一覧取得': { // @文法として定義されている予約語の一覧を取得する // @よやくごいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    asyncFn: false,
    fn: function(sys: NakoSystem) {
      return sys.reservedWords
    }
  },
  // @プラグイン管理
  'プラグイン名': { type: 'const', value: 'メイン' }, // @ぷらぐいんめい
  'プラグイン名設定': { // @プラグイン名をSに変更する(システムにより自動的に「メイン」あるいはプラグインのファイル名が呼ばれる) // @ぷらぐいんめいせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function(s: string, sys: any) {
      sys.__setSysVar('プラグイン名', s)
    },
    return_none: true
  },
  '名前空間': { type: 'const', value: '' }, // @なまえくうかん
  '名前空間設定': { // @名前空間をSに設定する(システムにより自動的に変更される。ファイル名から拡張子を削ったもの) // @なまえくうかんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function(s: string, sys: NakoSystem) {
      // push namespace
      (sys as any).__namespaceList.push([sys.__getSysVar('名前空間'), sys.__getSysVar('プラグイン名')])
      sys.__setSysVar('名前空間', s)
    },
    return_none: true
  },
  '名前空間ポップ': { // @システム利用のため呼ぶべからず。(名前空間を一つ前の値に戻す) // @なまえくうかんぽっぷ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      // pop namespace
      const a = (sys as any).__namespaceList.pop()
      if (a) {
        sys.__setSysVar('名前空間', a[0])
        sys.__setSysVar('プラグイン名', a[1])
      }
    },
    return_none: true
  }
}
