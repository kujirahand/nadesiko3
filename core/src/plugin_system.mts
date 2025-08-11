/* eslint-disable @typescript-eslint/no-explicit-any */
import { NakoRuntimeError } from './nako_errors.mjs'
import { NakoSystem } from './plugin_api.mjs'

export default {
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
    fn: function (sys: NakoSystem) {
      // システム変数の初期化
      const system: any = sys
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
      sys.__findVar = function (nameStr: any, def: any): any {
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
      sys.__findFunc = function (nameStr: any, parentFunc: string): any {
        const f = sys.__findVar(nameStr)
        if (typeof f === 'function') { return f }
        throw new Error(`『${parentFunc}』に実行できない関数が指定されました。`)
      }
      // システム関数を実行
      sys.__exec = function (func: string, params: any[]): any {
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
        // eslint-disable-next-line no-eval
        const _eval = eval
        try {
          return _eval(src)
        } catch (e) {
          console.warn('[eval]', e)
          return null
        }
      }
      // eval function #1733 - 互換性を優先するため、direct evalを使うことに
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sys.__evalJS = (src: string, sys?: NakoSystem) => {
        try {
          // eslint-disable-next-line no-eval
          return eval(src)
        } catch (e) {
          console.warn('[eval]', e)
          return null
        }
      }
      // Propアクセス支援
      // eslint-disable-next-line @typescript-eslint/ban-types
      sys.__registPropAccessor = (f: Function, getProp: (prop: string|string[], sys: NakoSystem) => any, setProp: (prop: string|string[], value: object, sys: NakoSystem) => any) => {
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
    fn: function (sys: NakoSystem) {
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
    fn: function (): any {
      return []
    }
  },
  '空辞書': { // @空の辞書型を返す。『{}』と同義。 // @からじしょ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (): any {
      return {}
    }
  },
  '空ハッシュ': { // @空のハッシュを返す(v3.2以降非推奨) // @からはっしゅ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (): any {
      return {}
    }
  },
  '空オブジェクト': { // @空のオブジェクトを返す(v3.2以降非推奨) // @からおぶじぇくと
    type: 'func',
    josi: [],
    pure: false,
    fn: function (sys: NakoSystem): any {
      return sys.__exec('空ハッシュ', [sys])
    }
  },
  '真偽判定': { // @引数bが真(true)ならば「真」を偽(false)ならば「偽」を返す // @しんぎはんてい
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (b: any): string {
      return b ? '真' : '偽'
    }
  },

  // @標準出力
  '表示': { // @Sを表示 // @ひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s: string, sys: any) {
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
    fn: function (s: string, sys: any) {
      sys.__printPool += s
    },
    return_none: true
  },
  '連続表示': { // @引数に指定した引数を全て表示する // @れんぞくひょうじ
    type: 'func',
    josi: [['と', 'を']],
    isVariableJosi: true,
    pure: true,
    fn: function (...a: any) {
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
    fn: function (...a: any) {
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
    fn: function (sys: NakoSystem) {
      sys.__setSysVar('表示ログ', '')
    },
    return_none: true
  },
  '言': { // @Sを表示 // @いう
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s: string, sys: any) {
      sys.logger.send('stdout', s + '')
    },
    return_none: true
  },
  'コンソール表示': { // @Sをコンソール表示する(console.log) // @こんそーるひょうじ
    type: 'func',
    josi: [['を', 'と']],
    pure: true,
    fn: function (s: string) {
      console.log(s)
    },
    return_none: true
  },

  // @四則演算
  '足': { // @AとBを足す(算術演算を行う) // @たす
    type: 'func',
    josi: [['に', 'と'], ['を']],
    isVariableJosi: false,
    pure: true,
    fn: function (a: any, b: any) {
      if (typeof (a) === 'bigint' || typeof (b) === 'bigint') {
        return BigInt(a) + BigInt(b)
      }
      return parseFloat(a) + parseFloat(b)
    }
  },
  '合計': { // @引数(可変)に指定した値を全て合計して返す // @ごうけい
    type: 'func',
    josi: [['と', 'を', 'の']],
    isVariableJosi: true,
    pure: true,
    fn: function (...a: any) {
      const sys = a.pop() // remove NakoSystem
      if (a.length >= 1 && a[0] instanceof Array) {
        return sys.__exec('配列合計', [a[0], sys])
      }
      let isBigInt = false
      let sum = 0
      for (const v of a) {
        if (typeof (v) === 'bigint') {
          isBigInt = true
          break
        }
        sum += parseFloat(v)
      }
      if (isBigInt) {
        let bigsum = 0n
        for (const v of a) {
          bigsum += BigInt(v)
        }
        return bigsum
      }
      return sum
    }
  },
  '引': { // @AからBを引く // @ひく
    type: 'func',
    josi: [['から'], ['を']],
    pure: true,
    fn: function (a: any, b: any) {
      return a - b
    }
  },
  '掛': { // @AにBを掛ける // @かける
    type: 'func',
    josi: [['に', 'と'], ['を']],
    pure: true,
    fn: function (a: any, b: any) {
      // 数値の掛け算
      if (typeof a === 'number') {
        return a * b
      }
      // 文字列の掛け算(文字列の繰り返し)
      if (typeof a === 'string') {
        let s = ''
        for (let i = 0; i < parseInt(b); i++) {
          s += a
        }
        return s
      }
      // 配列の繰り返し
      if (a instanceof Array) {
        const aa: any[] = []
        for (let i = 0; i < parseInt(b); i++) {
          aa.push(...a)
        }
        return aa
      }
      return a * b
    }
  },
  '倍': { // @AのB倍を求める // @ばい
    type: 'func',
    josi: [['の', 'を'], ['']],
    pure: true,
    fn: function (a: any, b: any) {
      return a * b
    }
  },
  '割': { // @AをBで割る // @わる
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a: any, b: any) {
      return a / b
    }
  },
  '割余': { // @AをBで割った余りを求める // @わったあまり
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a: any, b: any) {
      return a % b
    }
  },
  '偶数': { // @Aが偶数なら真を返す // @ぐうすう
    type: 'func',
    josi: [['が']],
    pure: true,
    fn: function (a: any) {
      return (parseInt(a) % 2 === 0)
    }
  },
  '奇数': { // @Aが奇数なら真を返す // @きすう
    type: 'func',
    josi: [['が']],
    pure: true,
    fn: function (a: any) {
      return (parseInt(a) % 2 === 1)
    }
  },
  '二乗': { // @Aを二乗する // @にじょう
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any) {
      return a * a
    }
  },
  'べき乗': { // @AのB乗を求める // @べきじょう
    type: 'func',
    josi: [['の'], ['の']],
    pure: true,
    fn: function (a: any, b: any) {
      return Math.pow(a, b)
    }
  },
  '以上': { // @AがB以上か // @いじょう
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a: any, b: any) {
      return a >= b
    }
  },
  '以下': { // @AがB以下か // @いか
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a: any, b: any) {
      return a <= b
    }
  },
  '未満': { // @AがB未満か // @みまん
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a: any, b: any) {
      return a < b
    }
  },
  '超': { // @AがB超か // @ちょう
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function (a: any, b: any) {
      return a > b
    }
  },
  '等': { // @AがBと等しいか // @ひとしい
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a: any, b: any) {
      return a === b
    }
  },
  '等無': { // @AがBと等しくないか // @ひとしくない
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a: any, b: any) {
      return a !== b
    }
  },
  '一致': { // @AがBと一致するか(配列や辞書も比較可能) // @いっち
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a: any, b: any) {
      // オブジェクトの場合、JSONに変換して比較
      if (typeof (a) === 'object') {
        const jsonA = JSON.stringify(a)
        const jsonB = JSON.stringify(b)
        return jsonA === jsonB
      }
      return a === b
    }
  },
  '不一致': { // @AがBと不一致か(配列や辞書も比較可能) // @ふいっち
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function (a: any, b: any) {
      // オブジェクトの場合、JSONに変換して比較
      if (typeof (a) === 'object') {
        const jsonA = JSON.stringify(a)
        const jsonB = JSON.stringify(b)
        return jsonA !== jsonB
      }
      return a !== b
    }
  },
  '範囲内': { // @VがAからBの範囲内か // @はんいない
    type: 'func',
    josi: [['が'], ['から'], ['の', 'までの']],
    pure: true,
    fn: function (v: any, a: any, b: any) {
      return (a <= v) && (v <= b)
    }
  },
  '範囲': { // @AからBの範囲を表現する範囲オブジェクトを返す // @はんい
    type: 'func',
    josi: [['から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any) {
      return {
        '先頭': a,
        '末尾': b
      }
    }
  },
  '連続加算': { // @A1+A2+A3...にBを足す // @れんぞくかさん
    type: 'func',
    josi: [['を'], ['に', 'と']],
    isVariableJosi: true,
    pure: true,
    fn: function (b: any, ...a: any) {
      a.pop() // 必ず末尾に sys があるので、末尾のシステム変数を除外
      a.push(b)
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      return a.reduce((p: any, c: any) => p + c)
    }
  },
  'MAX': { // @2個以上の数値のうち最大値を返す。// @MAX
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function (b: number, ...a: any): number {
      const sys = a.pop()
      return sys.__exec('最大値', [b, ...a, sys])
    }
  },
  '最大値': { // @2個以上の数値のうち最大値を返す。// @さいだいち
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function (b: number, ...a: any): number {
      a.pop() // 必ず末尾に sys があるので、末尾のシステム変数を除外
      a.push(b)
      return a.reduce((p: number, c: number) => Math.max(p, c))
    }
  },
  'MIN': { // @2個以上の数値のうち最小値を返す。// @MIN
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function (b: number, ...a: any): number {
      const sys = a.pop()
      return sys.__exec('最小値', [b, ...a, sys])
    }
  },
  '最小値': { // @2個以上の数値のうち最小値を返す。// @さいしょうち
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function (b: number, ...a: any): number {
      a.pop() // 必ず末尾に sys があるので、末尾のシステム変数を除外
      a.push(b)
      return a.reduce((p: number, c: number) => Math.min(p, c))
    }
  },
  'CLAMP': { // @数値を下限から上限の範囲内に収めた値を返す。// @CLAMP
    type: 'func',
    josi: [['の', 'を'], ['から'], ['までの', 'で']],
    pure: true,
    fn: function (x: number, a: number, b: number): number {
      return Math.min(Math.max(x, a), b)
    }
  },

  // @敬語
  'ください': { // @敬語対応のため // @ください
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  'お願': { // @ソースコードを読む人を気持ちよくする // @おねがいします
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  'です': { // @ソースコードを読む人を気持ちよくする // @です
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      sys.__reisetu++
    },
    return_none: true
  },
  '拝啓': { // @ソースコードを読む人を気持ちよくする // @はいけい
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      sys.__reisetu = 0
    },
    return_none: true
  },
  '敬具': { // @ソースコードを読む人を気持ちよくする // @けいぐ
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      sys.__reisetu += 100 // bonus point
    },
    return_none: true
  },
  '礼節レベル取得': { // @(お遊び)敬語を何度使ったか返す // @れいせつれべるしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      if (!sys.__reisetu) { sys.__reisetu = 0 }
      return sys.__reisetu
    }
  },

  // @特殊命令
  'JS実行': { // @JavaScriptのコードSRCを実行する(変数sysでなでしこシステムを参照できる) // @JSじっこう
    type: 'func',
    josi: [['を', 'で']],
    pure: true,
    fn: function (src: string, sys: NakoSystem) {
      return sys.__evalJS(src, sys) // #1733
    }
  },
  'JSオブジェクト取得': { // @なでしこで定義した関数や変数nameのJavaScriptオブジェクトを取得する // @JSおぶじぇくとしゅとく
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (name: string, sys: any) {
      return sys.__findVar(name, null)
    }
  },
  'JS関数実行': { // @JavaScriptの関数NAMEを引数ARGS(配列)で実行する // @JSかんすうじっこう
    type: 'func',
    josi: [['を'], ['で']],
    fn: function (name: any, args: any, sys: NakoSystem) {
      // nameが文字列ならevalして関数を得る
      // eslint-disable-next-line no-eval
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
    fn: async function () {
      // empty
    },
    return_none: true
  },
  'AWAIT実行': { // @JavaScriptの非同期関数(Promise/async関数)のFを引数ARGSでawait実行する // @JSかんすうAWAIT
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    asyncFn: true,
    fn: async function (f: any, args: any, sys: any) {
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
    fn: function (obj: any, m: any, args: any, sys: NakoSystem) {
      // objが文字列ならevalして関数を得る
      // eslint-disable-next-line no-eval
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
    fn: function (code: string, sys: any) {
      sys.__setSysVar('表示ログ', '')
      sys.__self.runEx(code, sys.__modName, { resetEnv: false, resetLog: true })
      const outLog = String(sys.__getSysVar('表示ログ'))
      if (outLog) {
        sys.logger.trace(outLog)
      }
      return outLog
    }
  },
  'ナデシコ続': { // @なでしこのコードCODEを実行する // @なでしこつづける
    type: 'func',
    josi: [['を', 'で']],
    fn: function (code: string, sys: any) {
      sys.__self.runEx(code, sys.__modName, { resetEnv: false, resetAll: false })
      const out = String(sys.__getSysVar('表示ログ'))
      if (out) {
        sys.logger.trace(out)
      }
      return out
    }
  },
  '実行': { // @ 無名関数（あるいは、文字列で関数名を指定）Fを実行する(Fが関数でなければ無視する) // @じっこう
    type: 'func',
    josi: [['を', 'に', 'で']],
    pure: false,
    fn: function (f: any, sys: any) {
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
    fn: function (f: any, sys: any) {
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
    fn: function (sys: NakoSystem) {
      // デバッグモードでなければ例外を投げることでプログラムを終了させる
      sys.__setSysVar('__forceClose', true)
      if (!sys.__getSysVar('__useDebug')) { throw new Error('__終わる__') }
    }
  },

  // @型変換
  '変数型確認': { // @変数Vの型を返す // @へんすうかたかくにん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any) {
      return (typeof v)
    }
  },
  'TYPEOF': { // @変数Vの型を返す // @TYPEOF
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any) {
      return (typeof v)
    }
  },
  '文字列変換': { // @値Vを文字列に変換 // @もじれつへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): string {
      return String(v)
    }
  },
  'TOSTR': { // @値Vを文字列に変換 // @TOSTR
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): string {
      return String(v)
    }
  },
  '整数変換': { // @値Vを整数に変換 // @せいすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): number {
      return parseInt(v)
    }
  },
  'TOINT': { // @値Vを整数に変換 // @TOINT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): number {
      return parseInt(v)
    }
  },
  '実数変換': { // @値Vを実数に変換 // @じっすうへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): number {
      return parseFloat(v)
    }
  },
  'TOFLOAT': { // @値Vを実数に変換 // @TOFLOAT
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): number {
      return parseFloat(v)
    }
  },
  'INT': { // @値Vを整数に変換 // @INT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any): number {
      return parseInt(v)
    }
  },
  'FLOAT': { // @値Vを実数に変換 // @FLOAT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any): number {
      return parseFloat(v)
    }
  },
  'NAN判定': { // @値VがNaNかどうかを判定(命令『非数判定』を使う事を推奨) // @NANはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): boolean {
      return isNaN(v)
    }
  },
  '非数判定': { // @値Vが非数かどうかを判定(NAN判定より堅牢) // @ひすうはんてい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v: any): boolean {
      // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
      return Number.isNaN(v)
    }
  },
  'HEX': { // @値Vを16進数に変換 // @HEX
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any): string {
      return parseInt(a).toString(16)
    }
  },
  '進数変換': { // @値VをN進数に変換 // @しんすうへんかん
    type: 'func',
    josi: [['を', 'の'], ['']],
    pure: true,
    fn: function (v: any, n: number): string {
      return parseInt(v).toString(n)
    }
  },
  '二進': { // @値Vを2進数に変換 // @にしん
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (v: any): string {
      return parseInt(v).toString(2)
    }
  },
  '二進表示': { // @値Vを2進数に変換して表示 // @にしんひょうじ
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (v: any, sys: any) {
      const s = parseInt(v).toString(2)
      sys.__exec('表示', [s, sys])
    }
  },
  'RGB': { // @HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255 // @RGB
    type: 'func',
    josi: [['と'], ['の'], ['で']],
    pure: true,
    fn: function (r: any, g: any, b: any): string {
      const z2 = (v: any): string => {
        const v2: string = '00' + (parseInt(String(v)).toString(16))
        return v2.substring(v2.length - 2, v2.length)
      }
      return '#' + z2(r) + z2(g) + z2(b)
    }
  },

  // @論理演算
  '論理OR': { // @AとBの論理和を返す(v1非互換)。 // @ろんりOR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a: any, b: any): any {
      return (a || b)
    }
  },
  '論理AND': { // @AとBの論理積を返す(v1非互換)。日本語の「AかつB」に相当する // @ろんりAND
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a: any, b: any): boolean {
      return (a && b)
    }
  },
  '論理NOT': { // @値Vが0や空ならばtrue、それ以外ならばfalseを返す(v1非互換) // @ろんりNOT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any): boolean {
      return (!v)
    }
  },

  // @ビット演算
  'OR': { // @(ビット演算で)AとBの論理和を返す。 // @OR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a: any, b: any): any {
      return (a | b)
    }
  },
  'AND': { // @(ビット演算で)AとBの論理積を返す。日本語の「AかつB」に相当する // @AND
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a: any, b: any): any {
      return (a & b)
    }
  },
  'XOR': { // @(ビット演算で)AとBの排他的論理和を返す。// @XOR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a: any, b: any): any {
      return (a ^ b)
    }
  },
  'NOT': { // @(ビット演算で)Vの各ビットを反転して返す。// @NOT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any): any {
      return (~v)
    }
  },
  'SHIFT_L': { // @VをAビット左へシフトして返す // @SHIFT_L
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v: number, a: number): number {
      return (v << a)
    }
  },
  'SHIFT_R': { // @VをAビット右へシフトして返す(符号を維持する) // @SHIFT_R
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v: number, a: number): number {
      return (v >> a)
    }
  },
  'SHIFT_UR': { // @VをAビット右へシフトして返す(符号を維持しない、0で埋める) // @SHIFT_UR
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v: number, a: number): number {
      return (v >>> a)
    }
  },

  // @文字列処理
  '文字数': { // @文字列Vの文字数を返す // @もじすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: any): number {
      if (!Array.from) { return String(v).length }
      // Unicodeのサロゲートペアを考慮して文字数をカウント #1954 を参照
      return Array.from(v).length
    }
  },
  '何文字目': { // @文字列SでAが何文字目にあるか調べて返す。見つからなければ0を返す。 // @なんもじめ
    type: 'func',
    josi: [['で', 'の'], ['が']],
    pure: true,
    fn: function (s: string, a: string): number {
      // Unicodeのサロゲートペアを考慮して、文字列を検索 #1954 を参照
      // return String(s).indexOf(a) + 1 // サロゲートペアを無視した場合
      const strArray = Array.from(s)
      const searchArray = Array.from(a)
      for (let i = 0; i < strArray.length; i++) {
        if (strArray.slice(i, i + searchArray.length).join('') === searchArray.join('')) {
          return i + 1
        }
      }
      return 0
    }
  },
  'CHR': { // @文字コードV(あるいは文字列配列)から文字を返す // @CHR
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: number|number[]): string|string[] {
      // 数値のとき
      if (typeof v === 'number') {
        if (!String.fromCodePoint) { return String.fromCharCode(v) }
        return String.fromCodePoint(v)
      }
      // 配列のとき
      const res: string[] = []
      for (const s of v) {
        if (!String.fromCodePoint) { res.push(String.fromCharCode(s)) }
        res.push(String.fromCodePoint(s))
      }
      return res
    }
  },
  'ASC': { // @文字列V(あるいは文字列配列)の最初の文字の文字コードを返す // @ASC
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v: string|string[]): number|number[] {
      if (typeof v === 'string') {
        if (!String.prototype.codePointAt) { return String(v).charCodeAt(0) }
        return String(v).codePointAt(0) || 0
      }
      const res: number[] = []
      for (const s of v) {
        if (!String.prototype.codePointAt) { res.push(String(s).charCodeAt(0)) }
        res.push(String(s).codePointAt(0) || 0)
      }
      return res
    }
  },
  '文字挿入': { // @文字列SのI文字目に文字列Aを挿入する // @もじそうにゅう
    type: 'func',
    josi: [['で', 'の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (s: string, i: number, a: string): string {
      if (i <= 0) { i = 1 }
      const strArray = Array.from(s)
      strArray.splice(i - 1, 0, a)
      return strArray.join('')
    }
  },
  '文字検索': { // @文字列SでA文字目から文字列Bを検索。見つからなければ0を返す。(類似命令に『何文字目』がある)(v1非互換) // @もじけんさく
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    pure: true,
    fn: function (s: string, a: number, b: string): number {
      // サロゲートペアを考慮して文字列を検索する
      // return String(s).indexOf(b, a - 1) + 1
      if (a <= 0) { a = 1 }
      const strArray = Array.from(s)
      const searchArray = Array.from(b)
      // Unicode単位で検索
      for (let i = a - 1; i < strArray.length; i++) {
        if (strArray.slice(i, i + searchArray.length).join('') === searchArray.join('')) {
          // 合致した
          return i + 1
        }
      }
      return 0
    }
  },
  '追加': { // @文字列または配列SにAを追加して返す(v1非互換) // @ついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    pure: true,
    fn: function (s: any, a: any): any {
      if (s instanceof Array) {
        s.push(a)
        return s
      }
      return String(s) + String(a)
    }
  },
  '一行追加': { // @文字列または配列SにAと改行を追加して返す(v1非互換) // @いちぎょうついか
    type: 'func',
    josi: [['で', 'に', 'へ'], ['を']],
    pure: true,
    fn: function (s: any, a: any): any {
      if (s instanceof Array) {
        s.push(a)
        return s
      }
      return String(s) + String(a) + '\n'
    }
  },
  '連結': { // @引数(可変)に指定した文字列を連結して文字列を返す // @れんけつ
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    isVariableJosi: true,
    fn: function (...a: any) {
      a.pop() // NakoSystemを取り除く
      return a.join('')
    }
  },
  '文字列連結': { // @引数(可変)に指定した文字列を連結して文字列を返す // @もじれつれんけつ
    type: 'func',
    josi: [['と', 'を']],
    pure: true,
    isVariableJosi: true,
    fn: function (...a: any) {
      a.pop() // NakoSystemを取り除く
      return a.join('')
    }
  },
  '文字列分解': { // @文字列Vを一文字ずつに分解して返す // @もじれつぶんかい
    type: 'func',
    josi: [['を', 'の', 'で']],
    pure: true,
    fn: function (v: any) {
      if (!Array.from) { return String(v).split('') }
      return Array.from(v)
    }
  },
  'リフレイン': { // @文字列VをCNT回繰り返す(v1非互換) // @りふれいん
    type: 'func',
    josi: [['を', 'の'], ['で']],
    pure: true,
    fn: function (v: any, cnt: number): string {
      let s = ''
      for (let i = 0; i < cnt; i++) { s += String(v) }
      return s
    }
  },
  '出現回数': { // @文字列SにAが何回出現するか数える // @しゅつげんかいすう
    type: 'func',
    josi: [['で'], ['の']],
    pure: true,
    fn: function (s: string, a: string) {
      s = '' + s
      a = '' + a
      return s.split(a).length - 1
    }
  },
  'MID': { // @文字列SのA文字目からCNT文字を抽出する(『文字抜出』と同じ) // @MID
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を']],
    pure: true,
    fn: function (s: any, a: any, cnt: number, sys: NakoSystem) {
      return sys.__exec('文字抜出', [s, a, cnt])
    }
  },
  '文字抜出': { // @文字列SのA文字目からCNT文字を抽出する(Aが0未満の時は後ろからA文字目からCNT文字を抽出) // @もじぬきだす
    type: 'func',
    josi: [['で', 'の'], ['から'], ['を', '']],
    pure: true,
    fn: function (s: any, a: number, cnt: number) {
      // 引数の型チェック #1995
      if (typeof a === 'string') { a = parseInt(a) }
      if (typeof cnt === 'string') { cnt = parseInt(cnt) }
      // もし、cntが0以下なら空文字を返す
      if (cnt <= 0) { return '' }
      // サロゲートペアを考慮した処理を行う
      const strArray = Array.from(s)
      // もし、aの値が0未満の時は後ろからa文字目からcnt文字を抽出
      if (a < 0) {
        a = strArray.length + a + 1
        if (a < 0) { a = 1 }
      }
      return strArray.slice(a - 1, a + cnt - 1).join('')
    }
  },
  'LEFT': { // @文字列Sの左端からCNT文字を抽出する // @LEFT
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    pure: true,
    fn: function (s: string, cnt: number, sys: NakoSystem): string {
      return sys.__exec('文字左部分', [s, cnt])
    }
  },
  '文字左部分': { // @文字列Sの左端からCNT文字を抽出する // @もじひだりぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    pure: true,
    fn: function (s: string, cnt: number): string {
      // return (String(s).substring(0, cnt))
      // サロゲートペアを考慮
      const strArray = Array.from(s)
      return strArray.slice(0, cnt).join('')
    }
  },
  'RIGHT': { // @文字列Sの右端からCNT文字を抽出する(『文字右部分』と同じ) // @RIGHT
    type: 'func',
    josi: [['の', 'で'], ['だけ']],
    pure: true,
    fn: function (s: string, cnt: number, sys: NakoSystem): string {
      return sys.__exec('文字右部分', [s, cnt])
    }
  },
  '文字右部分': { // @文字列Sの右端からCNT文字を抽出する // @もじみぎぶぶん
    type: 'func',
    josi: [['の', 'で'], ['だけ', '']],
    pure: true,
    fn: function (s: string, cnt: number): string {
      // return (s.substring(s.length - cnt, s.length))
      // サロゲートペアを考慮
      const strArray = Array.from(s)
      let index = strArray.length - cnt
      if (index < 0) { index = 0 }
      return strArray.slice(index, strArray.length).join('')
    }
  },
  '区切': { // @文字列Sを区切り文字Aで区切って配列で返す // @くぎる
    type: 'func',
    josi: [['の', 'を'], ['で']],
    pure: true,
    fn: function (s: string, a: string) {
      return ('' + s).split('' + a)
    }
  },
  '文字列分割': { // @文字列Sを区切り文字Aで分割して配列で返す // @もじれつぶんかつ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (s: string, a: string) {
      s = '' + s
      a = '' + a
      const i = s.indexOf(a)
      if (i < 0) {
        return [s]
      }
      return [s.substring(0, i), s.substring(i + a.length)]
    }
  },
  '切取': { // @文字列Sから文字列Aまでの部分を抽出する。切り取った残りは特殊変数『対象』に代入される。(v1非互換) // @きりとる
    type: 'func',
    josi: [['から', 'の'], ['まで', 'を']],
    pure: true,
    fn: function (s: string, a: string, sys: any) {
      s = String(s)
      const i = s.indexOf(a)
      if (i < 0) {
        sys.__setSysVar('対象', '')
        return s
      }
      sys.__setSysVar('対象', s.substring(i + a.length))
      return s.substring(0, i)
    }
  },
  '範囲切取': { // @文字列Sで文字列AからBまでの部分を抽出して返す。切り取った残りは特殊変数『対象』に代入される。(v1非互換) // @はんいきりとる
    type: 'func',
    josi: [['で', 'の'], ['から'], ['まで', 'を']],
    pure: true,
    fn: function (s: string, a: string, b: string, sys: any) {
      s = String(s)
      let mae = ''
      let usiro = ''
      const i = s.indexOf(a)
      if (i < 0) {
        sys.__setSysVar('対象', s)
        return ''
      }
      mae = s.substring(0, i)
      const subS = s.substring(i + a.length)
      const j = subS.indexOf(b)
      if (j < 0) {
        sys.__setSysVar('対象', mae)
        return subS
      }
      const result = subS.substring(0, j)
      usiro = subS.substring(j + b.length)
      sys.__setSysVar('対象', mae + usiro)
      return result
    }
  },
  '文字削除': { // @文字列SのA文字目からB文字分を削除して返す // @もじさくじょ
    type: 'func',
    josi: [['の'], ['から'], ['だけ', 'を', '']],
    pure: true,
    fn: function (s: string, a: number, b: number): string {
      // サロゲートペアを考慮
      const strArray = Array.from(s)
      strArray.splice(a - 1, b)
      return strArray.join('')
    }
  },
  '文字始': { // @文字列SがAから始まるならば真を返す // @もじはじまる
    type: 'func',
    josi: [['が'], ['で', 'から']],
    pure: true,
    fn: function (s: string, a: string): boolean {
      return s.startsWith(a)
    }
  },
  '文字終': { // @文字列SがAで終わるならば真を返す // @もじおわる
    type: 'func',
    josi: [['が'], ['で']],
    pure: true,
    fn: function (s: string, a: string): boolean {
      return s.endsWith(a)
    }
  },

  // @置換・トリム
  '置換': { // @文字列Sのうち文字列AをBに全部置換して返す // @ちかん
    type: 'func',
    josi: [['の', 'で'], ['を', 'から'], ['に', 'へ']],
    pure: true,
    fn: function (s: string, a: string, b: string) {
      return String(s).split(a).join(b)
    }
  },
  '単置換': { // @文字列Sのうち、最初に出現するAだけをBに置換して返す // @たんちかん
    type: 'func',
    josi: [['の', 'で'], ['を'], ['に', 'へ']],
    pure: true,
    fn: function (s: string, a: string, b: string) {
      // replaceは最初の一度だけ置換する
      return String(s).replace(a, b)
    }
  },
  'トリム': { // @文字列Sの前後にある空白を削除する // @とりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/^\s+/, '').replace(/\s+$/, '')
    }
  },
  '空白除去': { // @文字列Sの前後にある空白を削除する // @くうはくじょきょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/^\s+/, '').replace(/\s+$/, '')
    }
  },
  '右トリム': { // @文字列Sの末尾にある空白を削除する // @みぎとりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/\s+$/, '')
    }
  },
  '左トリム': { // @文字列Sの先頭にある空白を削除する // @ひだりとりむ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/^\s+/, '')
    }
  },
  '末尾空白除去': { // @文字列Sの末尾にある空白を削除する // @まつびくうはくじょきょ
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/\s+$/, '')
    }
  },

  // @文字変換
  '大文字変換': { // @アルファベットの文字列Sを大文字に変換 // @おおもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).toUpperCase()
    }
  },
  '小文字変換': { // @アルファベットの文字列Sを小文字に変換 // @こもじへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).toLowerCase()
    }
  },
  '平仮名変換': { // @文字列Sのカタカナをひらがなに変換 // @ひらがなへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      const kanaToHira = (str: string) => {
        return String(str).replace(/[\u30a1-\u30f6]/g, function (m: string) {
          const chr = m.charCodeAt(0) - 0x60
          return String.fromCharCode(chr)
        })
      }
      return kanaToHira('' + s)
    }
  },
  'カタカナ変換': { // @文字列Sのひらがなをカタカナに変換 // @かたかなへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      const hiraToKana = (str: string) => {
        return String(str).replace(/[\u3041-\u3096]/g, function (m: string) {
          const chr = m.charCodeAt(0) + 0x60
          return String.fromCharCode(chr)
        })
      }
      return hiraToKana('' + s)
    }
  },
  '英数全角変換': { // @文字列Sの半角英数文字を全角に変換 // @えいすうぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/[A-Za-z0-9]/g, function (v: string) {
        return String.fromCharCode(v.charCodeAt(0) + 0xFEE0)
      })
    }
  },
  '英数半角変換': { // @文字列Sの全角英数文字を半角に変換 // @えいすうはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (v: string) {
        return String.fromCharCode(v.charCodeAt(0) - 0xFEE0)
      })
    }
  },
  '英数記号全角変換': { // @文字列Sの半角英数記号文字を全角に変換 // @えいすうきごうぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/[\x20-\x7E]/g, function (v: string) {
        if (v === ' ') { return '　' } // 半角スペース(0x20)を全角スペース(U+3000)に
        return String.fromCharCode(v.charCodeAt(0) + 0xFEE0)
      })
    }
  },
  '英数記号半角変換': { // @文字列Sの記号文字を半角に変換 // @えいすうきごうはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string): string {
      return String(s).replace(/[\u3000\uFF00-\uFF5F]/g, function (v: string) {
        if (v === '　') { return ' ' } // 全角スペース(U+3000)を半角スペース(U+0020)
        return String.fromCharCode(v.charCodeAt(0) - 0xFEE0)
      })
    }
  },
  'カタカナ全角変換': { // @文字列Sの半角カタカナを全角に変換 // @かたかなぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string, sys: any) {
      // 半角カタカナ
      const zen1 = sys.__getSysVar('全角カナ一覧')
      const han1 = sys.__getSysVar('半角カナ一覧')
      const zen2 = sys.__getSysVar('全角カナ濁音一覧')
      const han2 = sys.__getSysVar('半角カナ濁音一覧')
      let str = ''
      let i = 0
      while (i < s.length) {
        // 濁点の変換
        const c2 = s.substring(i, i + 2)
        const n2 = han2.indexOf(c2)
        if (n2 >= 0) {
          str += zen2.charAt(n2 / 2)
          i += 2
          continue
        }
        // 濁点以外の変換
        const c = s.charAt(i)
        const n = han1.indexOf(c)
        if (n >= 0) {
          str += zen1.charAt(n)
          i++
          continue
        }
        str += c
        i++
      }
      return str
    }
  },
  'カタカナ半角変換': { // @文字列Sの全角カタカナを半角に変換 // @かたかなはんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (s: string, sys: any) {
      // 半角カタカナ
      const zen1 = sys.__getSysVar('全角カナ一覧')
      const han1 = sys.__getSysVar('半角カナ一覧')
      const zen2 = sys.__getSysVar('全角カナ濁音一覧')
      const han2 = sys.__getSysVar('半角カナ濁音一覧')
      return s.split('').map((c) => {
        const i = zen1.indexOf(c)
        if (i >= 0) {
          return han1.charAt(i)
        }
        const j = zen2.indexOf(c)
        if (j >= 0) {
          return han2.substring(j * 2, j * 2 + 2)
        }
        return c
      }).join('')
    }
  },
  '全角変換': { // @文字列Sの半角文字を全角に変換 // @ぜんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (s: string, sys: any) {
      let result = s
      result = sys.__exec('カタカナ全角変換', [result, sys])
      result = sys.__exec('英数記号全角変換', [result, sys])
      return result
    }
  },
  '半角変換': { // @文字列Sの全角文字を半角に変換 // @はんかくへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: false,
    fn: function (s: string, sys: any) {
      let result = s
      result = sys.__exec('カタカナ半角変換', [result, sys])
      result = sys.__exec('英数記号半角変換', [result, sys])
      return result
    }
  },
  '全角カナ一覧': { type: 'const', value: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッ、。ー「」' }, // @ぜんかくかないちらん
  '全角カナ濁音一覧': { type: 'const', value: 'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ' }, // @ぜんかくかなだくおんいちらん
  '半角カナ一覧': { type: 'const', value: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯ､｡ｰ｢｣ﾞﾟ' }, // @はんかくかないちらん
  '半角カナ濁音一覧': { type: 'const', value: 'ｶﾞｷﾞｸﾞｹﾞｺﾞｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ' }, // @はんかくかなだくおんいちらん

  // @JSON
  'JSONエンコード': { // @オブジェクトVをJSON形式にエンコードして返す // @JSONえんこーど
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v: any) {
      return JSON.stringify(v)
    }
  },
  'JSONエンコード整形': { // @オブジェクトVをJSON形式にエンコードして整形して返す // @JSONえんこーどせいけい
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v: any) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSONデコード': { // @JSON文字列Sをオブジェクトにデコードして返す // @JSONでこーど
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (s: string): string {
      return JSON.parse(s)
    }
  },
  'JSON_E': { // @オブジェクトVをJSON形式にエンコードして返す(JSONエンコードと同じ) // @JSON_E
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v: any) {
      return JSON.stringify(v)
    }
  },
  'JSON_ES': { // @オブジェクトVをJSON形式にエンコードして整形して返す(JSONエンコード整形と同じ) // @JSON_ES
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v: any) {
      return JSON.stringify(v, null, 2)
    }
  },
  'JSON_D': { // @JSON文字列Sをオブジェクトにデコードして返す(JSONデコードと同じ) // @JSON_D
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (s: string): string {
      return JSON.parse(s)
    }
  },

  // @正規表現
  '正規表現マッチ': { // @文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは「/pat/opt」の形式で指定。optにgの指定がなければ部分マッチが『抽出文字列』に入る) // @せいきひょうげんまっち
    type: 'func',
    josi: [['を', 'が'], ['で', 'に']],
    pure: true,
    fn: function (a: string, b: string, sys: any): string {
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
  '抽出文字列': { type: 'const', value: [] }, // @ちゅうしゅつもじれつ
  '正規表現置換': { // @文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定) // @せいきひょうげんちかん
    type: 'func',
    josi: [['の'], ['を', 'から'], ['で', 'に', 'へ']],
    pure: true,
    fn: function (s: string, a: string, b: string): string {
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
    fn: function (s: any, a: any) {
      let re
      const f = a.match(/^\/(.+)\/([a-zA-Z]*)/)
      if (f === null) { re = new RegExp(a, 'g') } else { re = new RegExp(f[1], f[2]) }

      return String(s).split(re)
    }
  },

  // @指定形式
  '通貨形式': { // @数値Vを三桁ごとにカンマで区切る // @つうかけいしき
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v: any) {
      return String(v).replace(/(?<!\.\d*?)(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    }
  },
  'ゼロ埋': { // @数値VをA桁の0で埋める // @ぜろうめ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v: any, a: any): string {
      v = String(v)
      let z = '0'
      for (let i = 0; i < a; i++) { z += '0' }
      a = parseInt(a)
      if (a < v.length) { a = v.length }
      const s = z + String(v)
      return s.substring(s.length - a, s.length)
    }
  },
  '空白埋': { // @文字列VをA桁の空白で埋める // @くうはくうめ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (v: any, a: any): string {
      v = String(v)
      let z = ' '
      for (let i = 0; i < a; i++) { z += ' ' }
      a = parseInt(a)
      if (a < v.length) { a = v.length }
      const s = z + String(v)
      return s.substring(s.length - a, s.length)
    }
  },

  // @文字種類
  'かなか判定': { // @文字列Sの1文字目がひらがなか判定 // @かなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    pure: true,
    fn: function (s: any): boolean {
      const c = String(s).charCodeAt(0)
      return (c >= 0x3041 && c <= 0x309F)
    }
  },
  'カタカナ判定': { // @文字列Sの1文字目がカタカナか判定 // @かたかなかはんてい
    type: 'func',
    josi: [['を', 'の', 'が']],
    pure: true,
    fn: function (s: any): boolean {
      const c = String(s).charCodeAt(0)
      return (c >= 0x30A1 && c <= 0x30FA)
    }
  },
  '数字判定': { // @文字列Sの1文字目が数字か判定 // @すうじかはんてい
    type: 'func',
    josi: [['を', 'が']],
    pure: true,
    fn: function (s: any): boolean {
      const c = String(s).charAt(0)
      return ((c >= '0' && c <= '9') || (c >= '０' && c <= '９'))
    }
  },
  '数列判定': { // @文字列S全部が数字か判定 // @すうれつかはんてい
    type: 'func',
    josi: [['を', 'が']],
    pure: true,
    fn: function (s: any): boolean {
      const checkerRE = /^[+\-＋－]?([0-9０-９]*)(([.．][0-9０-９]+)?|([.．][0-9０-９]+[eEｅＥ][+\-＋－]?[0-9０-９]+)?)$/
      return String(s).match(checkerRE) !== null
    }
  },

  // @配列操作
  '配列結合': { // @配列Aを文字列Sでつなげて文字列で返す // @はいれつけつごう
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a: any, s: string): string {
      // 配列ならOK
      if (a instanceof Array) { return a.join('' + s) }

      const a2 = String(a).split('\n') // 配列でなければ無理矢理改行で区切ってみる
      return a2.join('' + s)
    }
  },
  '配列只結合': { // @配列Aの要素をただ結合して文字列で返す。(「」で配列結合と同じ) // @はいれつただけつごう
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (a: any): string {
      if (a instanceof Array) { return a.join('') }
      const a2 = String(a).split('\n') // 配列でなければ無理矢理改行で区切ってみる
      return a2.join('')
    }
  },
  '配列検索': { // @配列Aから文字列Sを探してインデックス番号(0起点)を返す。見つからなければ-1を返す。 // @はいれつけんさく
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a: any, s: any) {
      if (a instanceof Array) { return a.indexOf(s) }// 配列ならOK

      return -1
    }
  },
  '配列要素数': { // @配列Aの要素数を返す // @はいれつようそすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
      if (a instanceof Array) { return a.length }// 配列ならOK
      if (a instanceof Object) { return Object.keys(a).length } // オブジェクト
      if (typeof a === 'string') { return String(a).length } // 文字列
      return 1
    }
  },
  '要素数': { // @Aの要素数を返す。Aには配列/辞書型/文字列を指定する。 // @ようそすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any, sys: any) {
      return sys.__exec('配列要素数', [a])
    }
  },
  'LEN': { // @Aの要素数を返す。Aには配列/辞書型/文字列を指定する。 // @LEN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any, sys: any) {
      return sys.__exec('配列要素数', [a])
    }
  },
  '配列挿入': { // @配列AのI番目(0起点)に要素Sを追加して返す(v1非互換) // @はいれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (a: any, i: any, s: any) {
      if (a instanceof Array) { return a.splice(i, 0, s) } // 配列ならOK

      throw new Error('『配列挿入』で配列以外の要素への挿入。')
    }
  },
  '配列一括挿入': { // @配列AのI番目(0起点)に配列bを追加して返す(v1非互換) // @はいれついっかつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (a: any, i: number, b: any) {
      if (a instanceof Array && b instanceof Array) { // 配列ならOK
        for (let j = 0; j < b.length; j++) { a.splice(i + j, 0, b[j]) }

        return a
      }
      throw new Error('『配列一括挿入』で配列以外の要素への挿入。')
    }
  },
  '配列ソート': { // @配列Aをソートして返す(A自体を変更) // @はいれつそーと
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any) {
      if (a instanceof Array) { return a.sort() } // 配列ならOK

      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  '配列数値変換': { // @配列Aの各要素を数値に変換して返す(変数A自体を変更) // @はいれつすうちへんかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any) {
      // 配列ならOK
      if (a instanceof Array) {
        for (let i = 0; i < a.length; i++) {
          a[i] = parseFloat(a[i])
        }
        return a
      }
      throw new Error('『配列数値変換』で配列以外が指定されました。')
    }
  },
  '配列数値ソート': { // @配列Aをソートして返す(A自体を変更) // @はいれつすうちそーと
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any) {
      // 配列ならOK
      if (a instanceof Array) {
        return a.sort((a, b) => {
          return parseFloat(a) - parseFloat(b)
        })
      }

      throw new Error('『配列数値ソート』で配列以外が指定されました。')
    }
  },
  '配列カスタムソート': { // @関数Fで配列Aをソートして返す(引数A自体を変更) // @はいれつかすたむそーと
    type: 'func',
    josi: [['で'], ['の', 'を']],
    pure: false,
    fn: function (f: any, a: any, sys: any) {
      let ufunc = f
      if (typeof f === 'string') {
        ufunc = sys.__findFunc(f, '配列カスタムソート')
      }
      if (a instanceof Array) {
        return a.sort(ufunc)
      }
      throw new Error('『配列カスタムソート』で配列以外が指定されました。')
    }
  },
  '配列逆順': { // @配列Aを逆にして返す。Aを書き換える(A自体を変更)。 // @はいれつぎゃくじゅん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any) {
      if (a instanceof Array) { return a.reverse() } // 配列ならOK
      throw new Error('『配列ソート』で配列以外が指定されました。')
    }
  },
  '配列シャッフル': { // @配列Aをシャッフルして返す。Aを書き換える // @はいれつしゃっふる
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any) {
      if (a instanceof Array) { // 配列ならOK
        for (let i = a.length - 1; i > 0; i--) {
          const r = Math.floor(Math.random() * (i + 1))
          const tmp = a[i]
          a[i] = a[r]
          a[r] = tmp
        }
        return a
      }
      throw new Error('『配列シャッフル』で配列以外が指定されました。')
    }
  },
  '配列削除': { // @配列AのI番目(0起点)の要素を削除して返す。Aの内容を書き換える。辞書型変数ならキーIを削除する。 // @はいれつさくじょ
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a: any, i: any, sys: any) {
      return sys.__exec('配列切取', [a, i, sys])
    }
  },
  '配列切取': { // @配列AのI番目(0起点)の要素を切り取って返す。Aの内容を書き換える。引数Iには範囲オブジェクトを指定できる。その場合戻り値は配列型となる。辞書型変数ならキーIを削除する。 // @はいれつきりとる
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a: any, i: any) {
      // 配列変数のとき
      if (a instanceof Array) {
        if (typeof i === 'number') {
          const b = a.splice(i, 1)
          if (b instanceof Array) { return b[0] } // 切り取った戻り値は必ずArrayになるので。
        }
        if (typeof i === 'object' && typeof i['先頭'] === 'number') {
          const idx = i['先頭']
          const cnt = i['末尾'] - i['先頭'] + 1
          return a.splice(idx, cnt)
        }
        return null
      }
      // 辞書型変数のとき
      if (a instanceof Object && typeof (i) === 'string') { // 辞書型変数も許容
        if (a[i]) {
          const old = a[i]
          delete a[i]
          return old
        }
        return undefined
      }
      throw new Error('『配列切取』で配列以外を指定。')
    }
  },
  '配列取出': { // @配列AのI番目(0起点)からCNT個の要素を取り出して返す。Aの内容を書き換える // @はいれつとりだし
    type: 'func',
    josi: [['の'], ['から'], ['を']],
    pure: true,
    fn: function (a: any, i: any, cnt: any) {
      if (a instanceof Array) { return a.splice(i, cnt) }
      throw new Error('『配列取出』で配列以外を指定。')
    }
  },
  '配列ポップ': { // @配列Aの末尾を取り出して返す。Aの内容を書き換える。 // @はいれつぽっぷ
    type: 'func',
    josi: [['の', 'から']],
    pure: true,
    fn: function (a: any) {
      if (a instanceof Array) { return a.pop() }
      throw new Error('『配列ポップ』で配列以外の処理。')
    }
  },
  '配列プッシュ': { // @配列Aの末尾にNを追加。Aの内容を書き換える。(『配列追加』と同じ) // @はいれつぷっしゅ
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      return sys.__exec('配列追加', [a, b, sys])
    }
  },
  '配列追加': { // @配列Aの末尾にBを追加して返す。Aの内容を書き換える。 // @はいれつついか
    type: 'func',
    josi: [['に', 'へ'], ['を']],
    pure: true,
    fn: function (a: any, b: any) {
      if (a instanceof Array) { // 配列ならOK
        a.push(b)
        return a
      }
      throw new Error('『配列追加』で配列以外の処理。')
    }
  },
  '配列複製': { // @配列Aを複製して返す。 // @はいれつふくせい
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (a: any) {
      return JSON.parse(JSON.stringify(a))
    }
  },
  '配列範囲コピー': { // @配列Aの範囲I(数値化範囲オブジェクト)を複製して返す。 // @はいれつはんいこぴー
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a: any, i: any) {
      if (!Array.isArray(a)) {
        throw new Error('『配列範囲コピー』で配列以外の値が指定されました。')
      }
      if (typeof i === 'number') {
        if (typeof a[i] === 'object') {
          return JSON.parse(JSON.stringify(a[i]))
        }
        return a[i]
      }
      // 範囲オブジェクトのとき
      if (typeof i === 'object' && typeof i['先頭'] === 'number') {
        const start = i['先頭']
        const last = Number(i['末尾']) + 1
        return JSON.parse(JSON.stringify(a.slice(start, last)))
      }
      return undefined
    }
  },
  '参照': { // @値A(配列/文字列/辞書型)の範囲I(キーまたは範囲オブジェクト)を参照して(コピーせず)返す // @さんしょう
    type: 'func',
    josi: [['から', 'の'], ['を']],
    pure: true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fn: function (a: any, i: any, sys: any) {
      // 文字列のとき
      if (typeof a === 'string') {
        if (typeof i === 'number') {
          return a.charAt(i)
        }
        // 範囲オブジェクトのとき
        if (typeof i === 'object' && typeof i['先頭'] === 'number') {
          const start = i['先頭']
          const last = Number(i['末尾']) + 1
          return a.substring(start, last)
        }
        throw new Error(`『参照』で文字列型の範囲指定(${JSON.stringify(i)})が不正です。`)
      }
      // 配列型のとき
      if (Array.isArray(a)) {
        if (typeof i === 'number') {
          return a[i]
        }
        // 範囲オブジェクトのとき
        if (typeof i === 'object' && typeof i['先頭'] === 'number') {
          const start = i['先頭']
          const last = Number(i['末尾']) + 1
          return a.slice(start, last)
        }
      }
      // 辞書型のとき
      if (typeof a === 'object') {
        return a[i]
      }
      throw new Error('『参照』で文字列/配列/辞書型以外の値が指定されました。')
    }
  },
  '配列参照': { // @値A(配列/文字列/辞書型)の範囲I(キーまたは範囲オブジェクト)を参照して(コピーせず)返す(『参照』と同じ) // @はいれつはんいさんしょう
    type: 'func',
    josi: [['の', 'から'], ['を']],
    pure: true,
    fn: function (a: any, i: any, sys: any) {
      return sys.__exec('参照', [a, i, sys])
    }
  },
  '配列足': { // @配列Aに配列Bを足し合わせて返す。 // @はいれつたす
    type: 'func',
    josi: [['に', 'へ', 'と'], ['を']],
    pure: true,
    fn: function (a: any, b: any) {
      if (a instanceof Array) {
        return a.concat(b)
      }
      return JSON.parse(JSON.stringify(a))
    }
  },
  '配列最大値': { // @配列Aの値の最大値を調べて返す。 // @はいれつさいだいち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
      return a.reduce((x: any, y: any) => Math.max(x, y))
    }
  },
  '配列最小値': { // @配列Aの値の最小値を調べて返す。 // @はいれつさいしょうち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
      return a.reduce((x: any, y: any) => Math.min(x, y))
    }
  },
  '配列合計': { // @配列Aの値を全て足して返す。配列の各要素を数値に変換して計算する。数値に変換できない文字列は0になる。 // @はいれつごうけい
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
      if (a instanceof Array) {
        let v = 0
        a.forEach((n) => {
          const nn = parseFloat(n)
          if (isNaN(nn)) { return }
          v += nn
        })
        return v
      }
      throw new Error('『配列合計』で配列変数以外の値が指定されました。')
    }
  },
  '配列入替': { // @配列Aの(0から数えて)I番目とJ番目の要素を入れ替えて返す。Aの内容を書き換える。// @はいれついれかえ
    type: 'func',
    josi: [['の'], ['と'], ['を']],
    pure: true,
    fn: function (a: any, i: number, j: number) {
      if (!(a instanceof Array)) {
        throw new Error('『配列入替』の第1引数には配列を指定してください。')
      }
      const tmp = a[i]
      a[i] = a[j]
      a[j] = tmp
      return a
    }
  },
  '配列連番作成': { // @AからBまでの連番配列を生成して返す。 // @はいれつれんばんさくせい
    type: 'func',
    josi: [['から'], ['までの', 'まで', 'の']],
    pure: true,
    fn: function (a: number, b: number) {
      const result: number[] = []
      for (let i = a; i <= b; i++) {
        result.push(i)
      }
      return result
    }
  },
  '配列要素作成': { // @値AをB個持つ配列を生成して返す。引数Bに配列を指定すると二次元以上の配列を生成する。// @はいれつようそさくせい
    type: 'func',
    josi: [['を'], ['だけ', 'で']],
    pure: true,
    fn: function (a: any, b: number | number[]) {
      // value が配列やオブジェクトでも深くコピーするヘルパー
      const cloneValue = (v: any): any => {
        if (Array.isArray(v)) {
          return (v).map(item => cloneValue(item)) as any
        }
        if (v instanceof Date) {
          return new Date(v.getTime())
        }
        if (typeof v === 'object' && v !== null) {
          return JSON.parse(JSON.stringify(v))
        }
        return v
      }
      // 再帰的に配列を生成する関数
      const full = function (value: any, shape: number | number[]): any {
        // 1次元：shape が数値
        if (!Array.isArray(shape)) {
          return Array.from({ length: shape }, () => cloneValue(value))
        }
        // 1次元：shape が数値
        if (Array.isArray(shape) && shape.length === 1) {
          return Array.from({ length: shape[0] }, () => cloneValue(value))
        }
        // 多次元：shape が配列
        const [first, ...rest] = shape
        return Array.from(
          { length: first },
          () => full(cloneValue(value), rest)
        )
      }
      return full(a, b)
    }
  },
  '配列関数適用': { // @引数を1つ持つ関数Fを、配列Aの全要素に適用した、新しい配列を返す。 // @はいれつかんすうてきよう
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    fn: function (f: any, a: any, sys: any) {
      let ufunc: any = f
      if (typeof f === 'string') { ufunc = sys.__findFunc(f, '配列関数適用') }
      const result: any = []
      for (const e of a) {
        result.push(ufunc(e))
      }
      return result
    }
  },
  '配列マップ': { // @引数を1つ持つ関数Fを、配列Aの全要素に適用した、新しい配列を返す。(『配列関数適用』と同じ) // @はいれつまっぷ
    type: 'func',
    josi: [['を'], ['へ', 'に']],
    pure: true,
    fn: function (f: any, a: any, sys: any) {
      return sys.__exec('配列関数適用', [f, a, sys])
    }
  },
  '配列フィルタ': { // @引数を1つ持ち真偽を返す関数Fを利用して、配列Aの要素をフィルタして、新しい配列として返す。 // @はいれつふぃるた
    type: 'func',
    josi: [['で', 'の'], ['を', 'について']],
    pure: true,
    fn: function (f: any, a: any, sys: any) {
      let ufunc: any = f
      if (typeof f === 'string') { ufunc = sys.__findFunc(f, '配列フィルタ') }
      const result: any = []
      for (const e of a) {
        if (ufunc(e)) { result.push(e) }
      }
      return result
    }
  },
  // @二次元配列処理
  '表ソート': { // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに文字列順にソートする。Aの内容を書き換える。 // @ひょうそーと
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a: any, no: any) {
      if (!(a instanceof Array)) {
        throw new Error('『表ソート』には配列を指定する必要があります。')
      }
      a.sort((n, m) => {
        const ns = n[no]
        const ms = m[no]

        if (ns === ms) {
          return 0
        } else if (ns < ms) {
          return -1
        } else {
          return 1
        }
      })
      return a
    }
  },
  '表数値ソート': { // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに数値順にソートする。Aの内容を書き換える。 // @ひょうすうちそーと
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a: any, no: number) {
      if (!(a instanceof Array)) {
        throw new Error('『表数値ソート』には配列を指定する必要があります。')
      }
      a.sort((n, m) => {
        const ns = n[no]
        const ms = m[no]
        return ns - ms
      })
      return a
    }
  },
  '表ピックアップ': { // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sを含む行を返す // @ひょうぴっくあっぷ
    type: 'func',
    josi: [['の'], ['から'], ['を', 'で']],
    pure: true,
    fn: function (a: any, no: number, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表ピックアップ』には配列を指定する必要があります。') }
      return a.filter((row) => String(row[no]).indexOf(s) >= 0)
    }
  },
  '表完全一致ピックアップ': { // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sと一致する行を返す // @ひょうかんぜんいっちぴっくあっぷ
    type: 'func',
    josi: [['の'], ['から'], ['を', 'で']],
    pure: true,
    fn: function (a: any, no: number, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表完全ピックアップ』には配列を指定する必要があります。') }
      return a.filter((row) => row[no] === s)
    }
  },
  '表検索': { // @二次元配列AでCOL列目(0起点)からキーSを含む行をROW行目から検索して何行目にあるか返す。見つからなければ-1を返す。 // @ひょうけんさく
    type: 'func',
    josi: [['の'], ['で', 'に'], ['から'], ['を']],
    pure: true,
    fn: function (a: any, col: number, row: number, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表検索』には配列を指定する必要があります。') }
      for (let i = row; i < a.length; i++) {
        if (a[i][col] === s) { return i }
      }
      return -1
    }
  },
  '表列数': { // @二次元配列Aの列数を調べて返す。 // @ひょうれつすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
      if (!(a instanceof Array)) { throw new Error('『表列数』には配列を指定する必要があります。') }
      let cols = 1
      for (let i = 0; i < a.length; i++) {
        if (a[i].length > cols) { cols = a[i].length }
      }
      return cols
    }
  },
  '表行数': { // @二次元配列Aの行数を調べて返す。 // @ひょうぎょうすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
      if (!(a instanceof Array)) { throw new Error('『表行数』には配列を指定する必要があります。') }
      return a.length
    }
  },
  '表行列交換': { // @二次元配列Aの行と列を交換して返す。 // @ひょうぎょうれつこうかん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any, sys: any) {
      if (!(a instanceof Array)) { throw new Error('『表行列交換』には配列を指定する必要があります。') }
      const cols = sys.__exec('表列数', [a])
      const rows = a.length
      const res = []
      for (let r = 0; r < cols; r++) {
        const row: any[] = []
        res.push(row)
        for (let c = 0; c < rows; c++) {
          row[c] = (a[c][r] !== undefined) ? a[c][r] : ''
        }
      }
      return res
    }
  },
  '表右回転': { // @二次元配列Aを90度回転して返す。 // @ひょうみぎかいてん
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function (a: any, sys: any) {
      if (!(a instanceof Array)) { throw new Error('『表右回転』には配列を指定する必要があります。') }
      const cols = sys.__exec('表列数', [a])
      const rows = a.length
      const res = []
      for (let r = 0; r < cols; r++) {
        const row: any[] = []
        res.push(row)
        for (let c = 0; c < rows; c++) {
          row[c] = a[rows - c - 1][r]
        }
      }
      return res
    }
  },
  '表重複削除': { // @二次元配列AのI列目にある重複項目を削除して返す。 // @ひょうじゅうふくさくじょ
    type: 'func',
    josi: [['の'], ['を', 'で']],
    pure: true,
    fn: function (a: any, i: any) {
      if (!(a instanceof Array)) { throw new Error('『表重複削除』には配列を指定する必要があります。') }
      const res: any[] = []
      const keys:{[key: string]: boolean} = {}
      for (let n = 0; n < a.length; n++) {
        const k = a[n][i]
        if (undefined === keys[k]) {
          keys[k] = true
          res.push(a[n])
        }
      }
      return res
    }
  },
  '表列取得': { // @二次元配列AのI列目を返す。 // @ひょうれつしゅとく
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a: any, i: number) {
      if (!(a instanceof Array)) { throw new Error('『表列取得』には配列を指定する必要があります。') }
      const res = a.map(row => row[i])
      return res
    }
  },
  '表列挿入': { // @二次元配列Aの(0から数えて)I列目に配列Sを挿入して返す // @ひょうれつそうにゅう
    type: 'func',
    josi: [['の'], ['に', 'へ'], ['を']],
    pure: true,
    fn: function (a: any, i: any, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表列挿入』には配列を指定する必要があります。') }
      const res: any[] = []
      a.forEach((row, idx) => {
        let nr: any[] = []
        if (i > 0) { nr = nr.concat(row.slice(0, i)) }
        nr.push(s[idx])
        nr = nr.concat(row.slice(i))
        res.push(nr)
      })
      return res
    }
  },
  '表列削除': { // @二次元配列Aの(0から数えて)I列目削除して返す // @ひょうれつそうにゅう
    type: 'func',
    josi: [['の'], ['を']],
    pure: true,
    fn: function (a: any, i: any) {
      if (!(a instanceof Array)) { throw new Error('『表列削除』には配列を指定する必要があります。') }
      const res: any[] = []
      a.forEach((row) => {
        const nr = row.slice(0)
        nr.splice(i, 1)
        res.push(nr)
      })
      return res
    }
  },
  '表列合計': { // @二次元配列Aの(0から数えて)I列目を合計して返す。 // @ひょうれつごうけい
    type: 'func',
    josi: [['の'], ['を', 'で']],
    pure: true,
    fn: function (a: any, i: any) {
      if (!(a instanceof Array)) { throw new Error('『表列合計』には配列を指定する必要があります。') }
      let sum = 0
      a.forEach((row) => { sum += row[i] })
      return sum
    }
  },
  '表曖昧検索': { // @二次元配列AのROW行目からCOL列目(0起点)で正規表現Sにマッチする行を検索して何行目にあるか返す。見つからなければ-1を返す。(v1非互換) // @ひょうあいまいけんさく
    type: 'func',
    josi: [['の'], ['から'], ['で'], ['を']],
    pure: true,
    fn: function (a: any, row: any, col: any, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表曖昧検索』には配列を指定する必要があります。') }
      const re = new RegExp(s)
      for (let i = row; i < a.length; i++) {
        const line = a[i]
        if (re.test(line[col])) { return i }
      }
      return -1
    }
  },
  '表正規表現ピックアップ': { // @二次元配列AでI列目(0起点)から正規表現パターンSにマッチする行をピックアップして返す。 // @ひょうせいきひょうげんぴっくあっぷ
    type: 'func',
    josi: [['の', 'で'], ['から'], ['を']],
    pure: true,
    fn: function (a: any, col: any, s: any) {
      if (!(a instanceof Array)) { throw new Error('『表正規表現ピックアップ』には配列を指定する必要があります。') }
      const re = new RegExp(s)
      const res = []
      for (let i = 0; i < a.length; i++) {
        const row = a[i]
        if (re.test(row[col])) { res.push(row.slice(0)) }
      }
      return res
    }
  },
  // @辞書型変数の操作
  '辞書キー列挙': { // @辞書型変数Aのキーの一覧を配列で返す。 // @じしょきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
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
    fn: function (a: any, key: any) {
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
    fn: function (a: any, key: any) {
      return key in a
    }
  },
  // @ハッシュ
  'ハッシュキー列挙': { // @ハッシュAのキー一覧を配列で返す。 // @はっしゅきーれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any, sys: any) {
      return sys.__exec('辞書キー列挙', [a, sys])
    }
  },
  'ハッシュ内容列挙': { // @ハッシュAの内容一覧を配列で返す。 // @はっしゅないようれっきょ
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a: any) {
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
    fn: function (a: any, key: any, sys: any) {
      return sys.__exec('辞書キー削除', [a, key, sys])
    }
  },
  'ハッシュキー存在': { // @ハッシュAのキーKEYが存在するか確認 // @はっしゅきーそんざい
    type: 'func',
    josi: [['の', 'に'], ['が']],
    pure: true,
    fn: function (a: any, key: any) {
      return key in a
    }
  },
  // @タイマー
  '秒待': { // @ N秒の間待機する // @びょうまつ
    type: 'func',
    josi: [['']],
    pure: true,
    asyncFn: true,
    fn: function (n: any, sys:any): Promise<void> {
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
    fn: async function (n: any, sys: any) {
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
    fn: async function (n: any, sys: any) {
      const p = sys.__exec('秒待', [n, sys])
      return await p
    },
    return_none: true
  },
  '秒後': { // @無名関数（あるいは、文字列で関数名を指定）FをN秒後に実行する。変数『対象』にタイマーIDを代入する。 // @びょうご
    type: 'func',
    josi: [['を'], ['']],
    pure: true,
    fn: function (f: any, n: any, sys: any) {
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
    fn: function (f: any, n: any, sys: any) {
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
    fn: function (f: any, n: any, sys: any) {
      return sys.__exec('秒毎', [f, n, sys])
    }
  },
  'タイマー停止': { // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを停止する // @たいまーていし
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function (timerId: any, sys: any) {
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
    fn: function (sys: NakoSystem) {
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
  // @日時処理(簡易)
  '元号データ': { type: 'const', value: [{ '元号': '令和', '改元日': '2019/05/01' }, { '元号': '平成', '改元日': '1989/01/08' }, { '元号': '昭和', '改元日': '1926/12/25' }, { '元号': '大正', '改元日': '1912/07/30' }, { '元号': '明治', '改元日': '1868/10/23' }] }, // @げんごうでーた
  '今': { // @現在時刻を「HH:mm:ss」の形式で返す // @いま
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const z2 = (n: number): string => {
        const ns = '00' + String(n)
        return ns.substring(ns.length - 2, ns.length)
      }
      const t = new Date()
      return z2(t.getHours()) + ':' + z2(t.getMinutes()) + ':' + z2(t.getSeconds())
    }
  },
  'システム時間': { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) を返す // @しすてむじかん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const now = new Date()
      return Math.floor(now.getTime() / 1000)
    }
  },
  'システム時間ミリ秒': { // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) をミリ秒で返す // @しすてむじかんみりびょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      const now = new Date()
      return now.getTime()
    }
  },
  '今日': { // @今日の日付を「YYYY/MM/DD」の形式で返す // @きょう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      return sys.__formatDate(new Date())
    }
  },
  '明日': { // @明日の日付を「YYYY/MM/DD」の形式で返す // @あした
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const t = Date.now() + (24 * 60 * 60 * 1000)
      return sys.__formatDate(new Date(t))
    }
  },
  '昨日': { // @昨日の日付を「YYYY/MM/DD」の形式で返す // @きのう
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const t = Date.now() - (24 * 60 * 60 * 1000)
      return sys.__formatDate(new Date(t))
    }
  },
  '今年': { // @今年が何年かを西暦で返す // @ことし
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (new Date()).getFullYear()
    }
  },
  '来年': { // @来年が何年かを西暦で返す // @らいねん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (new Date()).getFullYear() + 1
    }
  },
  '去年': { // @去年が何年かを西暦で返す // @きょねん
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (new Date()).getFullYear() - 1
    }
  },
  '今月': { // @今月が何月かを返す // @こんげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (new Date()).getMonth() + 1
    }
  },
  '来月': { // @来月が何月かを返す // @らいげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (new Date()).getMonth() + 2
    }
  },
  '先月': { // @先月が何月かを返す // @せんげつ
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      return (new Date()).getMonth()
    }
  },
  '曜日': { // @Sに指定した日付の曜日を返す。不正な日付の場合は今日の曜日を返す。 // @ようび
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s: string, sys: any) {
      const d = sys.__str2date(s)
      return '日月火水木金土'.charAt(d.getDay() % 7)
    }
  },
  '曜日番号取得': { // @Sに指定した日付の曜日番号を番号で返す。不正な日付の場合は今日の曜日番号を返す。(0=日/1=月/2=火/3=水/4=木/5=金/6=土) // @ようびばんごうしゅとく
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (s: any) {
      const a = s.split('/')
      const t = new Date(a[0], a[1] - 1, a[2])
      return t.getDay()
    }
  },
  'UNIXTIME変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す(v1非互換) // @UNIXTIMEへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    pure: true,
    fn: function (s: string, sys: any) {
      const d = sys.__str2date(s)
      return d.getTime() / 1000
    }
  },
  'UNIX時間変換': { // @日時SをUNIX時間 (UTC(1970/1/1)からの経過秒数) に変換して返す(v1非互換) // @UNIXじかんへんかん
    type: 'func',
    josi: [['の', 'を', 'から']],
    pure: true,
    fn: function (s: string, sys: any) {
      const d = sys.__str2date(s)
      return d.getTime() / 1000
    }
  },
  '日時変換': { // @UNIX時間 (UTC(1970/1/1)からの経過秒数) を「YYYY/MM/DD HH:mm:ss」の形式に変換 // @にちじへんかん
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (tm: any, sys: any) {
      const t = tm * 1000
      return sys.__formatDateTime(new Date(t), '2022/01/01 00:00:00')
    }
  },
  '日時書式変換': { // @UNIX時間TM(または日付文字列)を「YYYY/MM/DD HH:mm:ss」または「YY-M-D H:m:s」その他、W:曜日、WWW:曜日英、MMM:月英、ccc:ミリ秒の書式に変換 // @にちじしょしきへんかん
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (tm: any, fmt: any, sys: any) {
      const t = sys.__str2date(tm)
      fmt = fmt.replace(/(YYYY|ccc|WWW|MMM|YY|MM|DD|HH|mm|ss|[MDHmsW])/g, (m: string) => {
        switch (m) {
          case 'YYYY': return t.getFullYear()
          case 'YY': return (String(t.getFullYear())).substring(2)
          case 'MM': return sys.__zero2(String(t.getMonth() as number + 1))
          case 'DD': return sys.__zero2(t.getDate())
          case 'M': return (t.getMonth() as number + 1)
          case 'D': return (t.getDate())
          case 'HH': return sys.__zero2(t.getHours())
          case 'mm': return sys.__zero2(t.getMinutes())
          case 'ss': return sys.__zero2(t.getSeconds())
          case 'ccc': return sys.__zero(t.getMilliseconds(), 3)
          case 'H': return (t.getHours())
          case 'm': return (t.getMinutes())
          case 's': return (t.getSeconds())
          case 'W': return '日月火水木金土'.charAt(t.getDay() % 7)
          case 'WWW': return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][t.getDay() % 7]
          case 'MMM': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t.getMonth()]
        }
        return m
      })
      return fmt
    }
  },
  '和暦変換': { // @Sを和暦に変換する。Sは明治以降の日付が有効。 // @われきへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s: string, sys: NakoSystem) {
      const d = sys.__str2date(s)
      const t = d.getTime()
      for (const era of sys.__getSysVar('元号データ')) {
        const gengo = String(era['元号'])
        const d2 = sys.__str2date(era['改元日'])
        const t2 = d2.getTime()
        if (t2 <= t) {
          let y: any = (d.getFullYear() - d2.getFullYear()) + 1
          if (y === 1) { y = '元' }
          return gengo + String(y) + '年' + sys.__zero2(d.getMonth() + 1) + '月' + sys.__zero2(d.getDate()) + '日'
        }
      }
      throw new Error('『和暦変換』は明示以前の日付には対応していません。')
    }
  },
  '年数差': { // @日付AとBの差を年数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @ねんすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      const t1 = sys.__str2date(a)
      const t2 = sys.__str2date(b)
      return (t2.getFullYear() - t1.getFullYear())
    }
  },
  '月数差': { // @日付AとBの差を月数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @げっすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      const t1 = sys.__str2date(a)
      const t2 = sys.__str2date(b)
      return (t2.getFullYear() * 12 + Number(t2.getMonth())) -
        (t1.getFullYear() * 12 + Number(t1.getMonth()))
    }
  },
  '日数差': { // @日付AとBの差を日数で求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @にっすうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const days = Math.ceil((t2 - t1) / (60 * 60 * 24))
      return days
    }
  },
  '時間差': { // @時間AとBの時間の差を求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @じかんさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const hours = Math.ceil((t2 - t1) / (60 * 60))
      return hours
    }
  },
  '分差': { // @時間AとBの分数の差を求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @ふんさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const min = Math.ceil((t2 - t1) / (60))
      return min
    }
  },
  '秒差': { // @時間AとBの差を秒差で求めて返す。A<Bなら正の数、そうでないなら負の数を返す。 // @びょうさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの']],
    pure: true,
    fn: function (a: any, b: any, sys: any) {
      const t1 = Math.ceil(sys.__str2date(a).getTime() / 1000)
      const t2 = Math.ceil(sys.__str2date(b).getTime() / 1000)
      const sec = Math.ceil((t2 - t1))
      return sec
    }
  },
  '日時差': { // @日時AとBの差を種類unitで返す。A<Bなら正の数、そうでないなら負の数を返す (v1非互換)。 // @にちじさ
    type: 'func',
    josi: [['と', 'から'], ['の', 'までの'], ['による']],
    pure: true,
    fn: function (a: any, b: any, unit: string, sys: any): string {
      switch (unit) {
        case '年': return sys.__exec('年数差', [a, b, sys])
        case '月': return sys.__exec('月数差', [a, b, sys])
        case '日': return sys.__exec('日数差', [a, b, sys])
        case '時間': return sys.__exec('時間差', [a, b, sys])
        case '分': return sys.__exec('分差', [a, b, sys])
        case '秒': return sys.__exec('秒差', [a, b, sys])
      }
      throw new Error('『日時差』で不明な単位です。')
    }
  },
  '時間加算': { // @時間SにAを加えて返す。Aには「(+｜-)hh:nn:dd」で指定する。 // @じかんかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function (s: string, a: string, sys: any) {
      const op = a.charAt(0)
      if (op === '-' || op === '+') {
        a = a.substring(1)
      }
      const d = sys.__str2date(s)
      const aa = (a + ':0:0').split(':')
      let sec = parseInt(aa[0]) * 60 * 60 +
        parseInt(aa[1]) * 60 +
        parseInt(aa[2])
      if (op === '-') { sec *= -1 }
      const rd = new Date(Number(d.getTime()) + (sec * 1000))
      return sys.__formatDateTime(rd, s)
    }
  },
  '日付加算': { // @日付SにAを加えて返す。Aには「(+｜-)yyyy/mm/dd」で指定する。 // @ひづけかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function (s: string, a: string, sys: any) {
      let op = 1
      const opc = a.charAt(0)
      if (opc === '-' || opc === '+') {
        a = a.substring(1)
        if (opc === '-') { op *= -1 }
      }
      const d = sys.__str2date(s)
      const aa = (a + '/0/0').split('/')
      const addY = parseInt(aa[0]) * op
      const addM = parseInt(aa[1]) * op
      const addD = parseInt(aa[2]) * op
      d.setFullYear(Number(d.getFullYear()) + addY)
      d.setMonth(Number(d.getMonth()) + addM)
      d.setDate(Number(d.getDate()) + addD)
      return sys.__formatDateTime(d, s)
    }
  },
  '日時加算': { // @日時SにAを加えて返す。Aは「(+｜-)1(年|ヶ月|日|週|時間|分|秒)」のように指定する (v1非互換)。 // @にちじかさん
    type: 'func',
    josi: [['に'], ['を']],
    pure: true,
    fn: function (s: string, a: string, sys: any) {
      const r = ('' + a).match(/([+|-]?)(\d+)(年|ヶ月|日|週間|時間|分|秒)$/)
      if (!r) { throw new Error('『日付加算』は『(+｜-)1(年|ヶ月|日|時間|分|秒)』の書式で指定します。') }
      switch (r[3]) {
        case '年': return sys.__exec('日付加算', [s, `${r[1]}${r[2]}/0/0`, sys])
        case 'ヶ月': return sys.__exec('日付加算', [s, `${r[1]}0/${r[2]}/0`, sys])
        case '週間': return sys.__exec('日付加算', [s, `${r[1]}0/0/${parseInt(r[2]) * 7}`, sys])
        case '日': return sys.__exec('日付加算', [s, `${r[1]}0/0/${r[2]}`, sys])
        case '時間': return sys.__exec('時間加算', [s, `${r[1]}${r[2]}:0:0`, sys])
        case '分': return sys.__exec('時間加算', [s, `${r[1]}0:${r[2]}:0`, sys])
        case '秒': return sys.__exec('時間加算', [s, `${r[1]}0:0:${r[2]}`, sys])
      }
    }
  },
  '時間ミリ秒取得': { // @ミリ秒単位の時間を数値で返す。結果は実装に依存する。 // @じかんみりびょうしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function () {
      if (performance && performance.now) {
        return performance.now()
      } else if (Date.now) {
        return Date.now()
      } else {
        const now = new Date()
        return now.getTime()
      }
    }
  },
  // @デバッグ支援
  'デバッグ表示': { // @デバッグ用にSを表示する // @でばっぐひょうじ
    type: 'func',
    josi: [['と', 'を', 'の']],
    pure: true,
    fn: function (s: any, sys: NakoSystem) {
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
    fn: function (s: any, sys: NakoSystem) {
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
    fn: function (s: any, sys: NakoSystem) {
      sys.__hatena(s, sys)
    },
    return_none: true
  },
  'エラー発生': { // @故意にエラーSを発生させる // @えらーはっせい
    type: 'func',
    josi: [['の', 'で']],
    pure: true,
    fn: function (s: any) {
      throw new Error(s)
    },
    return_none: true
  },
  '__DEBUG': { // @デバッグモードにする // @__DEBUG
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
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
    fn: function (curLine: number, sys: any) {
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
    fn: function (sys: NakoSystem) {
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
    fn: function (sys: NakoSystem) {
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
    fn: function (fname: string, sys: any) {
      return (typeof sys.__getSysVar(fname) !== 'undefined')
    }
  },
  'プラグイン一覧取得': { // @利用中のプラグイン一覧を得る // @ぷらぐいんいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
      const a = []
      for (const f in (sys as any).pluginfiles) { a.push(f) }
      return a
    }
  },
  'モジュール一覧取得': { // @取り込んだモジュール一覧を得る // @もじゅーるいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: NakoSystem) {
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
    fn: function (sys: NakoSystem) {
      return sys.josiList
    }
  },
  '予約語一覧取得': { // @文法として定義されている予約語の一覧を取得する // @よやくごいちらんしゅとく
    type: 'func',
    josi: [],
    pure: true,
    asyncFn: false,
    fn: function (sys: NakoSystem) {
      return sys.reservedWords
    }
  },
  // @プラグイン管理
  'プラグイン名': { type: 'const', value: 'メイン' }, // @ぷらぐいんめい
  'プラグイン名設定': { // @プラグイン名をSに変更する(システムにより自動的に「メイン」あるいはプラグインのファイル名が呼ばれる) // @ぷらぐいんめいせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (s: string, sys: any) {
      sys.__setSysVar('プラグイン名', s)
    },
    return_none: true
  },
  '名前空間': { type: 'const', value: '' }, // @なまえくうかん
  '名前空間設定': { // @名前空間をSに設定する(システムにより自動的に変更される。ファイル名から拡張子を削ったもの) // @なまえくうかんせってい
    type: 'func',
    josi: [['に', 'へ']],
    pure: true,
    fn: function (s: string, sys: NakoSystem) {
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
    fn: function (sys: NakoSystem) {
      // pop namespace
      const a = (sys as any).__namespaceList.pop()
      if (a) {
        sys.__setSysVar('名前空間', a[0])
        sys.__setSysVar('プラグイン名', a[1])
      }
    },
    return_none: true
  },

  // @URLエンコードとパラメータ
  'URLエンコード': { // @URLエンコードして返す // @URLえんこーど
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (text: any) {
      return encodeURIComponent(text)
    }
  },
  'URLデコード': { // @URLデコードして返す // @URLでこーど
    type: 'func',
    josi: [['を', 'へ', 'に']],
    pure: true,
    fn: function (text: any) {
      return decodeURIComponent(text)
    }
  },
  'URLパラメータ解析': { // @URLパラメータを解析してハッシュで返す // @URLぱらめーたかいせき
    type: 'func',
    josi: [['を', 'の', 'から']],
    pure: true,
    fn: function (url: string, sys: any) {
      const res: any = {}
      if (typeof url !== 'string') {
        return res
      }
      const p = url.split('?')
      if (p.length <= 1) {
        return res
      }
      const params = p[1].split('&')
      for (const line of params) {
        const line2 = line + '='
        const kv = line2.split('=')
        const k = sys.__exec('URLデコード', [kv[0]])
        res[k] = sys.__exec('URLデコード', [kv[1]])
      }
      return res
    }
  },
  // @BASE64
  'BASE64エンコード': { // @BASE64エンコードして返す // @BASE64えんこーど
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (text: any) {
      // browser?
      if (typeof (window) !== 'undefined' && (window as any).btoa) {
        const u8a: any = new TextEncoder().encode(text)
        const utf8str = String.fromCharCode.apply(null, u8a)
        return btoa(utf8str)
      }
      // Node?
      if (typeof (Buffer) !== 'undefined') {
        return Buffer.from(text).toString('base64')
      }
      throw new Error('『BASE64エンコード』は利用できません。')
    }
  },
  'BASE64デコード': { // @BASE64デコードして返す // @BASE64でこーど
    type: 'func',
    josi: [['を', 'へ', 'に']],
    pure: true,
    fn: function (text: any) {
      if (typeof (window) !== 'undefined' && (window as any).atob) {
        const decodedUtf8str = atob(text)
        const dec: any = Array.prototype.map.call(decodedUtf8str, c => c.charCodeAt())
        const decodedArray = new Uint8Array(dec)
        return new TextDecoder('UTF-8').decode(decodedArray)
      }
      // Node?
      if (typeof (Buffer) !== 'undefined') {
        return Buffer.from(text, 'base64').toString()
      }
      throw new Error('『BASE64デコード』は利用できません。')
    }
  }
}
