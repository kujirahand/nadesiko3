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

また、なでしこ3ではEditorConfig (詳しくは[どんなエディタでもEditorConfigを使ってコードの統一性を高める - Qiita](http://qiita.com/naru0504/items/82f09881abaf3f4dc171)を参照) に対応している。
