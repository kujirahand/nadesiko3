import * as td from 'testdouble'
import { CompareUtil, waitTimer, retry } from './compare_util'

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
      const windowalert = td.replace(window, 'alert')
      const code = '「/custom/ok」へAJAX送信時には;対象をJSONエンコードして言う;ここまで'
      nako.logger.debug('code=' + code)
      nako.run(code)

      await retry(() => td.verify(windowalert('"OK"'), { times: 1 }))
      td.reset()
    }).timeout(10000)

    it('POST送信時', async () => {
      const windowalert = td.replace(window, 'alert')
      const code = `
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
パラメータを「/custom/echo/json」へPOST送信時には
対象を言う
ここまで
`
      nako.logger.debug('code=' + code)
      nako.run(code)

      await retry(() => td.verify(windowalert('"param1=data1%5E&param2=data2%5E%5E"'), { times: 1 }))
      td.reset()
    }).timeout(10000)

    it('POSTフォーム送信時', async () => {
      const windowalert = td.replace(window, 'alert')
      const code = `
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
パラメータを「/custom/echo/json」へPOSTフォーム送信時には
対象を言う
ここまで
`
      nako.logger.debug('code=' + code)
      nako.run(code)

      await retry(() => td.verify(windowalert('{"param1":"data1^","param2":"data2^^"}'), { times: 1 }))
      td.reset()
    }).timeout(10000)

    it('AJAX送信', async () => {
      const windowalert = td.replace(window, 'alert')
      const code = `
逐次実行
次に、「/custom/ok/json」へAJAX送信する。
次に、対象を言う。
ここまで
`
      nako.logger.debug('code=' + code)
      nako.run(code)

      await retry(() => td.verify(windowalert('"OK"'), { times: 1 }))
      td.reset()
    }).timeout(10000)

    it('POST送信', async () => {
      const windowalert = td.replace(window, 'alert')
      const code = `
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
逐次実行
次に、パラメータを「/custom/echo/json」へPOST送信する。
次に、対象を言う。
ここまで
`
      nako.logger.debug('code=' + code)
      nako.run(code)
      await retry(() => td.verify(windowalert('"param1=data1%5E&param2=data2%5E%5E"'), { times: 1 }))
      td.reset()
    }).timeout(10000)

    it('POSTフォーム送信', async () => {
      const windowalert = td.replace(window, 'alert')
      const code = `
パラメータは空オブジェクト。
パラメータ["param1"]は、「data1^」。
パラメータ["param2"]は、「data2^^」。
逐次実行
次に、パラメータを「/custom/echo」へPOSTフォーム送信する。
次に、対象を言う。
ここまで
`
      nako.logger.debug('code=' + code)
      nako.run(code)

      await retry(() => td.verify(windowalert('{"param1":"data1^","param2":"data2^^"}'), { times: 1 }))
      td.reset()
    }).timeout(10000)
  })
}
