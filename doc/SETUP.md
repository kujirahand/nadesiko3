# なでしこ3 - 開発環境のセットアップ方法

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](http://standardjs.com)

[Node.js](https://nodejs.org/ja/)をインストールしておく。

コマンドラインから以下を実行して、必要なライブラリをシステムにインストール。

このとき、npm installするときに、なでしこのモジュールで、Native Add-onを使うものがあるため、ビルド環境を整える必要がある。

【Windows】であれば、コンパイル環境が必要になるので、ビルドツールをインストールする。PowerShellから以下のコマンドを実行すると、自動的に必要なツールが入る。(Windowsのユーザー名に日本語が使われているとうまくコンパイルできないという情報もあるので注意。)

また、Gitなどのツールをインストールするために、Chocolatey(https://chocolatey.org/)をインストールしておく。

```
# Chocolatey でGitをインストール
cinst git

# npm のビルドツール (build tools+python2)
npm install -g node-gyp
npm install -g windows-build-tools
```

【macOS】でもHomebrew(そしてXcode)をインストールしておくと安心。

【共通】以下、共通の作業となる。(electron と asar は GUIをやるときに追加。ネット回線が細い人は抜かして実行しても良い)

```
$ npm install -g npm-check-updates electron asar
```

コマンドラインから以下を実行して、nadesiko3のリポジトリをcloneし、必要なライブラリをインストール。

```
$ git clone https://github.com/kujirahand/nadesiko3
$ cd nadesiko3
$ npm install --no-optional
```

コマンドラインから以下のコマンドを実行することで、ソースコードをビルドできる。
これは、srcディレクトリの中のコードを編集すると、releaseディレクトリに結果が出力されるものだ。

```
# Node.js用のソースコードをWeb用のJSに変換
$ npm run build
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

また、EditorConfig (詳しくは[どんなエディタでもEditorConfigを使ってコードの統一性を高める - Qiita](http://qiita.com/naru0504/items/82f09881abaf3f4dc171)を参照) に対応しているので、これに対応したエディタを使用することで、開発者側が意識することなくインデントやタブに関する規則に対応することが可能。

### ATOMエディタ用のなでしこシンタックスハイライト

``misc/atom-packages/language-nako3`` にATOMエディタ用のハイライトパッケージがある。
使い方は、[README.md](misc/atom-packages/language-nako3/README.md)を参照のこと。

## コマンドラインからなでしこを使う方法

なでしこ3では、コマンドラインからなでしこを実行できる、cnako3(Windowsは、cnako3.bat)というスクリプトを用意。今後、なでしこの各種バッチファイルは、なでしこ自身で記述される。

ちなみに、``npm install -g nadeisko3`` を実行すると、npmコマンドでcnako3コマンドが利用できるようになるが、それは安定版のなでしこがインストールされる。

そこで、環境変数に、本ファイルのパスを、NAKO_HOMEとして登録し、パスを NAKO_HOME/src に通す。以下、macOS/Linuxでの.bashrcの記述例。(ユーザー名がkujiraの場合)

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

## Gitからリポジトリを取得して利用する場合

最低限のライブラリで良い場合には、``npm install --production``を実行するだけ。 

```
$ git clnone https://github.com/kujirahand/nadesiko3.git
$ cd nadesiko3
$ npm install --production
```


