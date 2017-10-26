# なでしこv3のリリース手順

## 1.GitHubのリリース機能を使う

ただし、リリース前（コミット前）には、必ず、mochaを実行して、テストが成功するか確認する。

```
mocha test
```
## 2.npmにpublish

package.jsonのバージョン番号を更新したことを確認する。npm publishでnpmで公開する。

```
npm publish
```

## 3.Webサイトに最新版を配置

リリース用にwebpackでパックしたソースを生成する(/releaseに生成物が作られる)。

```
npm run build
```

その後、生成物をWebにアップロード。

https://nadesi.com/v3/(バージョン番号)/ へ、最新版を転送する

``TODO`` --- この部分、結構面倒くさいので、何か良い方法を考える

## 4.Webサイトで最新版を告知

リリース内容を告知する。



