/**
 * 助詞の一覧
 */

// 基本的な助詞の一覧
export const josiList: string[] = [
  'について', 'くらい', 'なのか', 'までを', 'までの', 'による', 'として',
  'とは', 'から', 'まで', 'だけ', 'より', 'ほど', 'など',
  'いて', 'えて', 'きて', 'けて', 'して', 'って', 'にて', 'みて',
  'めて', 'ねて', 'では', 'には', 'んで', 'ずつ',
  'は', 'を', 'に', 'へ', 'で', 'と', 'が', 'の'
]

// 「もし」文で使う助詞
export const tararebaJosiList: string[] = [
  'でなければ', 'なければ', 'ならば', 'なら', 'たら', 'れば'
]

// 意味のない助詞(削除する) #936 #939 #974
export const removeJosiList: string[] = [
  'こと', 'である', 'です', 'します', 'でした', 'にゃん'
]

/**
 * 「もし」文で使う「たら」「れば」などの一覧をプログラムで扱いやすいようマップに変換したもの
 */
export const tararebaMap: {[key:string]: boolean} = {}
tararebaJosiList.forEach(josi => {
  josiList.push(josi)
  tararebaMap[josi] = true
})

/**
 * 意味のない助詞(削除する)をマップに変換したもの
 */
export const removeJosiMap: {[key:string]: boolean} = {}
removeJosiList.forEach(josi => {
  josiList.push(josi)
  removeJosiMap[josi] = true
})

// 「もの」構文 (#1614)
const josiListMono = []
for (const jo of josiList) {
  josiListMono.push('もの' + jo)
  josiListMono.push(jo)
}

// 文字数の長い順に並び替え
josiListMono.sort((a, b) => b.length - a.length)

// 正規表現で助詞をマッチできるようにする
const pat = '^[\\t ]*(' + josiListMono.join('|') + ')'
export const josiRE = new RegExp(pat)
export const josiListExport = josiList
