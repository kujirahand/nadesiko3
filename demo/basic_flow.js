/* globals $ */
let displayId = 'info'

// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('表示', function (s) {
  $(displayId).innerHTML += toHtml(s) + '<br>'
})

// 簡易DOMアクセス関数など
function runBox (id) {
  if (id === null) {
    alert('idが設定されていません。')
    return
  }
  const src = $(id).value
  displayId = id + '_info'
  $(displayId).innerHTML = ''
  try {
    navigator.nako3.run(src)
  } catch (e) {
    console.log(e)
  }
}
