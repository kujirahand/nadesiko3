# なでしこ3 - 開発環境のセットアップ方法

Node.jsをインストールしておく。

コマンドラインから以下を実行して、必要なライブラリをインストール。

```
$ npm install --no-optional
```

コマンドラインから以下のコマンドを実行することで、ソースコードを自動ビルドできる。

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

なお、なでしこ3ではEditorConfig (詳しくは[どんなエディタでもEditorConfigを使ってコードの統一性を高める - Qiita](http://qiita.com/naru0504/items/82f09881abaf3f4dc171)を参照) に対応している。

## コマンドラインからなでしこを使う方法

なでしこ3では、コマンドラインからなでしこを実行できる、cnako3(Windowsは、cnako3.bat)というスクリプトを用意しています。今後、なでしこの各種バッチファイルは、なでしこ自身で記述されます。

環境変数に、このREADME.mdのパスを、NAKO_HOMEとして登録し、パスを NAKO_HOME/src に通してください。以下、macOS/Linuxでの.bashrcの記述例です。

```
HOME=/Users/kujira
export NAKO_HOME=$HOME/nadesiko3/src/lang
export PATH=$PATH:$NAKO_HOME/src
```

### コマンドライン版なでしこの利用方法

なでしこのコマンド一覧ファイルを生成するバッチを実行する。

```
$ cnako3 $NAKO_HOME/batch/pickup_command.nako
```
