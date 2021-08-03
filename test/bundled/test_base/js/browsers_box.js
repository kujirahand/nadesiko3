(function (win) {
  let nako3 = null
  let nako3vm = null

  function toHtml (s) {
    s = '' + s
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
  }

  // なでしこの関数をカスタマイズ
  function setupNako3 () {
    win.reporter = {
      results: [],
      addResult: function (o) {
        this.results.push(o)
        document.getElementById('json').innerHTML = toHtml(JSON.stringify(this.getResult()))
      },
      getResult: function () {
        return this.results
      },
      reset: function () {
        this.results = []
        document.getElementById('json').innerHTML = ''
      }
    }
    nako3.setFunc('表示', [['と', 'を']], function (s) {
      const e = document.getElementById('info')
      e.value += (e.value.length > 0 ? '\n' : '') + s // toHtml(s).replace('\n', '<br>')
    })
    nako3.setFunc('報告', [['と', 'を']], function (o) {
      win.reporter.addResult(o)
    })
  }

  // 簡易DOMアクセス関数など
  function runBox () {
    const src = document.getElementById('src_box').value
    try {
      nako3vm = nako3._runEx(src, 'editor.nako3', { resetEnv: false, resetAll: false }, '', nako3vm)
    } catch (e) {
      document.getElementById('errName').innerHTML = e.name.replace('\n', '<br>\n')
      document.getElementById('errMessage').innerHTML = e.message.replace('\n', '<br>\n')
    }
  }

  function resetBox () {
    document.getElementById('info').value = ''
    document.getElementById('errName').innerHTML = ''
    document.getElementById('errMessage').innerHTML = ''
    document.getElementById('json').innerHTML = ''
    window.reporter.reset()
    nako3._runEx('', 'editor_reset.nako3', { resetEnv: true, resetAll: true }, '', nako3vm)
    nako3vm = null
    const cv = document.getElementById('turtle_cv')
    if (cv) {
      cv.getContext('2d').clearRect(0, 0, cv.width, cv.height)
    }
    const div = document.getElementById('turtle3d_div')
    if (div) {
      div.innerHtml = ''
    }
  }

  win.addEventListener('DOMContentLoaded', function () {
    nako3 = navigator.nako3
    const runButton = document.getElementById('run_button')
    runButton.addEventListener('click', runBox)
    const resetButton = document.getElementById('reset_button')
    resetButton.addEventListener('click', resetBox)
    setupNako3()
  })
})(window)
