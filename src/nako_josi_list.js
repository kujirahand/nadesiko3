/**
 * 助詞の一覧
 */

const josiList = [
  'について', 'くらい', 'なのか', 'までを', 'までの', 'による',
  'とは', 'から', 'まで', 'だけ', 'より', 'ほど', 'など',
  'いて', 'えて', 'きて', 'けて', 'して', 'って', 'にて', 'みて',
  'めて', 'ねて', 'では', 'には', 'は~', 'んで', 'ずつ',
  'は', 'を', 'に', 'へ', 'で', 'と', 'が', 'の'
]

// 「もし」文で使う助詞
const tararebaJosiList = [
  'でなければ', 'なければ', 'ならば', 'なら', 'たら', 'れば'
]

// 意味のない助詞(削除する) #936 #939 #974
const removeJosiList = [
  'こと', 'である', 'です', 'します', 'でした'
]

// 一覧をプログラムで扱いやすいようマップに変換
const tararebaMap = {}
tararebaJosiList.forEach(josi => {
  josiList.push(josi)
  tararebaMap[josi] = true
})
const removeJosiMap = {}
removeJosiList.forEach(josi => {
  josiList.push(josi)
  removeJosiMap[josi] = true
})

// 文字数の長い順に並び替え
josiList.sort((a, b) => b.length - a.length)

// 正規表現で助詞をマッチできるようにする
const josiRE = new RegExp('^[\\t ]*(' + josiList.join('|') + ')')

module.exports = {
  josiRE,
  tararebaMap,
  removeJosiMap,
  josiList
}
