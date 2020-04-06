# 日本語プログラミング言語「なでしこ3」

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE) [![Maintainability](https://api.codeclimate.com/v1/badges/5572db59aa6164217d30/maintainability)](https://codeclimate.com/github/kujirahand/nadesiko3/maintainability) [![npm version](https://badge.fury.io/js/nadesiko3.svg)](https://badge.fury.io/js/nadesiko3)

## 「なでしこ3」とは？

「なでしこ3」とは、日本語のプログラミング言語です。HTML5/JavaScriptをベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。

日本語プログラミング言語は、読みやすく理解しやすいのが特徴で、初めてでも楽しくプログラミングを覚えることができます。また、バッチ処理や定型処理などを手軽に記述できます。

- [なでしこ3のWebサイト](https://nadesi.com/doc3/)

## 対応機器/Webブラウザ

[doc/browsers.md](doc/browsers.md) をご覧ください。

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

解凍したら「nako3edit.vbs」(PC版)または「start.vbs」(Web版)をクリックします。すると、なでしこエディタが起動します。

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
sudo apt install p7zip-full
# 『キー送信』命令のために
sudo apt install xdotool
```

全てのコマンドが正しく動くかを確認するには、以下のコマンドを実行します。

```
npm test
```

## なでしこ3の開発に参加する

なでしこ3自身を開発するために、開発環境を整えようという方は、 [doc/SETUP.md](doc/SETUP.md) をご覧ください。
また、なでしこ3開発者向けの[Gitter](https://gitter.im/nadesiko3/community)への参加も可能です。
