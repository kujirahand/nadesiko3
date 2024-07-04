# なでしこv3のリリース手順

なでしこv3の最新版を、Webにアップするまでの備忘録です。いつも、手順飛ばしてしまうので、忘れないようにメモ。特に、npm publishの部分とか。

## 1.GitHubのリリース機能を使う

ただし、リリース前（コミット前）には必ずビルドとテストを実行して、テストが成功するか確認する。

```sh
npm run build
npm test
npm run test:all
```

## 2.ファイルのビルドについて

リリース用にesbuildでパックしたソースを生成する(/releaseに生成物が作られる)。

```sh
npm run build
```

自動生成されるファイルを削除する場合には、以下のコマンドを実行する。

```sh
npm run clean
```


必要に応じて対応ブラウザを更新する。
(以前は`npm run build`に含めていた。しかし、OSによって異なる値を出力するため手動に変更した。 #1211)

```sh
npm run build:browsers
```

## 3.npmにpublish

package.jsonのバージョン番号を更新したことを確認する。npm publishでnpmに公開する。

```sh
npm publish
```

## 4.Webにアップロード

Webの簡易エディタを最新版に更新する。

- [なでしこ3のサイト](https://nadesi.com/doc3/)
- [マニュアル](https://nadesi.com/doc3/)
- [貯蔵庫](https://n3s.nadesi.com/)

## 5.Windowsバイナリ版のアップロード

Windows用のリポジトリ生成のためにファイルをnadesiko3win32へコピーする。ただし、事前準備として、 `git clone` でnadesiko3win32のリポジトリを取得しておく必要がある。

```sh
npm run build:win32
bash ./win32.bash
```

nadesiko3win32のフォルダに移動。

```sh
cd ../nadesiko3win32
```

なお、Windowsで実行してモジュールの最新版を取得。

```sh
nodejs\npm install --production
nodejs\npm audit fix
```

次に、7zipでモジュールを固める。

```sh
bin\7z  -mx=9 a node_modules.7z node_modules
```

最後にGitへアップする。

```sh
git commit -a
git push
```
