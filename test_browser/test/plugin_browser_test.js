import NakoCompiler from '../../src/nako3.js'
import PluginBrowser from '../../src/plugin_browser.js'

import browserTestColor from './plugin_browser_test_color.js'
import browserTestSystem from './plugin_browser_test_system.js'
import browserTestDialog from './plugin_browser_test_dialog.js'
import browserTestAjax from './plugin_browser_test_ajax.js'
import browserTestDomEvent from './plugin_browser_test_dom_event.js'
import browserTestDomParts from './plugin_browser_test_dom_parts.js'

class CallReport {
  constructor (nako) {
    this.funcCalled = false
    this.rslt = []
    nako.addFunc('報告', [['を']], (msg) => {
      this.funcCalled = true
      this.rslt.push(msg)
    })
  }

  reset () {
    this.funcCalled = false
    this.rslt = []
  }

  get isCalled () {
    return this.funcCalled
  }

  get messages () {
    return this.rslt
  }

  getMessageAsJson () {
    return JSON.stringify(this.rslt)
  }
}


describe('plugin_browser_test', () => {
  const nako = new NakoCompiler()
  nako.addPluginFile('PluginBrowser', 'plugin_browser.js', PluginBrowser)
  window.cr = new CallReport(nako)

  browserTestColor(nako)
  browserTestSystem(nako)
  browserTestDialog(nako)
  browserTestAjax(nako)
  browserTestDomEvent(nako)
  browserTestDomParts(nako)
})
