// @ts-nocheck
const PluginMath = {
  初期化: {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys) {
    }
  },
  // @三角関数
  SIN: { // @ラジアン単位VのSINを求める // @SIN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return Math.sin(v)
    }
  },
  COS: { // @ラジアン単位VのCOSを求める // @COS
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return Math.cos(v)
    }
  },
  TAN: { // @ラジアン単位VのTANを求める // @TAN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return Math.tan(v)
    }
  },
  ARCSIN: { // @ラジアン単位VのARCSINを求める // @ARCSIN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return Math.asin(v)
    }
  },
  ARCCOS: { // @ラジアン単位VのARCCOSを求める // @ARCCOS
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return Math.acos(v)
    }
  },
  ARCTAN: { // @ラジアン単位VのARCTANを求める // @ARCTAN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return Math.atan(v)
    }
  },
  ATAN2: { // @ARCTAN(Y/X)をラジアン単位で返す // @ATAN2
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (y, x) {
      return Math.atan2(y, x)
    }
  },
  座標角度計算: { // @点[0,0]から[x,y]の直線とX軸の角度(度)を返す // @ざひょうかくどけいさん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (XY) {
      return Math.atan2(XY[1], XY[0]) * 180 / Math.PI
    }
  },
  RAD2DEG: { // @ラジアンから度に変換 // @RAD2DEG
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return v / Math.PI * 180
    }
  },
  DEG2RAD: { // @度からラジアンに変換 // @DEG2RAD
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return (v / 180) * Math.PI
    }
  },
  度変換: { // @ラジアンから度に変換 // @どへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return v / Math.PI * 180
    }
  },
  ラジアン変換: { // @度からラジアンに変換 // @らじあんへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return (v / 180) * Math.PI
    }
  },

  // @算術関数
  SIGN: { // @Vが0なら0を、0超なら1を、0未満なら-1を返す // @SIGN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (v) {
      return (parseFloat(v) === 0) ? 0 : (v > 0) ? 1 : -1
    }
  },
  符号: { // @Vが0なら0を、0超なら1を、0未満なら-1を返す // @ふごう
    type: 'func',
    josi: [['の']],
    pure: false,
    fn: function (v, sys) {
      return sys.__exec('SIGN', [v])
    }
  },
  ABS: { // @Vの絶対値を返す // @ABS
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.abs(a)
    }
  },
  絶対値: { // @Vの絶対値を返す // @ぜったいち
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.abs(a)
    }
  },
  EXP: { // @e（自然対数の底）の A 乗の値を返す // @EXP
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.exp(a)
    }
  },
  HYPOT: { // @直角三角形の二辺の長さA,Bから斜辺を求めて返す。 // @HYPOT
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return Math.hypot(a, b)
    }
  },
  斜辺: { // @直角三角形の二辺の長さA,Bから斜辺を求めて返す。 // @しゃへん
    type: 'func',
    josi: [['と'], ['の']],
    pure: true,
    fn: function (a, b) {
      return Math.hypot(a, b)
    }
  },
  LN: { // @実数式 A の自然対数（Ln(A) = 1）を返す // @LN
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.log(a)
    }
  },
  LOG: { // @Aの自然対数（底はE）を返す // @LOG
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.log(a)
    }
  },
  LOGN: { // @指定された底AでBの対数を計算して返す // @LOGN
    type: 'func',
    josi: [['で'], ['の']],
    pure: true,
    fn: function (a, b) {
      if (a === 2) { return Math.LOG2E * Math.log(b) }
      if (a === 10) { return Math.LOG10E * Math.log(b) }
      return Math.log(b) / Math.log(a)
    }
  },
  FRAC: { // @実数Aの小数部分を返す // @FRAC
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return a % 1
    }
  },
  小数部分: { // @実数Aの小数部分を返す // @しょうすうぶぶん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return a % 1
    }
  },
  整数部分: { // @実数Aの整数部分を返す // @せいすうぶぶん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.trunc(a)
    }
  },
  乱数: { // @0から(A-1)までの乱数を返す // @らんすう
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.floor(Math.random() * a)
    }
  },
  SQRT: { // @Aの平方根を返す // @SQRT
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.sqrt(a)
    }
  },
  平方根: { // @Aの平方根を返す // @へいほうこん
    type: 'func',
    josi: [['の']],
    pure: true,
    fn: function (a) {
      return Math.sqrt(a)
    }
  },

  // @数値切上切捨丸め
  ROUND: { // @実数型の値Vを丸めてもっとも近い整数値を返す // @ROUND
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return Math.round(v)
    }
  },
  四捨五入: { // @実数型の値Vを丸めてもっとも近い整数値を返す // @ししゃごにゅう
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (v) {
      return Math.round(v)
    }
  },
  小数点切上: { // @整数Aを小数点第B桁で切り上げして返す // @しょうすうてんきりあげ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      const base = Math.pow(10, b)
      return Math.ceil(a * base) / base
    }
  },
  小数点切下: { // @整数Aを小数点第B桁で切り下げして返す // @しょうすうてんきりさげ
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      const base = Math.pow(10, b)
      return Math.floor(a * base) / base
    }
  },
  小数点四捨五入: { // @実数Aを小数点第B桁で四捨五入して返す // @しょうすうてんししゃごにゅう
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a, b) {
      const base = Math.pow(10, b)
      return Math.round(a * base) / base
    }
  },
  CEIL: { // @数値を正の無限大方向へ切り上げて返す。 // @CEIL
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return Math.ceil(v)
    }
  },
  切上: { // @数値を正の無限大方向へ切り上げて返す。 // @きりあげ
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return Math.ceil(v)
    }
  },
  FLOOR: { // @数値を負の無限大方向へ切り下げて返す。 // @FLOOR
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return Math.floor(v)
    }
  },
  切捨: { // @数値を負の無限大方向へ切り下げて返す。// @きりすて
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (v) {
      return Math.floor(v)
    }
  }

}

module.exports = PluginMath
