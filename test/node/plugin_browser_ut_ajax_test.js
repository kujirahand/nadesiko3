const assert = require('assert').strict
const PluginBrowser = require('../../src/plugin_browser')
const { PluginUtHelper } = require('../../utils/plugin_ut_helper')
const fetchMock = require('fetch-mock')
const FormDataBase = require('form-data')
class FormData extends FormDataBase {
  constructor () {
    super()
    this.param_list = new Map()
  }

  set (k, v) {
    this.append(k, v)
    this.param_list.set(k, v)
  }

  get (k) {
    return this.param_list.get(k)
  }
}
global.FormData = FormData

describe('plugin_browser_ajax', () => {
  const cu = new PluginUtHelper(PluginBrowser)

  const setupSys = () => {
    const sys = {}
    sys.__v0 = {}
    sys.__v0['対象'] = ''
    sys.__v0['AJAXオプション'] = ''
    sys.__v0['AJAX:ONERROR'] = (e) => {
      assert.fail('ajax error')
    }
    sys.__findVar = function (nameStr, def) {
      if (typeof nameStr === 'function') { return nameStr }
      if (PluginBrowser[nameStr]) { return PluginBrowser[nameStr].fn }
      return def
    }
    sys.__exec = function (func, params) {
      const f = sys.__findVar(func)
      if (!f) { throw new Error('システム関数でエイリアスの指定ミス:' + func) }
      return f.apply(this, params)
    }
    sys.resolveCount = 0
    return sys
  }

  afterEach(() => {
    fetchMock.reset()
  })

  it('AJAX送信時', async () => {
    fetchMock.get(/^\/dummyutl$/, 'ajax result')

    const sys = setupSys()
    sys.__v0['AJAX:ONERROR'] = (e) => {
      assert.equal(e.message, 'unknown error')
    }

    PluginBrowser['AJAX送信時'].fn.apply(this, [() => {
      assert.equal(sys.__v0['対象'], 'ajax result')
    }, '/dummyutl', sys])
  })
  it('GET送信時 - error', async () => {
    fetchMock.get(/^\/reject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    sys.__v0.options = {
      method: 'GET'
    }
    sys.__v0['AJAX:ONERROR'] = (e) => {
      assert.equal(e.message, 'unknown error')
    }

    PluginBrowser['GET送信時'].fn.apply(this, [() => {
      assert.fail('no exception')
    }, '/reject', sys])
  })

  it('POSTデータ生成', () => {
    const param = {
      KEY: 'VALUE',
      _X: 'XE^ZA',
      SPACE: ' '
    }

    cu.cmpfn('POSTデータ生成', [param], 'KEY=VALUE&_X=XE%5EZA&SPACE=%20')
  })

  it('POST送信時', async () => {
    fetchMock.post(
      (url, opts) => {
        return (
          url === '/post' &&
          opts.body === 'param1=data1%5E&param2=data2%5E%5E'
        )
      },
      { body: 'post result' }
    )

    const sys = setupSys()

    const param = {
      param1: 'data1^',
      param2: 'data2^^'
    }

    PluginBrowser['POST送信時'].fn.apply(this, [() => {
      assert.equal(sys.__v0['対象'], 'post result')
    }, '/post', param, sys])
  })

  it('POST送信時 - error', async () => {
    fetchMock.post(/^\/postreject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    sys.__v0['AJAX:ONERROR'] = (e) => {
      assert.equal(e.message, 'unknown error')
    }

    PluginBrowser['POST送信時'].fn.apply(this, [() => {
      assert.fail('no exception')
    }, '/postreject', {}, sys])
  })

  it('POSTフォーム送信時', async () => {
    fetchMock.post(
      (url, opts) => {
        const fd = opts.body
        return (
          url === '/post' &&
          fd.get('param1') === 'data1^' &&
          fd.get('param2') === 'data2^^'
        )
      },
      { body: 'post result' }
    )

    const sys = setupSys()

    const param = {
      param1: 'data1^',
      param2: 'data2^^'
    }
    PluginBrowser['POSTフォーム送信時'].fn.apply(this, [() => {
      assert.equal(sys.__v0['対象'], 'post result')
    }, '/post', param, sys])
  })

  it('POSTフォーム送信時 - error', async () => {
    fetchMock.post(/^\/postreject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    sys.__v0['AJAX:ONERROR'] = (e) => {
      assert.equal(e.message, 'unknown error')
    }

    const param = {
      param1: 'data1^',
      param2: 'data2^^'
    }
    PluginBrowser['POSTフォーム送信時'].fn.apply(this, [() => {
      assert.fail('no exception')
    }, '/postreject', param, sys])
  })

  it('AJAX失敗時', () => {
    const sys = setupSys()
    const func = (e) => {
      return e
    }

    PluginBrowser['AJAX失敗時'].fn.apply(this, [func, sys])
    assert.equal(sys.__v0['AJAX:ONERROR'], func)
  })

  it('AJAXオプション設定', () => {
    const sys = setupSys()
    const param = {
      KEY: 'VALUE'
    }

    PluginBrowser['AJAXオプション設定'].fn.apply(this, [param, sys])
    assert.equal(sys.__v0['AJAXオプション'], param)
  })

  it('AJAX送信', async () => {
    fetchMock.get(/^\/dummyutl$/, 'ajax result')
    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = reject
      PluginBrowser['AJAX送信'].fn.apply(this, ['/dummyutl', sys])
    })
    await promise
    assert.equal(sys.__v0['対象'], 'ajax result')
  })

  it('AJAX送信 - error', async () => {
    fetchMock.get(/^\/ajaxreject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = (err) => {
        assert.equal(err, 'unknown error')
        resolve()
      }
      PluginBrowser['AJAX送信'].fn.apply(this, ['/ajaxreject', sys])
    })

    await promise
  })

  it('HTTP取得 - error', async () => {
    fetchMock.get(/^\/ajaxreject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = (err) => {
        assert.equal(err, 'unknown error')
        resolve()
      }
      PluginBrowser['HTTP取得'].fn.apply(this, ['/ajaxreject', sys])
    })

    await promise
  })

  it('AJAX送信 - error(without 逐次実行)', async () => {
    fetchMock.get(/^\/ajaxreject$/, 'ajax result')

    const sys = setupSys()
    cu.cmpfnex('AJAX送信', ['/ajaxreject', sys], 'Error', '『AJAX送信』は『逐次実行』構文内で利用する必要があります。')
  })

  it('POST送信', async () => {
    fetchMock.post(
      (url, opts) => {
        return (
          url === '/post' &&
          opts.body === 'param1=data1%5E&param2=data2%5E%5E'
        )
      },
      { body: 'post result' }
    )

    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = reject

      const param = {
        param1: 'data1^',
        param2: 'data2^^'
      }

      PluginBrowser['POST送信'].fn.apply(this, ['/post', param, sys])
    })

    await promise

    assert.equal(sys.__v0['対象'], 'post result')
  })

  it('POST送信 - error', async () => {
    fetchMock.post(/^\/ajaxreject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = (err) => {
        assert.equal(err, 'unknown error')
        resolve()
      }
      const param = {
        param1: 'data1^',
        param2: 'data2^^'
      }
      PluginBrowser['POST送信'].fn.apply(this, ['/ajaxreject', param, sys])
    })

    await promise
  })

  it('POST送信 - error(without 逐次実行)', async () => {
    fetchMock.post(/^\/ajaxreject$/, 'ajax result')

    const sys = setupSys()

    cu.cmpfnex('POST送信', ['/ajaxreject', {}, sys], 'Error', '『POST送信』は『逐次実行』構文内で利用する必要があります。')
  })

  it('POSTフォーム送信', async () => {
    fetchMock.post(
      (url, opts) => {
        const fd = opts.body
        return (
          url === '/post' &&
          fd.get('param1') === 'data1^' &&
          fd.get('param2') === 'data2^^'
        )
      },
      { body: 'post result' }
    )

    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = (err) => {
        assert.equal(err, 'unknown error')
        resolve()
      }

      const param = {
        param1: 'data1^',
        param2: 'data2^^'
      }

      PluginBrowser['POSTフォーム送信'].fn.apply(this, ['/post', param, sys])
    })

    await promise

    assert.equal(sys.__v0['対象'], 'post result')
  })

  it('POSTフォーム送信 - error', async () => {
    fetchMock.post(/^\/ajaxreject$/, { throws: new Error('unknown error') })

    const sys = setupSys()
    const promise = new Promise((resolve, reject) => {
      sys.resolve = resolve
      sys.reject = (err) => {
        assert.equal(err, 'unknown error')
        resolve()
      }
      const param = {
        param1: 'data1^',
        param2: 'data2^^'
      }
      PluginBrowser['POSTフォーム送信'].fn.apply(this, ['/ajaxreject', param, sys])
    })

    await promise
  })

  it('POSTフォーム送信 - error(without 逐次実行)', async () => {
    fetchMock.post(/^\/ajaxreject$/, 'ajax result')

    const sys = setupSys()
    cu.cmpfnex('POSTフォーム送信', ['/ajaxreject', {}, sys], 'Error', '『POSTフォーム送信』は『逐次実行』構文内で利用する必要があります。')
  })
})
