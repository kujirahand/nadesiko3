 
import { NakoSystem } from './plugin_api.mjs'
// plugin_system.mts は肥大化していたため、内容ごとに複数ファイルへ分割している (#2351)
// いずれも単独のプラグインではなく、実行時にこの plugin_system へマージされる
import PluginSystemDebug from './plugin_system_debug.mjs' // 特殊命令・デバッグ支援・プラグイン管理
import PluginSystemMath from './plugin_system_math.mjs' // 四則演算・論理演算・ビット演算
import PluginSystemString from './plugin_system_string.mjs' // 文字列処理・置換/トリム・文字変換・指定形式・文字種類
import PluginSystemArray from './plugin_system_array.mjs' // 配列操作・二次元配列処理
import PluginSystemDatetime from './plugin_system_datetime.mjs' // 日時処理(簡易)
import PluginSystemUrl from './plugin_system_url.mjs' // URLエンコード・パラメータ・BASE64・パス操作
import PluginSystemTypes from './plugin_system_types.mjs' // 型変換
import PluginSystemJson from './plugin_system_json.mjs' // JSON
import PluginSystemRegexp from './plugin_system_regexp.mjs' // 正規表現
import PluginSystemDict from './plugin_system_dict.mjs' // 辞書型変数の操作・ハッシュ
import PluginSystemStdio from './plugin_system_stdio.mjs' // 標準出力
import PluginSystemTimer from './plugin_system_timer.mjs' // タイマー

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

}

// 分割ファイルの命令を plugin_system にマージする (#2351)
// 実行時は単一のプラグイン『plugin_system』として振る舞う
Object.assign(PluginSystem, PluginSystemDebug)
Object.assign(PluginSystem, PluginSystemMath)
Object.assign(PluginSystem, PluginSystemString)
Object.assign(PluginSystem, PluginSystemArray)
Object.assign(PluginSystem, PluginSystemDatetime)
Object.assign(PluginSystem, PluginSystemUrl)
Object.assign(PluginSystem, PluginSystemTypes)
Object.assign(PluginSystem, PluginSystemJson)
Object.assign(PluginSystem, PluginSystemRegexp)
Object.assign(PluginSystem, PluginSystemDict)
Object.assign(PluginSystem, PluginSystemStdio)
Object.assign(PluginSystem, PluginSystemTimer)

export default PluginSystem
