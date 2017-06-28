# なでしこ3 - 開発環境のセットアップ方法

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](http://standardjs.com)

Node.jsをインストールしておく。

コマンドラインから以下を実行して、必要なライブラリをインストール。

```
$ npm install -g npm-check-updates electron asar
$ npm install --no-optional
```

コマンドラインから以下のコマンドを実行することで、ソースコードをビルドできる。

```
# PEG文法からなでしこ言語のパーサーを生成
$ npm run build:parser
# Node.js用のソースコードをWeb用のJSに変換
$ npm run build
```

開発時は、監視ビルドさせることができる。

```
$ npm run watch
```

srcディレクトリの中のコードを編集すると、releaseディレクトリに結果が出力される。

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

また、EditorConfig (詳しくは[どんなエディタでもEditorConfigを使ってコードの統一性を高める - Qiita](http://qiita.com/naru0504/items/82f09881abaf3f4dc171)を参照) に対応しているので、これに対応したエディタを使用することで、開発者側が意識することなくインデントやタブに関する規則に対応することが可能。

### ATOMエディタ用のなでしこシンタックスハイライト

``misc/atom-packages/language-nako3`` にATOMエディタ用のハイライトパッケージがある。
使い方は、[README.md](misc/atom-packages/language-nako3/README.md)を参照のこと。

## コマンドラインからなでしこを使う方法

なでしこ3では、コマンドラインからなでしこを実行できる、cnako3(Windowsは、cnako3.bat)というスクリプトを用意。今後、なでしこの各種バッチファイルは、なでしこ自身で記述される。

環境変数に、本ファイルのパスを、NAKO_HOMEとして登録し、パスを NAKO_HOME/src に通す。以下、macOS/Linuxでの.bashrcの記述例。

```
HOME=/Users/kujira
export NAKO_HOME=$HOME/nadesiko3
export PATH=$PATH:$NAKO_HOME/src
```

### コマンドライン版なでしこの利用方法

なでしこのコマンド一覧ファイルを生成するバッチを実行する。

```
$ cnako3 $NAKO_HOME/batch/pickup_command.nako
```

### デモプログラムを動かす方法

demoディレクトリに、なでしこをWebブラウザから使うデモがある。

大抵の機能は、WebブラウザにHTMLファイルをドラッグ＆ドロップすれば動くが、一部の機能は、ローカルサーバーを動かさないと利用することはできない。

なでしこでは、簡易サーバーを用意。コマンドラインで以下のように入力すると、[http://localhost:3000](http://localhost:3000)でサーバーが起動。

```
$ npm start
```

### コマンド一覧のビルド

プラグインのソースコードから、コマンド一覧を抽出して、command.jsonをrelaeseディレクトリに書き出す。

```
$ npm run build:command
```

### Node.jsのパッケージの更新方法

コマンドラインから以下を実行して、Node.jsのパッケージを更新。

```
$ npm-check-updates -u
$ npm update --no-optional
```

### Electron

以下のコマンドを実行することで、Electronによるなでしこが起動。

```
$ npm run electron
```

ビルドは以下のコマンドで行う。

```
$ npm run build:electron
```

ビルドしたenako3.asarを配布可能な形式にする方法については[Electronでアプリケーションを作ってみよう - Qiita](http://qiita.com/Quramy/items/a4be32769366cfe55778#配布してみる)を参照。
