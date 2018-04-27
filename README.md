# 日本語プログラミング言語「なでしこ3」

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE) [![Maintainability](https://api.codeclimate.com/v1/badges/5572db59aa6164217d30/maintainability)](https://codeclimate.com/github/kujirahand/nadesiko3/maintainability)

## 「なでしこ3」とは？

「なでしこ3」とは、日本語のプログラミング言語です。HTML/JavaScriptをベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。

- [なでしこ3のWebサイト](https://nadesi.com/doc3/)

## 対応機器/Webブラウザ

- HTML5対応ブラウザ (Internet Explorer 11 / Safari / Chrome / Firefox 等)
- スマホブラウザ (iOS Safari / Android標準ブラウザ)
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

- [配布パッケージ](https://github.com/kujirahand/nadesiko3win32/releases)

解凍したら「nakopad.vbs」(PC版)または「nako3server.vbs」(Web版)をクリックして、なでしこエディタを起動できます。

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

## なでしこ3の開発環境をセットアップ

なでしこ3自身を開発するために、開発環境を整えようという方は、 [doc/SETUP.md](doc/SETUP.md) をご覧ください。
