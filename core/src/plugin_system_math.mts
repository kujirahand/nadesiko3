/**
 * @fileOverview なでしこ3 plugin_system の分割ファイル
 *
 * 四則演算・論理演算・ビット演算の命令を定義する。
 * このファイルは単独のプラグインではなく、plugin_system.mts へマージされる。(#2351)
 */
export default {
  // @四則演算
  '足': { // @AとBを足す(算術演算を行う) // @たす
    type: 'func',
    josi: [['に', 'と'], ['を']],
    isVariableJosi: false,
    pure: true,
    fn: function(a: any, b: any) {
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
    fn: function(...a: any) {
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
    fn: function(a: any, b: any) {
      return a - b
    }
  },
  '掛': { // @AにBを掛ける // @かける
    type: 'func',
    josi: [['に', 'と'], ['を']],
    pure: true,
    fn: function(a: any, b: any) {
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
    fn: function(a: any, b: any) {
      return a * b
    }
  },
  '割': { // @AをBで割る // @わる
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(a: any, b: any) {
      return a / b
    }
  },
  '割余': { // @AをBで割った余りを求める // @わったあまり
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(a: any, b: any) {
      return a % b
    }
  },
  '偶数': { // @Aが偶数なら真を返す // @ぐうすう
    type: 'func',
    josi: [['が']],
    pure: true,
    fn: function(a: any) {
      return (parseInt(a) % 2 === 0)
    }
  },
  '奇数': { // @Aが奇数なら真を返す // @きすう
    type: 'func',
    josi: [['が']],
    pure: true,
    fn: function(a: any) {
      return (parseInt(a) % 2 === 1)
    }
  },
  '二乗': { // @Aを二乗する // @にじょう
    type: 'func',
    josi: [['の', 'を']],
    pure: true,
    fn: function(a: any) {
      return a * a
    }
  },
  'べき乗': { // @AのB乗を求める // @べきじょう
    type: 'func',
    josi: [['の'], ['の']],
    pure: true,
    fn: function(a: any, b: any) {
      return Math.pow(a, b)
    }
  },
  '以上': { // @AがB以上か // @いじょう
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function(a: any, b: any) {
      return a >= b
    }
  },
  '以下': { // @AがB以下か // @いか
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function(a: any, b: any) {
      return a <= b
    }
  },
  '未満': { // @AがB未満か // @みまん
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function(a: any, b: any) {
      return a < b
    }
  },
  '超': { // @AがB超か // @ちょう
    type: 'func',
    josi: [['が'], ['']],
    pure: true,
    fn: function(a: any, b: any) {
      return a > b
    }
  },
  '等': { // @AがBと等しいか // @ひとしい
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function(a: any, b: any) {
      return a === b
    }
  },
  '等無': { // @AがBと等しくないか // @ひとしくない
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function(a: any, b: any) {
      return a !== b
    }
  },
  '一致': { // @AがBと一致するか(配列や辞書も比較可能) // @いっち
    type: 'func',
    josi: [['が'], ['と']],
    pure: true,
    fn: function(a: any, b: any) {
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
    fn: function(a: any, b: any) {
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
    fn: function(v: any, a: any, b: any) {
      return (a <= v) && (v <= b)
    }
  },
  '範囲': { // @AからBの範囲を表現する範囲オブジェクトを返す // @はんい
    type: 'func',
    josi: [['から'], ['の', 'までの']],
    pure: true,
    fn: function(a: any, b: any) {
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
    fn: function(b: any, ...a: any) {
      a.pop() // 必ず末尾に sys があるので、末尾のシステム変数を除外
      a.push(b)
       
      return a.reduce((p: any, c: any) => p + c)
    }
  },
  'MAX': { // @2個以上の数値のうち最大値を返す。// @MAX
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function(b: number, ...a: any): number {
      const sys = a.pop()
      return sys.__exec('最大値', [b, ...a, sys])
    }
  },
  '最大値': { // @2個以上の数値のうち最大値を返す。// @さいだいち
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function(b: number, ...a: any): number {
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
    fn: function(b: number, ...a: any): number {
      const sys = a.pop()
      return sys.__exec('最小値', [b, ...a, sys])
    }
  },
  '最小値': { // @2個以上の数値のうち最小値を返す。// @さいしょうち
    type: 'func',
    josi: [['の'], ['と']],
    isVariableJosi: true,
    pure: true,
    fn: function(b: number, ...a: any): number {
      a.pop() // 必ず末尾に sys があるので、末尾のシステム変数を除外
      a.push(b)
      return a.reduce((p: number, c: number) => Math.min(p, c))
    }
  },
  'CLAMP': { // @数値を下限から上限の範囲内に収めた値を返す。// @CLAMP
    type: 'func',
    josi: [['の', 'を'], ['から'], ['までの', 'で']],
    pure: true,
    fn: function(x: number, a: number, b: number): number {
      return Math.min(Math.max(x, a), b)
    }
  },

  // @論理演算
  '論理OR': { // @AとBの論理和を返す(v1非互換)。 // @ろんりOR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function(a: any, b: any): any {
      return (a || b)
    }
  },
  '論理AND': { // @AとBの論理積を返す(v1非互換)。日本語の「AかつB」に相当する // @ろんりAND
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function(a: any, b: any): boolean {
      return (a && b)
    }
  },
  '論理NOT': { // @値Vが0や空ならばtrue、それ以外ならばfalseを返す(v1非互換) // @ろんりNOT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): boolean {
      return (!v)
    }
  },

  // @ビット演算
  'OR': { // @(ビット演算で)AとBの論理和を返す。 // @OR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function(a: any, b: any): any {
      return (a | b)
    }
  },
  'AND': { // @(ビット演算で)AとBの論理積を返す。日本語の「AかつB」に相当する // @AND
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function(a: any, b: any): any {
      return (a & b)
    }
  },
  'XOR': { // @(ビット演算で)AとBの排他的論理和を返す。// @XOR
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function(a: any, b: any): any {
      return (a ^ b)
    }
  },
  'NOT': { // @(ビット演算で)Vの各ビットを反転して返す。// @NOT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function(v: any): any {
      return (~v)
    }
  },
  'SHIFT_L': { // @VをAビット左へシフトして返す // @SHIFT_L
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(v: number, a: number): number {
      return (v << a)
    }
  },
  'SHIFT_R': { // @VをAビット右へシフトして返す(符号を維持する) // @SHIFT_R
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(v: number, a: number): number {
      return (v >> a)
    }
  },
  'SHIFT_UR': { // @VをAビット右へシフトして返す(符号を維持しない、0で埋める) // @SHIFT_UR
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function(v: number, a: number): number {
      return (v >>> a)
    }
  },
}
