# なでしこv3のリリース手順

なでしこv3の最新版を、Webにアップするまでの備忘録です。いつも、手順飛ばしてしまうので、忘れないようにメモ。特に、npm publishの部分とか。

## 1.GitHubのリリース機能を使う

ただし、リリース前（コミット前）には、必ず、テストを実行して、テストが成功するか確認する。

```
npm test
```

なお、よくエラーが出る部分で、「ナデシコバージョン」で問題があれば、package.json の version 値と src/plugin_system.js の変数番号が合っているかを確認する。

## 2.必要なファイルをビルドする

まず、リリース用にwebpackでパックしたソースを生成する(/releaseに生成物が作られる)。

```
npm run build
```

次に、命令一覧を生成する。

```
npm run build:command
```

対応ブラウザを更新する。

```
npm run build:browsers
```

Windows用のリポジトリ生成のためにファイルをnadesiko3win32へコピーする。ただし、事前準備として、 `git clone` でnadesiko3win32のリポジトリを取得しておく必要がある。

```
npm run build:win32
bash ./win32.bash
```

## 3.npmにpublish

package.jsonのバージョン番号を更新したことを確認する。npm publishでnpmで公開する。

```
npm publish
```

## 4.WEBにアップロード

必要なら、WEB(nadesi.com/doc3)の簡易エディタを最新版に更新する。

## 5.Webサイトで最新版を告知

リリース内容を告知する。



