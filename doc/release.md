# なでしこv3のリリース手順

なでしこv3の最新版を、Webにアップするまでの備忘録です。いつも、手順飛ばしてしまうので、忘れないようにメモ。特に、npm publishの部分とか。

## 1.GitHubのリリース機能を使う

ただし、リリース前（コミット前）には必ずテストを実行して、テストが成功するか確認する。

```shell
npm test
```

なお、よくエラーが出る部分で「ナデシコバージョン」で問題があれば、package.jsonのversion値とsrc/plugin_system.jsの変数番号が合っているかを確認する。

## 2.必要なファイルをビルドする

まず、リリース用にwebpackでパックしたソースを生成する(/releaseに生成物が作られる)。

```shell
npm run build
```

対応ブラウザを更新する。

```shell
npm run build:browsers
```

## 3.npmにpublish

package.jsonのバージョン番号を更新したことを確認する。npm publishでnpmに公開する。

```shell
npm publish
```

## 4.Webにアップロード

必要なら、WEB(nadesi.com/doc3)の簡易エディタを最新版に更新する。

## 5.Webサイトで最新版を告知

リリース内容を告知する。

## 6.Windowsバイナリ版のアップロード

Windows用のリポジトリ生成のためにファイルをnadesiko3win32へコピーする。ただし、事前準備として、 `git clone` でnadesiko3win32のリポジトリを取得しておく必要がある。

```shell
npm run build:win32
bash ./win32.bash
```

nadesiko3win32のフォルダに移動。

```shell
cd ../nadesiko3win32
```

なお、Windowsで実行してモジュールの最新版を取得。

```shell
nodejs\npm install --production
nodejs\npm audit fix
```

次に、7zipでモジュールを固める。

```shell
bin\7z  -mx=9 a node_modules.7z node_modules
```
最後にGitへアップする。

```shell
git commit -a
git push
```

