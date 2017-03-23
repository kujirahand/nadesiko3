/* globals $ */
// なでしこの関数をカスタマイズ
navigator.nako3.setFunc('表示', function (s) {
  $('info').innerHTML += toHtml(s) + '<br>'
})

// 簡易DOMアクセス関数など
function runBox (id) {
  if (id !== null) {
    $('src_box').value = $(id).value
    resetBox()
  }
  const src = $('src_box').value
  $('err').style.display = 'none'
  try {
    navigator.nako3.run(src)
  } catch (e) {
    let msg = e.message
    $('err').style.display = 'block'
    $('err').innerHTML = msg
    console.log(e)
  }
}
