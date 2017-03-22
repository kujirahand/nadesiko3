/* globals $ */
let displayId = 'info'

// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('表示', function (s) {
  $(displayId).innerHTML += toHtml(s) + '<br>'
})

// 簡易DOMアクセス関数など
function runBox (id) {
  if (id == null) {
    window.alert('idが設定されていません。')
    return
  }
  let src = $(id).value
  displayId = id + '_info'
  $(displayId).innerHTML = ''
  try {
    src = 'カメ全消去\n' + src
    navigator.nako3.debug = false
    navigator.nako3.run(src)
    $('backlink').href = '#' + id + '_head'
    window.location.href = '#run'
    $('err').style.display = 'none'
  } catch (e) {
    $('err').innerHTML = e.message.replace(/\n/g, '<br>\n')
    $('err').style.display = 'block'
  }
}

function resetBoxTurtle (id) {
  if (id == null) {
    id = 'src_box'
  }
  $(id + '_info').innerHTML = ''
  const cv = $('turtle_cv')
  cv.getContext('2d').clearRect(0, 0, cv.width, cv.height)
  navigator.nako3.run('カメ全消去')
}
