# 日本語プログラミング言語「なでしこ3」

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE) [![npm version](https://badge.fury.io/js/nadesiko3.svg)](https://www.npmjs.com/package/nadesiko3) ![Node.js CI](https://github.com/kujirahand/nadesiko3/workflows/Node.js%20CI/badge.svg)

## 「なでしこ3」とは

「なでしこ3」とは、日本語のプログラミング言語です。HTML5/JavaScriptをベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。

日本語プログラミング言語は、読みやすく理解しやすいのが特徴で、初めてでも楽しくプログラミングを覚えることができます。また、バッチ処理や定型処理などを手軽に記述できます。

- [なでしこのWebサイト](https://nadesi.com/top/)
  - [なでしこ3のWebサイト](https://nadesi.com/doc3/)
  - [なでしこ3(GitHub Pages)](https://kujirahand.github.io/nadesiko3/)

## 対応機器/ブラウザ

[doc/browsers.md](doc/browsers.md) をご覧ください。

## ブラウザで利用する場合

以下、Webエディタ上で、なでしこを実行できます。

- [なでしこ3簡易エディタ](https://nadesi.com/doc3/index.php?%E3%81%AA%E3%81%A7%E3%81%97%E3%81%933%E7%B0%A1%E6%98%93%E3%82%A8%E3%83%87%E3%82%A3%E3%82%BF)
  - [なでしこ3貯蔵庫(プログラム一覧)](https://n3s.nadesi.com/)
  - [なでしこエディタの一覧](https://nadesi.com/doc3/index.php?%E3%81%AA%E3%81%A7%E3%81%97%E3%81%933%E3%82%A8%E3%83%87%E3%82%A3%E3%82%BF%E3%81%AE%E4%B8%80%E8%A6%A7)

## 各OSごとに利用する方法

なでしこ3をPC向けにローカル環境で動作させることも可能です。

- [OS別のインストール方法](https://nadesi.com/doc3/index.php?OS%E5%88%A5)

### Windowsで利用する

以下のリンクを開いて、「Source code(zip)」をクリックしてダウンロードします。
これは、Node.jsや必要なモジュール一式を梱包したものです。

- [なでしこ3のWindows配布パッケージ](https://github.com/kujirahand/nadesiko3win32/releases)

解凍したら「nako3edit.vbs」(PC版)または「start.vbs」(Web版)をクリックします。すると、なでしこエディタが起動します。

### npm でインストール

先にNode.jsをインストールします。
次いで、コマンドラインから以下のコマンドを実行します。

```
npm install -g nadesiko3
```

すると、cnako3というコマンドで、なでしこを利用できます。

```
# なでしこのサーバーを起動
$ npm start
# なでしこエディタ(PC版)を起動
$ npm run nako3edit
# なでしこエディタ(WEB版)を起動
$ npm run nako3server
```

### Gitからインストール

また、以下のコマンドを実行すると、ブラウザ上になでしこの簡易エディタが起動します。

```
git clone https://github.com/kujirahand/nadesiko3.git
cd nadesiko3
npm install
```

#### 追加インストール(macOS/Linux)

必要に応じて以下のコマンドをインストールします。

macOS:

```
# 『圧縮』『解凍』命令のために
brew install p7zip
```

Ubuntu/Debian:

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

## GUI(Electron)を使う

Electronを使うと手軽にGUIを構築できます。Electronについては、[doc/SETUP.md](doc/SETUP.md)を参考にしてください。

## なでしこ3の開発に参加する

なでしこ3自身を開発するために、開発環境を整えようという方は、 [doc/SETUP.md](doc/SETUP.md) をご覧ください。
また、なでしこ3開発者向けの[Gitter](https://gitter.im/nadesiko3/community)への参加も可能です。
