const TestEnv = require('./test_utils').TestEnv

describe('plugin_webworker_test', () => {
  const env = new TestEnv()
  before(function () {
    env.getEnv()
  })

  it('web worker basic', (done) => {
    const code = `Wは「/release/wnako3webworker.js」をワーカー起動
WにNAKOワーカーハンドラ設定
WからNAKOワーカーデータ受信した時には、
　受信データを報告
　Wをワーカー終了
ここまで
WからNAKOワーカー表示した時には、
　受信データを報告
ここまで

Wで「"かかかかか"を表示する;"<>?"をHTML変換して表示する;"おわり"をNAKOワーカーデータ送信」をNAKOワーカープログラム起動
`
    env.waitCmpReport(done, code, ['かかかかか', '&lt;>?', 'おわり'])
  })

  it('web worker transport', (done) => {
    const code = `Wは「/release/wnako3webworker.js」をワーカー起動
WにNAKOワーカーハンドラ設定
WからNAKOワーカーデータ受信した時には、
　受信データを報告
　WをNAKOワーカー終了
ここまで
WからNAKOワーカー表示した時には、
　受信データを報告
ここまで

ワーカー側値は「おわり」
●ワーカ内処理とは
　NAKOワーカーデータ受信した時には、
　　受信データを表示
　　「<>?」をHTML変換して表示する
　　ワーカー側値をNAKOワーカーデータ送信
　ここまで
ここまで

Wに["ワーカ内処理","ワーカー側値"]をNAKOワーカー転送
ワーカー側値は「始まり」

Wで「ワーカ内処理する」をNAKOワーカープログラム起動
Wに「あいうえお」をNAKOワーカーデータ送信
`
    env.waitCmpReport(done, code, ['あいうえお', '&lt;>?', 'おわり'])
  })
})
