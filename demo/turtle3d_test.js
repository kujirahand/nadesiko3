// 追加のデフォルトコード
const defCode =
  'T3Dカメ描画先は『turtle3d_div』。' +
  'T3Dオービットコントロール設定。';

let displayId = 'info'

// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('表示', [['と', 'を']], function (s) {
  console.log(s)
  document.getElementById(displayId).innerHTML += toHtml(s) + '<br>'
})

let nakoGlobal = undefined

// 簡易DOMアクセス関数など
function runBox (id) {
  if (id === null) {
    window.alert('idが設定されていません。')
    return
  }
  let src = defCode + document.getElementById(id).value
  displayId = id + '_info'
  document.getElementById(displayId).innerHTML = ''
  try {
    nakoGlobal = navigator.nako3._runEx(src,'',{}, defCode, nakoGlobal)
    document.getElementById('backlink').href = '#' + id + '_head'
    window.location.href = '#run'
    document.getElementById('err').style.display = 'none'
  } catch (e) {
    document.getElementById('err').innerHTML = e.message.replace(/\n/g, '<br>\n')
    document.getElementById('err').style.display = 'block'
  }
}

function resetBoxTurtle3D (id) {
  if (id === null)
    id = 'src_box'

  document.getElementById(id + '_info').innerHTML = ''
  navigator.nako3._runEx('T3Dカメ全消去', '', {}, '', nakoGlobal)
  document.getElementById('turtle3d_div').innerHTML = ''
  nakoGlobal = undefined
}
