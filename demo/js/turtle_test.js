// 追加のデフォルトコード
const defCode =
  'カメ全消去。' +
  'カメ描画先は『#turtle_cv』。' +
  '『#turtle_cv』へ描画開始。';

let displayId = 'info'

// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('表示', [['と', 'を']], function (s) {
  console.log(s)
  document.getElementById(displayId).innerHTML += toHtml(s) + '<br>'
})

// 簡易DOMアクセス関数など
function runBox (id) {
  if (id === null) {
    window.alert('idが設定されていません。')
    return
  }
  console.log('runBox:', id)
  let src = defCode + document.getElementById(id).value
  displayId = id + '_info'
  document.getElementById(displayId).innerHTML = ''
  try {
    navigator.nako3.runReset(src)
    document.getElementById('backlink').href = '#' + id + '_head'
    window.location.href = '#run'
    document.getElementById('err').style.display = 'none'
  } catch (e) {
    document.getElementById('err').innerHTML = e.message.replace(/\n/g, '<br>\n')
    document.getElementById('err').style.display = 'block'
  }
}

function resetBoxTurtle (id) {
  if (id === null)
    id = 'src_box'

  document.getElementById(id + '_info').innerHTML = ''
  const cv = document.getElementById('turtle_cv')
  cv.getContext('2d').clearRect(0, 0, cv.width, cv.height)
  navigator.nako3.run('カメ全消去')
}
