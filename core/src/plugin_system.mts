 
import { NakoRuntimeError } from './nako_errors.mjs'
import { NakoSystem } from './plugin_api.mjs'
// plugin_system.mts は肥大化していたため、内容ごとに複数ファイルへ分割している (#2351)
// いずれも単独のプラグインではなく、実行時にこの plugin_system へマージされる
import PluginSystemDebug from './plugin_system_debug.mjs' // 特殊命令・デバッグ支援・プラグイン管理
import PluginSystemMath from './plugin_system_math.mjs' // 四則演算・論理演算・ビット演算
import PluginSystemString from './plugin_system_string.mjs' // 文字列処理・置換/トリム・文字変換・指定形式・文字種類
import PluginSystemArray from './plugin_system_array.mjs' // 配列操作・二次元配列処理
import PluginSystemDatetime from './plugin_system_datetime.mjs' // 日時処理(簡易)
import PluginSystemUrl from './plugin_system_url.mjs' // URLエンコード・パラメータ・BASE64・パス操作

const PluginSystem = {
  'meta': {
    type: 'const',
    value: {
      pluginName: 'plugin_system', // プラグインの名前
      description: 'システム関連の命令を提供するプラグイン', // プラグインの説明
      pluginVersion: '3.6.0', // プラグインのバージョン
      nakoRuntime: ['wnako', 'cnako', 'phpnako'], // 対象ランタイム
      nakoVersion: '3.6.0' // 要求なでしこバージョン
    }
  },
  '初期化': {
    type: 'func',
    josi: [],
    pure: false,
    fn: function(sys: NakoSystem) {
      // システム変数の初期化
      const system: any = sys
      sys.pathSeparator = '/'  // パス記号 #2185
      sys.engine = '?'  // エンジン名
      sys.isDebug = false
      // システム変数にアクセスするための関数を定義
      sys.__setSysVar = (name: string, value: any): void => system.__v0.set(name, value)
      sys.__getSysVar = (name: string, defaultValue: any = undefined): any => {
        const v = system.__v0.get(name)
        if (v === undefined) { return defaultValue }
        return v
      }
      sys.__setSore = (v: any): any => { (sys as any).__vars.set('それ', v); return v }
      sys.__getSore = (): any => (sys as any).__vars.get('それ')
      sys.tags = {} // タグ - プラグイン側で自由に使えるオブジェクト
      // 言語バージョンを設定
      sys.__setSysVar('ナデシコバージョン', sys.version)
      sys.__setSysVar('ナデシコ言語バージョン', sys.coreVersion)
      if (!system.__namespaceList) { system.__namespaceList = [] }
      // なでしこの関数や変数を探して返す
      sys.__findVar = function(nameStr: any, def: any): any {
        if (typeof nameStr === 'function') { return nameStr }
        // ローカル変数を探す
        const localVar = system.__locals.get(nameStr)
        if (localVar) { return localVar }
        // 名前空間が指定されている場合
        if (nameStr.indexOf('__') >= 0) {
          for (let i = 2; i >= 0; i--) {
            const varScope = system.__varslist[i]
            const scopeValue = varScope.get(nameStr)
            if (scopeValue) { return scopeValue }
          }
          return def
        }
        // 名前空間を参照して関数・変数名を解決する
        const modList = system.__modList ? system.__modList : [system.__modName]
        for (const modName of modList) {
          const gname = `${modName}__${nameStr}`
          for (let i = 2; i >= 0; i--) {
            const scope = system.__varslist[i]
            const scopeValue = scope.get(gname)
            if (scopeValue) { return scopeValue }
          }
        }
        return def
      }
      // 文字列から関数を探す
      sys.__findFunc = function(nameStr: any, parentFunc: string): any {
        const f = sys.__findVar(nameStr)
        if (typeof f === 'function') { return f }
        throw new Error(`『${parentFunc}』に実行できない関数が指定されました。`)
      }
      // システム関数を実行
      sys.__exec = function(func: string, params: any[]): any {
        // システム命令を優先
        const f0 = sys.__getSysVar(func)
        if (f0) { return f0.apply(this, params) }
        // グローバル・ローカルを探す
        const f = sys.__findVar(func)
        if (!f) { throw new Error('システム関数でエイリアスの指定ミス:' + func) }
        return f.apply(this, params)
      }
      // タイマーに関する処理(タイマーは「!クリア」で全部停止する)
      sys.__timeout = []
      sys.__interval = []
      // 日付処理などに使う
      const z2 = sys.__zero2 = (s: string|number): string => {
        s = '00' + String(s)
        return s.substring(s.length - 2)
      }
      sys.__zero = (s: string, keta: number): string => {
        let zeroS = ''
        for (let i = 0; i < keta; i++) { zeroS += '0' }
        s = zeroS + s
        return s.substring(s.length - keta)
      }
      sys.__formatDate = (t: Date): string => {
        return String(t.getFullYear()) + '/' + z2(t.getMonth() + 1) + '/' + z2(t.getDate())
      }
      sys.__formatTime = (t: Date): string => {
        return z2(t.getHours()) + ':' + z2(t.getSeconds()) + ':' + z2(t.getMinutes())
      }
      sys.__formatDateTime = (t: Date, fmt: string): string => {
        const dateStr = String(t.getFullYear()) + '/' + z2(t.getMonth() + 1) + '/' + z2(t.getDate())
        const timeStr = z2(t.getHours()) + ':' + z2(t.getMinutes()) + ':' + z2(t.getSeconds())
        if (fmt.match(/^\d+\/\d+\/\d+\s+\d+:\d+:\d+$/)) {
          return dateStr + ' ' + timeStr
        }
        if (fmt.match(/^\d+\/\d+\/\d+$/)) {
          return dateStr
        }
        if (fmt.match(/^\d+:\d+:\d+$/)) {
          return timeStr
        }
        return dateStr + ' ' + timeStr
      }
      sys.__str2date = (s: string): Date => {
        // trim
        s = ('' + s).replace(/(^\s+|\s+$)/, '')
        // is unix time
        if (s.match(/^(\d+|\d+\.\d+)$/)) {
          return new Date(parseFloat(s) * 1000)
        }
        // is time ?
        if (s.match(/^\d+:\d+(:\d+)?$/)) {
          const t = new Date()
          const a = (s + ':0').split(':')
          return new Date(
            t.getFullYear(), t.getMonth(), t.getDate(),
            parseInt(a[0]), parseInt(a[1]), parseInt(a[2]))
        }
        // replace splitter to '/'
        s = s.replace(/[\s:\-T]/g, '/')
        s += '/0/0/0' // 日付だけのときのために時間分を足す
        const a = s.split('/')
        return new Date(parseInt(a[0]), parseInt(a[1]) - 1, parseInt(a[2]),
          parseInt(a[3]), parseInt(a[4]), parseInt(a[5]))
      }
      // 『継続表示』のための一時変数(『表示』実行で初期化)
      sys.__printPool = ''
      // 暗黙の型変換で足し算を行うときに使用。bigint はそのまま、その他は number に自動変換
      sys.__parseFloatOrBigint = (v: any): number | bigint => {
        return (typeof v) === 'bigint' ? v : parseFloat(v)
      }
      // undefinedチェック
      system.chk = (value:any, constId: number): any => {
        if (typeof value === 'undefined') {
          const cp = system.constPools[constId]
          const [msgNo, msgArgs, fileNo, lineNo] = cp
          let msg = system.constPoolsTemplate[msgNo]
          for (const i in msgArgs) {
            const arg = system.constPoolsTemplate[msgArgs[i]]
            msg = msg.split(`$${i}`).join(arg)
          }
          const fileStr = system.constPoolsTemplate[fileNo]
          sys.logger.warn(msg, { file: fileStr, line: lineNo })
        }
        return value
      }
      // eval function #1733
      sys.__evalSafe = (src: string) => {
        // evalのスコープを変えるためのテクニック
        // https://esbuild.github.io/content-types/#direct-eval
         
        const _eval = eval
        try {
          return _eval(src)
        } catch (e) {
          console.warn('[eval]', e)
          return null
        }
      }
      // eval function #1733 - 互換性を優先するため、direct evalを使うことに
      sys.__evalJS = (src: string, sys?: NakoSystem) => {
        try {
          // まず従来通りevalで評価（式の値を返す互換性を維持）
          return eval(src) // oxlint-disable-line no-eval
        } catch (e) {
          // return文によるSyntaxErrorの場合のみIIFEで再試行 (#NE-006)
          if (e instanceof SyntaxError && e.message.includes('return')) {
            try {
              return (new Function('sys', `return (function(sys){\n${src}\n})(sys)`))(sys)
            } catch (e2) {
              console.warn('[eval]', e2)
              return null
            }
          }
          console.warn('[eval]', e)
          return null
        }
      }
      // Propアクセス支援
      sys.__registPropAccessor = (f: any, getProp: (prop: string|string[], sys: NakoSystem) => any, setProp: (prop: string|string[], value: object, sys: NakoSystem) => any) => {
        system.__propAccessor.push(
          {
            target: f,
            getProp,
            setProp
          }
        )
      }
      sys.__checkPropAccessor = (mode: 'get'|'set', obj: any):void => {
        if ((mode === 'get' && obj.__getProp === undefined) || (mode === 'set' && obj.__setProp === undefined)) {
          for (let i = 0; i < system.__propAccessor.length; i++) {
            const accs = system.__propAccessor[i]
            if (accs.target[Symbol.hasInstance](obj)) {
              if (accs.getProp) {
                obj.__getProp = accs.getProp
              } else { obj.__getProp = null }
              if (accs.setProp) {
                obj.__setProp = accs.setProp
              } else { obj.__setProp = null }
              return
            }
          }
          obj.__getProp = obj.__setProp = null
        }
      }
      // 「??」ハテナ関数の設定
      sys.__hatena = sys.__getSysVar('デバッグ表示')
    }
  },
  '!クリア': {
    type: 'func',
    josi: [],
    fn: function(sys: NakoSystem) {
      if (sys.__exec) { sys.__exec('全タイマー停止', [sys]) }
      sys.__setSysVar('表示ログ', '')
    }
  },

  // @システム定数
  'ナデシコバージョン': { type: 'const', value: '?' }, // @なでしこばーじょん
  'ナデシコ言語バージョン': { type: 'const', value: '?' }, // @なでしこげんごばーじょん
  'ナデシコエンジン': { type: 'const', value: 'nadesi.com/v3' }, // @なでしこえんじん
  'ナデシコ種類': { type: 'const', value: '?' }, // @なでしこしゅるい
  'はい': { type: 'const', value: true }, // @はい
  'いいえ': { type: 'const', value: false }, // @いいえ
  '真': { type: 'const', value: true }, // @しん
  '偽': { type: 'const', value: false }, // @ぎ
  '永遠': { type: 'const', value: true }, // @えいえん
  'オン': { type: 'const', value: true }, // @おん
  'オフ': { type: 'const', value: false }, // @おふ
  '改行': { type: 'const', value: '\n' }, // @かいぎょう
  'タブ': { type: 'const', value: '\t' }, // @たぶ
  'カッコ': { type: 'const', value: '「' }, // @かっこ
  'カッコ閉': { type: 'const', value: '」' }, // @かっことじ
  '波カッコ': { type: 'const', value: '{' }, // @なみかっこ
  '波カッコ閉': { type: 'const', value: '}' }, // @なみかっことじ
  'OK': { type: 'const', value: true }, // @OK
  'NG': { type: 'const', value: false }, // @NG
  'キャンセル': { type: 'const', value: 0 }, // @きゃんせる
  'TRUE': { type: 'const', value: true }, // @TRUE
  'FALSE': { type: 'const', value: false }, // @FALSE
  'true': { type: 'const', value: true }, // @true
  'false': { type: 'const', value: false }, // @false
  'PI': { type: 'const', value: Math.PI }, // @PI
  '空': { type: 'const', value: '' }, // @から
  'NULL': { type: 'const', value: null }, // @NULL
  'undefined': { type: 'const', value: undefined }, // @undefined
  '未定義': { type: 'const', value: undefined }, // @みていぎ
  'エラーメッセージ': { type: 'const', value: '' }, // @えらーめっせーじ
  '対象': { type: 'const', value: '' }, // @たいしょう
  '対象キー': { type: 'const', value: '' }, // @たいしょうきー
  '回数': { type: 'const', value: '' }, // @かいすう
  'CR': { type: 'const', value: '\r' }, // @CR
  'LF': { type: 'const', value: '\n' }, // @LF
  '非数': { type: 'const', value: NaN }, // @ひすう
  '無限大': { type: 'const', value: Infinity }, // @むげんだい
  '戻値無': { type: 'const', value: 0 }, // @もどりちなし
  '戻値有': { type: 'const', value: 1 }, // @もどりちあり
  '空配列': { // @空の配列を返す。『[]』と同義。 // @からはいれつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(): any {
      return []
    }
  },
  '空辞書': { // @空の辞書型を返す。『{}』と同義。 // @からじしょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(): any {
      return {}
    }
  },
  '空ハッシュ': { // @空のハッシュを返す(v3.2以降非推奨) // @からはっしゅ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(): any {
      return {}
    }
  },
  '空オブジェクト': { // @空のオブジェクトを返す(v3.2以降非推奨) // @からおぶじぇくと
    type: 'func',
    josi: [],
    pure: false,
    fn: function(sys: NakoSystem): any {
      return sys.__exec('空ハッシュ', [sys])
    }
  },
  '真偽判定': { // @引数bが真(true)ならば「真」を偽(false)ならば「偽」を返す // @しんぎはんてい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(b: any): string {
      return b ? '真' : '偽'
    }
  },

  // @標準出力
  '表示': { // @Sを表示 // @ひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string, sys: any) {
      // 継続表示の一時プールを出力
      s = String(sys.__printPool) + s
      sys.__printPool = ''
      //
      sys.__setSysVar('表示ログ', String(sys.__getSysVar('表示ログ')) + s + '\n')
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  '継続表示': { // @Sを改行なしで表示(ただし「表示」命令を使うことで画面出力される) // @けいぞくひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string, sys: any) {
      sys.__printPool += s
    },
    return_none: true
  },
  '連続表示': { // @引数に指定した引数を全て表示する // @れんぞくひょうじ
    type: 'func',
    josi: [['と', 'を']],
    isVariableJosi: true,
    pure: true,
    fn: function(...a: any) {
      const sys = a.pop()
      const v = a.join('')
      sys.__exec('表示', [v, sys])
    },
    return_none: true
  },
  '連続無改行表示': { // @引数に指定した引数を全て表示する（改行しない) // @れんぞくむかいぎょうひょうじ
    type: 'func',
    josi: [['と', 'を']],
    isVariableJosi: true,
    pure: true,
    fn: function(...a: any) {
      const sys = a.pop()
      const v = a.join('')
      sys.__exec('継続表示', [v, sys])
    },
    return_none: true
  },
  '表示ログ': { type: 'const', value: '' }, // @ひょうじろぐ
  '表示ログクリア': { // @表示ログを空にする // @ひょうじろぐくりあ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      sys.__setSysVar('表示ログ', '')
    },
    return_none: true
  },
  '言': { // @Sを表示 // @いう
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string, sys: any) {
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  'コンソール表示': { // @Sをコンソール表示する(console.log) // @こんそーるひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function(s: string) {
      console.log(s)
    },
    return_none: true
  },

  // @敬語
  'ください': { // @敬語対応のため // @ください
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  'お願': { // @ソースコードを読む人を気持ちよくする // @おねがいします
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  'です': { // @ソースコードを読む人を気持ちよくする // @です
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  '拝啓': { // @ソースコードを読む人を気持ちよくする // @はいけい
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      sys.__reisetu = 0
    },
    return_none: true
  },
  '敬具': { // @ソースコードを読む人を気持ちよくする // @けいぐ
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      sys.__reisetu += 100 // bonus point
    },
    return_none: true
  },
  '礼節レベル取得': { // @(お遊び)敬語を何度使ったか返す // @れいせつれべるしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      return sys.__reisetu
    }
  },

  // @型変換
  '変数型確認': { // @変数Vの型を返す // @へんすうかたかくにん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any) {
      return (typeof v)
    }
  },
  'TYPEOF': { // @変数Vの型を返す // @TYPEOF
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any) {
      return (typeof v)
    }
  },
  '文字列変換': { // @値Vを文字列に変換 // @もじれつへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): string {
      return String(v)
    }
  },
  'TOSTR': { // @値Vを文字列に変換 // @TOSTR
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): string {
      return String(v)
    }
  },
  '整数変換': { // @値Vを整数に変換 // @せいすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseInt(v)
    }
  },
  'TOINT': { // @値Vを整数に変換 // @TOINT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseInt(v)
    }
  },
  '実数変換': { // @値Vを実数に変換 // @じっすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseFloat(v)
    }
  },
  'TOFLOAT': { // @値Vを実数に変換 // @TOFLOAT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): number {
      return parseFloat(v)
    }
  },
  'INT': { // @値Vを整数に変換 // @INT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): number {
      return parseInt(v)
    }
  },
  'FLOAT': { // @値Vを実数に変換 // @FLOAT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): number {
      return parseFloat(v)
    }
  },
  'NAN判定': { // @値VがNaNかどうかを判定(命令『非数判定』を使う事を推奨) // @NANはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): boolean {
      return isNaN(v)
    }
  },
  '非数判定': { // @値Vが非数かどうかを判定(NAN判定より堅牢) // @ひすうはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(v: any): boolean {
      // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
      return Number.isNaN(v)
    }
  },
  'HEX': { // @値Vを16進数に変換 // @HEX
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any): string {
      return parseInt(a).toString(16)
    }
  },
  '進数変換': { // @値VをN進数に変換 // @しんすうへんかん
    type: 'func',
    josi: [['を', 'の'], ['']],
    pure: true,
    fn: function(v: any, n: number): string {
      return parseInt(v).toString(n)
    }
  },
  '二進': { // @値Vを2進数に変換 // @にしん
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any): string {
      return parseInt(v).toString(2)
    }
  },
  '二進表示': { // @値Vを2進数に変換して表示 // @にしんひょうじ
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any, sys: any) {
      const s = parseInt(v).toString(2)
      sys.__exec('表示', [s, sys])
    }
  },
  'RGB': { // @HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255 // @RGB
    type: 'func',
    josi: [['と'], ['の'], ['で']],
    pure: true,
    fn: function(r: any, g: any, b: any): string {
      const z2 = (v: any): string => {
        const v2: string = '00' + (parseInt(String(v)).toString(16))
        return v2.substring(v2.length - 2, v2.length)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    }
  },

  // @JSON
  'JSON変換': { // @オブジェクトVをJSON形式の文字列に変換して返す // @JSONへんかん
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v)
    }
  },
  'JSON取得': { // @JSON文字列をパースして、なでしこのオブジェクトとして返す // @JSONしゅとく
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(v: any) {
      return JSON.parse(v)
    }
  },
  'JSONエンコード': { // @オブジェクトVをJSON形式に変換して返す(『JSON変換』と同じ) // @JSONえんこーど
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v)
    }
  },
  'JSONエンコード整形': { // @オブジェクトVをJSON形式の文字列(整形済み)に変換して整形して返す // @JSONえんこーどせいけい
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSONデコード': { // @JSON文字列Sをオブジェクトにして返す(『JSON取得』と同じ) // @JSONでこーど
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(s: string): string {
      return JSON.parse(s)
    }
  },
  'JSON_E': { // @オブジェクトVをJSON形式の文字列に変換して返す(『JSON変換』と同じ) // @JSON_E
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v)
    }
  },
  'JSON_ES': { // @オブジェクトVをJSON形式の文字列(整形済み)に変換して返す(『JSONエンコード整形』と同じ) // @JSON_ES
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function(v: any) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSON_D': { // @JSON文字列Sをオブジェクトにして返す(『JSON取得』と同じ) // @JSON_D
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function(s: string): string {
      return JSON.parse(s)
    }
  },

  // @正規表現
  '正規表現マッチ': { // @文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは「/pat/opt」の形式で指定。optにgの指定がなければ部分マッチが『抽出文字列』に入る) // @せいきひょうげんまっち
    type: 'func',
    josi: [['を', 'が'], ['で', 'に']],
    pure: true,
    fn: function(a: string, b: string, sys: any): string {
      let re
      const f = ('' + b).match(/^\/(.+)\/([a-zA-Z]*)$/)
      // パターンがない場合
      if (f === null) { re = new RegExp(b, 'g') } else { re = new RegExp(f[1], f[2]) }
      const sa: any[] = sys.__getSysVar('抽出文字列')
      sa.splice(0, sa.length) // clear
      const m = String(a).match(re)
      let result: any = m
      if (re.global) {
        // no groups
      } else if (m) {
        // has group?
        if (m.length > 0) {
          result = m[0]
          for (let i = 1; i < m.length; i++) { sa[i - 1] = m[i] }
        }
      }
      return result
    }
  },
  '正規表現抽出': { // @文字列Sを正規表現パターンREで正規表現マッチし、すべてのキャプチャグループ( )を一次元配列として返す。抽出文字列には二次元配列を返す// @せいきひょうげんちゅうしゅつ
    type: 'func',
    josi: [['から','を'], ['で']],
    pure: true,
    fn: function(a: string, b: string, sys: any): any[] {
      let pattern = '' + b
      let flags = 'g'
      const f = pattern.match(/^\/(.+)\/([a-zA-Z]*)$/)
      if (f) {
        pattern = f[1]
        flags = f[2] || ''
      }
      if (!flags.includes('g')) flags += 'g'

      const re = new RegExp(pattern, flags)

      const sa: any[] = sys.__getSysVar('抽出文字列')
      sa.splice(0, sa.length) // clear

      const result: any[] = []   // 一次元配列
      const caps2d: any[] = []   // 二次元配列（sa に入れる）

      for (const m of String(a).matchAll(re)) {

        // ★ 名前付きキャプチャがある場合
        if (m.groups && Object.keys(m.groups).length > 0) {
          const row: Record<string, string> = {}

          for (const [key, val] of Object.entries(m.groups)) {
            row[key] = val
            result.push(val) // result は平坦化
          }

          caps2d.push(row)
          continue
        }

        // ★ 通常キャプチャ（従来どおり）
        let caps = [...m].slice(1)

        if (caps.length === 0) {
          caps = [m[0]] //キャプチャがない場合
        }

        caps2d.push(caps)
        result.push(...caps)
      }

      // マッチなし → 両方空のまま
      if (caps2d.length === 0) {
        return result
      }

      // sa に二次元配列をコピー
      for (const row of caps2d) {
        sa.push(row)
      }

      return result
    }
  },
  '抽出文字列': { type: 'const', value: [] }, // @ちゅうしゅつもじれつ
  '正規表現置換': { // @文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定) // @せいきひょうげんちかん
    type: 'func',
    josi: [['の'], ['を', 'から'], ['で', 'に', 'へ']],
    pure: true,
    fn: function(s: string, a: string, b: string): string {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).replace(re, b)
    }
  },
  '正規表現区切': { // @文字列Sを正規表現パターンAで区切って配列で返す(パターンAは/pat/optで指定) // @せいきひょうげんくぎる
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(s: any, a: any) {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).split(re)
    }
  },

  // @辞書型変数の操作
  '辞書キー列挙': { // @辞書型変数Aのキーの一覧を配列で返す。 // @じしょきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      const keys = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) { keys.push(key) }
        return keys
      }
      if (a instanceof Array) { // 配列なら数字を返す
        for (let i = 0; i < a.length; i++) { keys.push(i) }
        return keys
      }
      throw new Error('『辞書キー列挙』でハッシュ以外が与えられました。')
    }
  },
  '辞書キー削除': { // @辞書型変数AからキーKEYを削除して返す（A自体を変更する）。 // @じしょきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    fn: function(a: any, key: any) {
      if (a instanceof Object) { // オブジェクトのキーを返す
        if (key in a) { delete a[key] }
        return a
      }
      throw new Error('『辞書キー削除』でハッシュ以外が与えられました。')
    }
  },
  '辞書キー存在': { // @辞書型変数AのキーKEYが存在するか確認 // @じしょきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function(a: any, key: any) {
      return key in a
    }
  },
  // @ハッシュ
  'ハッシュキー列挙': { // @ハッシュAのキー一覧を配列で返す。 // @はっしゅきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any, sys: any) {
      return sys.__exec('辞書キー列挙', [a, sys])
    }
  },
  'ハッシュ内容列挙': { // @ハッシュAの内容一覧を配列で返す。 // @はっしゅないようれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(a: any) {
      const body = []
      if (a instanceof Object) { // オブジェクトのキーを返す
        for (const key in a) { body.push(a[key]) }
        return body
      }
      throw new Error('『ハッシュ内容列挙』でハッシュ以外が与えられました。')
    }
  },
  'ハッシュキー削除': { // @ハッシュAからキーKEYを削除して返す。 // @はっしゅきーさくじょ
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    fn: function(a: any, key: any, sys: any) {
      return sys.__exec('辞書キー削除', [a, key, sys])
    }
  },
  'ハッシュキー存在': { // @ハッシュAのキーKEYが存在するか確認 // @はっしゅきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function(a: any, key: any) {
      return key in a
    }
  },
  // @タイマー
  '秒待': { // @ N秒の間待機する // @びょうまつ
    type: 'func',
    josi: [['']],
    pure: true,
    asyncFn: true,
    fn: function(n: any, sys:any): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          // タイマーを仕掛ける
          const timerId = setTimeout(() => {
            // タイマー使用中リストに追加したIDを削除
            const i = sys.__timeout.indexOf(timerId)
            if (i >= 0) { sys.__timeout.splice(i, 1) }
            // Promiseを終了
            resolve()
          }, parseFloat(n) * 1000)
          // タイマー使用中リストに追加
          sys.__timeout.push(timerId)
        } catch (err: any) {
          reject(err)
        }
      })
    },
    return_none: true
  },
  '秒待機': { // @ N秒の間待機する(『秒待』と同じ) // @びょうたいき
    type: 'func',
    josi: [['']],
    pure: true,
    asyncFn: true,
    fn: async function(n: any, sys: any) {
      const p = sys.__exec('秒待', [n, sys])
      return await p
    },
    return_none: true
  },
  '秒逐次待機': { // @ (非推奨) 逐次実行構文にて、N秒の間待機する (廃止予定) // @びょうちくじたいき
    type: 'func',
    josi: [['']],
    pure: true,
    asyncFn: true,
    fn: async function(n: any, sys: any) {
      const p = sys.__exec('秒待', [n, sys])
      return await p
    },
    return_none: true
  },
  '秒後': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒後に実行する。変数『対象』にタイマーIDを代入する。 // @びょうご
    type: 'func',
    josi: [['を'], ['']],
    pure: true,
    fn: function(f: any, n: any, sys: any) {
      // 文字列で指定された関数をオブジェクトに変換
      if (typeof f === 'string') { f = sys.__findFunc(f, '秒後') }
      // 1回限りのタイマーをセット
      const timerId = setTimeout(() => {
        // 使用中リストに追加したIDを削除
        const i = sys.__timeout.indexOf(timerId)
        if (i >= 0) { sys.__timeout.splice(i, 1) }
        try {
          f(timerId, sys)
        } catch (e: any) {
          let err = e
          if (!(e instanceof NakoRuntimeError)) {
            err = new NakoRuntimeError(e, sys.__getSysVar('__line'))
          }
          sys.logger.error(err)
        }
      }, parseFloat(n) * 1000)
      sys.__timeout.unshift(timerId)
      sys.__setSysVar('対象', timerId)
      return timerId
    }
  },
  '秒毎': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『タイマー停止』で停止できる)。変数『対象』にタイマーIDを代入する。 // @びょうごと
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function(f: any, n: any, sys: any) {
      // 文字列で指定された関数をオブジェクトに変換
      if (typeof f === 'string') { f = sys.__findFunc(f, '秒毎') }
      // タイマーをセット
      const timerId = setInterval(() => {
        f(timerId, sys)
      }, parseFloat(n) * 1000)
      // タイマーIDを追加
      sys.__interval.unshift(timerId)
      sys.__setSysVar('対象', timerId)
      return timerId
    }
  },
  '秒タイマー開始時': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『秒毎』と同じ) // @びょうたいまーかいししたとき
    type: 'func',
    josi: [['を'], ['']],
    pure: false,
    fn: function(f: any, n: any, sys: any) {
      return sys.__exec('秒毎', [f, n, sys])
    }
  },
  'タイマー停止': { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを停止する // @たいまーていし
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function(timerId: any, sys: any) {
      const i = sys.__interval.indexOf(timerId)
      if (i >= 0) {
        sys.__interval.splice(i, 1)
        clearInterval(timerId)
        return true
      }
      const j = sys.__timeout.indexOf(timerId)
      if (j >= 0) {
        sys.__timeout.splice(j, 1)
        clearTimeout(timerId)
        return true
      }
      return false
    },
    return_none: false
  },
  '全タイマー停止': { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを全部停止する // @ぜんたいまーていし
    type: 'func',
    josi: [],
    pure: true,
    fn: function(sys: NakoSystem) {
      // clearInterval
      for (let i = 0; i < sys.__interval.length; i++) {
        const timerId = sys.__interval[i]
        clearInterval(timerId)
      }
      sys.__interval = []
      // clearTimeout
      for (let i = 0; i < sys.__timeout.length; i++) {
        const timerId = sys.__timeout[i]
        clearTimeout(timerId)
      }
      sys.__timeout = []
    },
    return_none: true
  },

}

// 分割ファイルの命令を plugin_system にマージする (#2351)
// 実行時は単一のプラグイン『plugin_system』として振る舞う
Object.assign(PluginSystem, PluginSystemDebug)
Object.assign(PluginSystem, PluginSystemMath)
Object.assign(PluginSystem, PluginSystemString)
Object.assign(PluginSystem, PluginSystemArray)
Object.assign(PluginSystem, PluginSystemDatetime)
Object.assign(PluginSystem, PluginSystemUrl)

export default PluginSystem
