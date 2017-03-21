// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('言', function (msg) {
  window.alert(msg)
})

// なでしこにオリジナル関数をJSで追加
navigator.nako3.addFunc('色変更',
    [['に', 'へ']],
    function (s) {
      $('info').style.color = s
    })

// 簡易DOMアクセス関数など
function $ (id) {
  return document.getElementById(id)
}

function toHtml (s) {
  s = '' + s
  return s.replace(/&/g, '&amp;').replace(/</, '&lt;').replace(/>/, '&gt;')
}

function resetBox () {
  let info = $('info')
  info.innerHTML = ''
  info.style.color = ''
}

function ajaxGet (url, param, callback) {
  const xhr = new window.XMLHttpRequest()
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return
    callback(xhr.responseText, xhr)
  }
  xhr.open('GET', url, false)
  xhr.send(param)
}
