// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('言', function (msg) {
  window.alert(msg)
})

// なでしこにオリジナル関数をJSで追加
navigator.nako3.addFunc('色変更',
  [['に', 'へ']],
  function (s) {
    document.getElementById('info').style.color = s
  })

function toHtml (s) {
  s = '' + s
  return s.replace(/&/g, '&amp;').replace(/</, '&lt;').replace(/>/, '&gt;')
}
