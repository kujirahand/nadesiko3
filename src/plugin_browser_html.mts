// @ts-nocheck
export default {
  // @HTML操作
  'HTML変換': { // @文字列をHTMLに変換して返す // @HTMLへんかん
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(text: any) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/>/g, '&gt;')
        .replace(/</g, '&lt;')
    }
  },
  // @クリップボード
  'クリップボード設定': { // @文字列をクリップボードにコピー // @くりっぷぼーどせってい
    type: 'func',
    josi: [['を']],
    pure: true,
    asyncFn: true,
    fn: async function(text: any) {
      // Clipboard APIをサポートしているか
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        return
      }
      // Clipboard APIをサポートしていない場合
      const tmp = document.createElement('div')
      const pre = document.createElement('pre')
      pre.style.webkitUserSelect = 'auto'
      pre.style.userSelect = 'auto'
      tmp.appendChild(pre).textContent = text
      // 画面外へ表示する
      tmp.style.position = 'fixed'
      tmp.right = '200%'
      document.body.appendChild(tmp)
      document.getSelection().selectAllChildren(tmp)
      document.execCommand('copy')
      document.body.removeChild(tmp)
    },
    return_none: true
  },
  'クリップボード取得時': { // @クリップボードの値を取得した後関数Fを実行する。結果は変数『対象』に代入される(ユーザーの許可が必要)。 // @くりっぷぼーどしゅとくしたとき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function(f: any, sys: any) {
      // Clipboard APIをサポートしているか
      if (navigator.clipboard) {
        if (typeof (f) === 'string') { f = sys.__findFunc(f, 'クリップボード取得時') }
        const pm = navigator.clipboard.readText()
        pm.then(text => {
          sys.__setSysVar('対象', text)
          f(sys)
        })
      } else {
        throw new Error('Clipbard APIが利用できません。')
      }
    }
  },
  'クリップボード取得': { // @クリップボードの値を取得して結果を返す(ユーザーの許可が必要)。 // @くりっぷぼーどしゅとく
    type: 'func',
    josi: [],
    pure: true,
    asyncFn: true,
    fn: async function(sys: any) {
      // Clipboard APIをサポートしているか
      if (navigator.clipboard) {
        const result = await navigator.clipboard.readText()
        return result
      } else {
        throw new Error('Clipbard APIが利用できません。')
      }
    }
  }
}
