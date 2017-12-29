# なでしこv3のリリース手順

なでしこv3の最新版を、Webにアップするまでの備忘録です。いつも、手順飛ばしてしまうので、忘れないようにメモ。特に、npm publishの部分とか。

## 1.GitHubのリリース機能を使う

ただし、リリース前（コミット前）には、必ず、mochaを実行して、テストが成功するか確認する。

```
mocha test
```

よくエラーが出る部分で、「ナデシコバージョン」で問題があれば、package.json の version 値と src/plugin_system.js の変数番号が合っているかを確認する。

## 2.webpackで必要なファイルをビルドする

リリース用にwebpackでパックしたソースを生成する(/releaseに生成物が作られる)。

```
npm run build
```

## 3.npmにpublish

package.jsonのバージョン番号を更新したことを確認する。npm publishでnpmで公開する。

```
npm publish
```

## 4.WEBにアップロード

その後、生成物をWebにアップロード。

https://nadesi.com/v3/(バージョン番号)/ へ、最新版を転送する

``TODO`` --- この部分、結構面倒くさいので、何か良い方法を考える

## 5.Webサイトで最新版を告知

リリース内容を告知する。



