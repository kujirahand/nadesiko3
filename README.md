# 日本語プログラミング言語「なでしこ3」

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE) [![Maintainability](https://api.codeclimate.com/v1/badges/5572db59aa6164217d30/maintainability)](https://codeclimate.com/github/kujirahand/nadesiko3/maintainability) [![npm version](https://badge.fury.io/js/nadesiko3.svg)](https://badge.fury.io/js/nadesiko3)

## 「なでしこ3」とは？

「なでしこ3」とは、日本語のプログラミング言語です。HTML5/JavaScriptをベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。

日本語プログラミング言語は、読みやすく理解しやすいのが特徴で、初めてでも楽しくプログラミングを覚えることができます。また、バッチ処理や定型処理などを手軽に記述できます。

- [なでしこ3のWebサイト](https://nadesi.com/doc3/)

## 対応機器/Webブラウザ

* Webブラウザ
	* モバイル
		* Chrome for Android
			* 79
		* Firefox for Android
			* 68
		* QQ Browser
			* 1.2
		* UC Browser for Android
			* 12.12
		* Android Browser
			* 76
		* Baidu Browser
			* 7.12
		* iOS Safari
			* 13.3
			* 13.2
			* 13.0-13.1
			* 12.2-12.4
			* 12.0-12.1
			* 11.3-11.4
			* 10.3
		* KaiOS Browser
			* 2.5
		* Opera Mini
			* all
		* Opera Mobile
			* 46
		* Samsung Internet
			* 10.1
			* 9.2
	* PC
		* Chrome
			* 80
			* 79
			* 78
			* 49
		* Edge
			* 80
			* 79
			* 18
		* Firefox
			* 72
			* 71
			* 68
		* Internet Explorer
			* 11
		* Opera
			* 66
			* 65
		* Safari
			* 13
			* 12.1
* PC (Windows/macOS/Linux)
	* Node
		* 13.8.0
		* 12.16.0
		* 10.19.0

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
