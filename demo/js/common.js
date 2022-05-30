// なでしこの関数をカスタマイズ
navigator.nako3.addFunc('言', [['と', 'を']], function (msg) {
  window.alert(msg)
}, true)
navigator.nako3.addFunc('表示', [['と', 'を']], function (msg) {
  window.alert(msg)
}, true)

// なでしこにオリジナル関数をJSで追加
navigator.nako3.addFunc('色変更', [['に', 'へ']], function (s) {
  document.getElementById('info').style.color = s
}, true)

function toHtml (s) {
  s = '' + s
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
