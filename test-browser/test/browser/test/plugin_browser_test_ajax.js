import { CompareUtil, retry, assert } from './compare_util.js'

export default (nako) => {
  const cu = new CompareUtil(nako)

  describe('ajax通信', () => {
    it('POSTデータ生成', () => {
      const code = `
パラメータは空オブジェクト。
パラメータ["KEY"]は、「VALUE」。
パラメータ["_X"]は、「XE^ZA」。
パラメータ["SPACE"]は、「 」。
パラメータをPOSTデータ生成してJSONエンコードして表示する。
`
      cu.cmp(code, '"KEY=VALUE&_X=XE%5EZA&SPACE=%20"')
    })

    it('AJAXオプション設定', () => {
      const code = `
パラメータは空オブジェクト。
パラメータ["KEY"]は、「VALUE」。
パラメータにAJAXオプション設定する。
AJAXオプションをJSONエンコードして表示する。
`
      cu.cmp(code, '{"KEY":"VALUE"}')
    })

    it('AJAX送信時', async () => {
      const originalAlert = window.alert
      const calls = []
      window.alert = (...a) => { calls.push(a) }
      try {
        const code = 'ダイアログ方式=「ブラウザ」\n「/custom/ok」へAJAX送信時には;対象をJSONエンコードして言う;ここまで'
        nako.logger.debug('code=' + code)
        nako.run(code)

        await retry(() => { assert.deepEqual(calls, [['"OK"']]) })
      } finally {
        window.alert = originalAlert
      }
    }).timeout(10000)

    it('POST送信時', async () => {
      const originalAlert = window.alert
      const calls = []
      window.alert = (...a) => { calls.push(a) }
      try {
        const code = `
ダイアログ方式=「ブラウザ」
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
パラメータを「/custom/echo/json」へPOST送信時には
対象を言う
ここまで
`
        nako.logger.debug('code=' + code)
        nako.run(code)

        await retry(() => { assert.deepEqual(calls, [['"param1=data1%5E&param2=data2%5E%5E"']]) })
      } finally {
        window.alert = originalAlert
      }
    }).timeout(10000)

    it('POSTフォーム送信時', async () => {
      const originalAlert = window.alert
      const calls = []
      window.alert = (...a) => { calls.push(a) }
      try {
        const code = `
ダイアログ方式=「ブラウザ」
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
パラメータを「/custom/echo/json」へPOSTフォーム送信時には
対象を言う
ここまで
`
        nako.logger.debug('code=' + code)
        nako.run(code)

        await retry(() => { assert.deepEqual(calls, [['{"param1":"data1^","param2":"data2^^"}']]) })
      } finally {
        window.alert = originalAlert
      }
    }).timeout(10000)

    // 「逐次実行/次に」構文は廃止済みのため、同等確認は「〜送信時」系ケースで担保する
    it.skip('AJAX送信', () => {})
    it.skip('POST送信', () => {})
    it.skip('POSTフォーム送信', () => {})
  })
}
