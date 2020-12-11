module.exports = {
  // @システム
  '終': { // @ブラウザでプログラムの実行を強制終了する // @おわる
    type: 'func',
    josi: [],
    fn: function () {
      throw new Error('__終わる__')
    },
    return_none: true
  }
}
