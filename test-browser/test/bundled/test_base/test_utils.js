const TestEnv = (function() {
  const TestEnv = function() {
    if(!(this instanceof TestEnv)) {
        return new TestEnv()
    }
    this.waittime = 1000
    this.ui = {}
  }

  const p = TestEnv.prototype
  p.createMouseEvent = (function () {
    try {
      new MouseEvent('test')
      return function (eventType, params) {
        return new MouseEvent(eventType, params)
      }
    } catch (ex) {
      return function (eventType, params) {
        params = params || { bubbles: false, cancelable: false }
        var mouseEvent = document.createEvent('MouseEvent')
          mouseEvent.initMouseEvent(eventType,
          params.bubbles,
          params.cancelable,
          window,
          0,
          params.screenX || 0,
          params.screenY || 0,
          params.clientX || 0,
          params.clientY || 0,
          params.ctrlKey || false,
          params.altKey || false,
          params.shiftKey || false,
          params.metaKey || false,
          params.button || 0,
          params.relatedTarget || null
        );
        return mouseEvent
      }
    }
  })()

  p.getEnv = function () {
    this.ui.ta = document.getElementById('src_box')
    this.ui.run = document.getElementById('run_button')
    this.ui.reset = document.getElementById('reset_button')
    this.ui.json = document.getElementById('json')
    this.ui.info = document.getElementById('info')
    this.ui.err_name = document.getElementById('errName')
    this.ui.err_message = document.getElementById('errMessage')
  }
  p.checkEnv = function () {
    assert.exists(this.ui.ta, "エディタ(TextArea)がありません")
    assert.exists(this.ui.run, "実行ボタンがありません")
    assert.exists(this.ui.reset, "リセットボタンがありません")
    assert.exists(this.ui.info, "表示の出力場所がありません")
    assert.exists(this.ui.json, "報告の出力場所がありません")
    assert.exists(this.ui.err_name, "エラーの名称の出力場所がありません")
    assert.exists(this.ui.err_message, "エラーのメッセージの出力場所がありません")
  }
  p.setCode = function (code) {
    this.ui.ta.value = code
  }
  p.getInfo = function () {
    return this.ui.info.value
  }
  p.getReport = function () {
    const s = this.getReportAsJson()
    if (s==="") return ""
    if (window.JSON) {
      return JSON.parse(s)
    }
    return eval(s)
  }
  p.getReportAsJson = function () {
    return this.ui.json.innerText
  }
  p.getErrorName = function () {
    return this.ui.err_name.innerText
  }
  p.getErrorMessage = function () {
    return this.ui.err_message.innerText
  }
  p.getError = function () {
    return {
      name: this.getErrorName(),
      message: this.getErrorMessage()
    }
  }
  p.clickButton = function (button) {
    const evt = this.createMouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      button: 0,
      buttons: 1
    })
    return button.dispatchEvent(evt)
  }
  p.clickRun = function () {
    this.clickButton(this.ui.run)
  }
  p.clickReset = function () {
    this.clickButton(this.ui.reset)
  }
  p.checkError = function (expected) {
    const rslt = this.getError()
    if (rslt != null) {
      if (expected.name) {
        if (expected.name instanceof RegExp) {
          assert.match(rslt.name, expected.name, "エラーの名前がマッチしませんでした")
        } else {
          assert.strictEqual(rslt.name, expected.name, "エラーの名前が一致しませんでした")
        }
      }
      if (expected.message) {
        if (expected.message instanceof RegExp) {
          assert.match(rslt.message, expected.message, "エラーのメッセージがマッチしませんでした")
        } else {
          assert.strictEqual(rslt.message, expected.message, "エラーのメッセージが一致しませんでした")
        }
      }
    } else {
      assert.fail('errorが存在しません。')
    }
  }
  p.checkReport = function (expected) {
    const rslt = this.getReport()
    if (rslt != null) {
      assert.deepStrictEqual(rslt, expected)
    } else {
      assert.fail('reportが存在しません。')
    }
  }
  p.checkInfo = function (expected) {
    const rslt = this.getInfo()
    if (rslt != null) {
      assert.strictEqual(rslt, expected)
    } else {
      assert.fail('infoが存在しません。')
    }
  }
  p.waitCmp = function (done, check, expected) {
    const self = this
    setTimeout(function() {
      (function (self) {
        try {
          check.call(self, expected)
          done()
        } catch (err) {
          done(err)
        }
      })(self)
    }, this.waittime)
  }
  p.runWaitCmp = function (done, check, code, expected) {
    this.clickReset()
    this.setCode(code)
    this.clickRun()
    this.waitCmp(done, check, expected)
  }
  p.waitCmpError = function (done, code, expected) {
    this.runWaitCmp(done, this.checkError, code, expected)
  }
  p.waitCmpReport = function (done, code, expected) {
    this.runWaitCmp(done, this.checkReport, code, expected)
  }
  p.waitCmpInfo = function (done, code, expected) {
    this.runWaitCmp(done, this.checkInfo, code, expected)
  }
  p.runCmp = function (check, code, expected) {
    this.clickReset()
    this.setCode(code)
    this.clickRun()
    check.call(this, expected)
  }
  p.cmpInfo = function (code, expected) {
    this.runCmp(this.checkInfo, code, expected)
  }
  p.cmpReport = function (code, expected) {
    this.runCmp(this.checkReport, code, expected)
  }
  p.cmpError = function (code, expected) {
    this.runCmp(this.checkError, code, expected)
  }

  return TestEnv
})()

module.exports = {
  TestEnv: TestEnv
}
