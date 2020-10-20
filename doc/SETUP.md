# なでしこ3 - 開発環境のセットアップ方法

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://standardjs.com/)

なでしこ3自身を開発する手順をまとめたもの。なでしこ3を使うだけならば、以下の手順は不要。

[Node.js](https://nodejs.org/ja/)をインストールしておく。

コマンドラインから以下を実行して、必要なライブラリをシステムにインストール。

このとき、npm installするときに、なでしこのモジュールで、Native Add-onを使うものがあるため、ビルド環境を整える必要がある。

## 【Windows】

コンパイル環境が必要になるので、ビルドツールをインストールする。PowerShellから以下のコマンドを実行すると、自動的に必要なツールが入る。(Windowsのユーザー名に日本語が使われているとうまくコンパイルできないという情報もあるので注意)

また、Gitなどのツールをインストールするために、Chocolatey( https://chocolatey.org/ )をインストールしておく。

```
# Chocolatey でGitをインストール
cinst git

# npm のビルドツール (build tools+python2)
npm install -g node-gyp
npm install -g windows-build-tools
```

## 【macOS】

Homebrew( https://brew.sh/index_ja ) (そしてXcode)をインストールしておく。

## 【共通】

コマンドラインから以下を実行して、nadesiko3のリポジトリをcloneし、必要なライブラリをインストール。ただし、Node.jsのバージョンv10以上が必要。もし、Ubuntuで古いのNode.jsをインストールした場合など、nモジュールを利用して最新安定版のNode.jsを利用してください。


```
$ git clone https://github.com/kujirahand/nadesiko3
$ cd nadesiko3
$ npm install --no-optional
```

コマンドラインから以下のコマンドを実行することで、ソースコードをビルドできる。
srcディレクトリの中のコードを編集すると、releaseディレクトリに結果が出力される。

```
# Node.js用のソースコードをWeb用のJSに変換
$ npm run build
```

ビルド後に以下のコマンドを実行することで、 バンドルファイル内の各パッケージがどのぐらいの容量を占めているかを可視化できる。

```
# バンドルファイル内の各パッケージがどのぐらいの容量を占めているかを可視化
$ npm run analyze
```

開発時、以下のコマンドを実行すれば、監視ビルドさせることができる。

```
$ npm run watch
```


また、コマンドラインから以下のコマンドを実行することで、ソースコードをテストできる。

```
$ npm run test
```

## 開発時の約束

### コーディング規約について

コーディング規約は、[JavaScript Standard Style](https://standardjs.com/)に準拠するものとする。

ATOMエディタを使っている場合は、以下のプラグインを導入すると非常に便利。

```
apm install linter
apm install linter-js-standard
```

また、EditorConfig (詳しくは[どんなエディタでもEditorConfigを使ってコードの統一性を高める - Qiita](https://qiita.com/naru0504/items/82f09881abaf3f4dc171)を参照) に対応しています。
これに対応したエディタを使用することで、開発者側が意識することなくインデントやタブに関する規則に対応することが可能。

### ATOMエディタ用のなでしこシンタックスハイライト

``misc/atom-packages/language-nako3`` にATOMエディタ用のハイライトパッケージがある。
使い方は、[README.md](../misc/atom-packages/language-nako3/README.md)を参照のこと。

## コマンドラインからなでしこを使う方法

なでしこ3ではコマンドラインからなでしこを実行できるcnako3(Windowsは、cnako3.bat)というスクリプトを用意。今後、なでしこの各種バッチファイルはなでしこ自身で記述される。

ちなみに、``npm install -g nadeisko3`` を実行すると、npmコマンドでcnako3コマンドが利用できるようになるが、その場合は安定版のなでしこがインストールされることになる。

環境変数に本ファイルのパスをNAKO_HOMEとして登録し、パスをNAKO_HOME/srcに通す。以下、macOS/Linuxでの `.bashrc` の記述例。(ユーザー名がkujiraの場合)

```
HOME=/Users/kujira
export NAKO_HOME=$HOME/nadesiko3
export PATH=$PATH:$NAKO_HOME/src
```

### コマンドライン版なでしこの利用方法

例えば、なでしこのコマンド一覧ファイルを生成するバッチを実行する方法。

```
$ cnako3 $NAKO_HOME/batch/pickup_command.nako
```

テストを実行する場合には、 `-t` (`--test`) オプションを付与した状態でcnako3を実行し、出力されたテスト用コードをmochaで実行します。

```
$ cnako3 -t hoge.nako3
$ mocha hoge.spec.js
```

### デモプログラムを動かす方法

demoディレクトリに、なでしこをブラウザから使うデモがある。

大抵の機能はブラウザにHTMLファイルをドラッグ&ドロップすれば動くが、一部の機能はローカルサーバーを動かさないと利用できない。

なでしこでは、簡易サーバーを用意。コマンドラインで以下のように入力すると、[http://localhost:3000/](http://localhost:3000/)でサーバーが起動。

```
$ npm start
```

### コマンド一覧のビルド

プラグインのソースコードから、コマンド一覧を抽出して、command.jsonをrelaeseディレクトリに書き出す。

```
$ npm run build:command
```
### 対応機器/ブラウザの生成

コマンドラインから以下を実行して、以下のファイルを生成。
* [doc/browsers.md](browsers.md): 対応機器/ブラウザ (マークダウン形式)
* [src/browsers.md](../src/browsers.md): 対応機器/ブラウザ (マークダウン形式, cnako3用)
* [demo/browsers.html](../demo/browsers.html): 対応機器/ブラウザ (HTML形式, なでしこ3エディタ用)

```
$ npm run build:browsers
```

### Node.jsのパッケージの更新方法

コマンドラインから以下を実行して、Node.jsのパッケージを更新。

```
$ npm-check-updates -u
$ npm update --no-optional
```

### Electron

モジュールをインストールする

```
$ npm install electron
$ npm install electron-packager
```

以下のコマンドを実行することで、Electronによるなでしこが起動。

```
$ npm run electron
```

ビルドは以下のコマンドで行う。

```
$ npm run build:electron
```



## Gitからリポジトリを取得して利用する場合

最低限のライブラリで良い場合には、``npm install --production``を実行するだけ。

```
$ git clone https://github.com/kujirahand/nadesiko3.git
$ cd nadesiko3
$ npm install --production
```
