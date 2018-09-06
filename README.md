# 日本語プログラミング言語「なでしこ3」

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE) [![Maintainability](https://api.codeclimate.com/v1/badges/5572db59aa6164217d30/maintainability)](https://codeclimate.com/github/kujirahand/nadesiko3/maintainability)

## 「なでしこ3」とは？

「なでしこ3」とは、日本語のプログラミング言語です。HTML5/JavaScriptをベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。

日本語プログラミング言語は、読みやすく理解しやすいのが特徴で、初めてでも楽しくプログラミングを覚えることができます。また、バッチ処理や定型処理などを手軽に記述できます。

- [なでしこ3のWebサイト](https://nadesi.com/doc3/)

## 対応機器/Webブラウザ

- Webブラウザ ([browserl.ist](http://browserl.ist/?q=>+0.5%25%2C+>+0.5%25+in+JP%2C+last+2+versions%2C+Firefox+ESR%2C+not+dead)参照)
- PC (Windows/macOS/Linux - Node.jsが動く環境)

## Webブラウザで利用する場合

以下、Webエディタ上で、なでしこを実行できます。

- [なでしこ3簡易エディタ](https://nadesi.com/doc3/go.php?10)
- [なでしこエディタの一覧](https://nadesi.com/doc3/go.php?282)

## PCで利用する場合

なでしこ3をPC向けにローカル環境で動作させることも可能です。

### Windowsで利用する

以下のリンクを開いて、「Source code(zip)」をクリックしてダウンロードします。
これは、Node.jsや必要なモジュール一式を梱包したものです。

- [なでしこ3のWindows配布パッケージ](https://github.com/kujirahand/nadesiko3win32/releases)

ただし、一部のZIP解凍ツールでエラーが出るようです。[LhaForge](https://forest.watch.impress.co.jp/library/software/lhaforge/)などのツールを利用して解凍してください。解凍したら「nakopad.vbs」(PC版)または「nako3server.vbs」(Web版)をクリックして、なでしこエディタを起動できます。

### macOS/Linuxで利用する

先に、Node.jsをインストールし、次いで、コマンドラインから以下のコマンドを実行します。

```
# npmでなでしこ3をインストールする
$ npm install -g nadesiko3
```

すると、cnako3というコマンドで、なでしこを利用できます。
また、以下のコマンドを実行すると、ブラウザ上になでしこの簡易エディタが起動します。

```
# なでしこエディタ(PC版)を起動
$ nako3edit
# なでしこエディタ(WEB版)を起動
$ nako3server
```

### 追加インストール(macOS/Linux)

必要に応じて以下のコマンドをインストールします。

macOS

```
# 『圧縮』『解凍』命令のために
brew install p7zip
```

Ubuntu/Debian

```
# 『圧縮』『解凍』命令のために
sudo apt-get install p7zip-full
# 『キー送信』命令のために
sudo apt-get install xdotool
```

全てのコマンドが正しく動くかを確認するには、以下のコマンドを実行します。

```
npm test
```

## なでしこ3の開発環境をセットアップ

なでしこ3自身を開発するために、開発環境を整えようという方は、 [doc/SETUP.md](doc/SETUP.md) をご覧ください。
