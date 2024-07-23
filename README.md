# 日本語プログラミング言語「なでしこ3」

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
[![npm version](https://badge.fury.io/js/nadesiko3.svg)](https://www.npmjs.com/package/nadesiko3)

## 「なでしこ3」とは

「なでしこ3」とは、日本語のプログラミング言語です。HTML5/JavaScript(TypeScript)をベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。日本語プログラミング言語は、読みやすく理解しやすいのが特徴で、初めてでも楽しくプログラミングを覚えることができます。また、バッチ処理や定型処理などを手軽に記述できます。

- [なでしこのWebサイト](https://nadesi.com/)
- [マニュアル](https://nadesi.com/v3/doc/)

はじめて「なでしこ」に挑戦する方は、次のチュートリアルから始めることをオススメします。日本語プログラミング言語の雰囲気が容易に理解できます。

- [チュートリアル](https://nadesi.com/v3/doc/go.php?997)

## 対応機器/ブラウザ

なでしこ3は、JavaScriptに変換されて実行されます。そのため、JavaScriptが動作するさまざまな端末で実行できます。

1. Webブラウザ(wnako) - 主要ブラウザ(Chrome/Safari/Edge/Firefox)に対応
2. コマンドライン(cnako) - JavaScriptの実行エンジン「Node.js」上で動作
3. 配付パッケージ - Electronなどを利用してブラウザ版のなでしこをローカルPC上で動作させることも可能

対応ブラウザについて詳しくは、[対応機器/ブラウザ](doc/browsers.md) をご覧ください。

## ブラウザで利用する場合

以下、Webエディタ上で、なでしこを実行できます。

- [なでしこ3簡易エディタ](https://nadesi.com/doc3/index.php?%E3%81%AA%E3%81%A7%E3%81%97%E3%81%933%E7%B0%A1%E6%98%93%E3%82%A8%E3%83%87%E3%82%A3%E3%82%BF)
  - [なでしこ3貯蔵庫(プログラム一覧)](https://n3s.nadesi.com/)
  - [なでしこエディタの一覧](https://nadesi.com/doc3/index.php?%E3%81%AA%E3%81%A7%E3%81%97%E3%81%933%E3%82%A8%E3%83%87%E3%82%A3%E3%82%BF%E3%81%AE%E4%B8%80%E8%A6%A7)

## 各OSごとに利用する方法

なでしこ3をPC向けにローカル環境で動作させることも可能です。

- [OS別のインストール方法](https://nadesi.com/doc3/index.php?OS%E5%88%A5)

## npm でなでしこ3コマンドライン版をインストール

先にNode.jsをインストールします。
次いで、コマンドラインから次のコマンドを実行します。

```sh
npm install -g nadesiko3
```

すると、`cnako3`というコマンドで、なでしこを利用できます。

```sh
# コマンドラインからプログラムを実行
cnako3 -e "「こんにちは」と表示。"
# ソースコード hello.nako3 を実行
cnako3 hello.nako3
```

## Gitからインストール

また、次のコマンドを実行すると、なでしこの開発環境をセットアップできます。

```sh
git clone https://github.com/kujirahand/nadesiko3.git
cd nadesiko3
npm install
npm run build
```

## Ubuntuへの開発環境のセットアップ

まっさらなUbuntu22.04でなでしこ3の開発環境を整える場合は次のコマンドを実行します。

```sh
sudo apt update
# nvm で Node.js をインストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
source ~/.bashrc
nvm install v18.12.1
# リポジトリのセットアップ
git clone https://github.com/kujirahand/nadesiko3.git
cd nadesiko3
npm install
# なでしこ3のビルド
npm run build
```

## 追加インストール(macOS/Linux)

必要に応じて次のコマンドをインストールします。

macOS:

```sh
# 『圧縮』『解凍』命令のために
brew install p7zip
```

Ubuntu/Debian:

```sh
# 『圧縮』『解凍』命令のために
sudo apt install p7zip-full
# 『キー送信』命令のために
sudo apt install xdotool
```

全てのコマンドが正しく動くかを確認するには、次のコマンドを実行します。

```sh
npm test
```

## コマンドライン版なでしこをインストールして使えるコマンド

ローカルPCになでしこをインストールしたら、次のコマンドを実行して、ブラウザ動作するエディタを起動できます。

```sh
# なでしこのサーバーを起動
npm start
# なでしこエディタ(PC版)を起動
npm run nako3edit
# なでしこエディタ(WEB版)を起動
npm run nako3server
```

> Node.jsの推奨バージョンは、v18 以上です。


## Colabでなでしこを使って作業をする場合

以下にColabを使ってなでしこを使う場合の作業用テンプレートを用意しました。
ノートを複製して自分の作業に利用できます。

- [作業用テンプレート](https://colab.research.google.com/drive/1FmOIoJGeFP57C9fgZXCP5pvcVJ6HmvH4?usp=sharing)

## Colabでビルドテスト

Google Colabでなでしこのビルドテストできます。
- [ノートブック](https://colab.research.google.com/drive/1a-Choj3tCBCA1R7x7vPdNQN48vGzBd7E?usp=sharing)

## なでしこの開発履歴

「なでしこ3」の開発は2017年に始まり、以後コツコツとバージョンアップを続けています。
「誰でも簡単プログラマー」の目標を実現するために、これからも頑張ります。

- (2024/07/22) v.3.6.11でcoreに分割した開発用リポジトリを再び本家に統合
- (2024/07/04) v3.6.8で、バンドルツールを`webpack`から`esbuild`に変更(#1690)
- (2022-05-19) v3.3.18でJavaScriptからTypeScriptへ変更。言語コアを別リポジトリcoreに移動
- (2022-04-20) v3.3.2を公開(モジュール構造をCommonJS→ESModuleへ変更/asyncFnの実装)
- (2021-04-09) v3.2.1を公開
- (2020-04-24) v3.1.2を公開
- (2017-12-29) v3.0.19を公開(無名関数の「には」構文の実装など)
- (2017-06-25) 内部構造を大幅に修正(PEGパーサーから独自のパーサーに変更)
- (2017-02-13)「なでしこ3」のプロジェクトが開始
- (2004-08-01)「ひまわり2」としてゼロから「なでしこ」の開発が開始
- (2001-08-03)「なでしこ」の前身「ひまわり」の開発を開始

## なでしこ3の開発に参加

なでしこ3自身を開発するために、開発環境を整えようという方は、 [doc/SETUP.md](doc/SETUP.md) をご覧ください。
なでしこユーザーと開発者用のための[Discord](https://discord.com/invite/WkaQAxbDaE)があります。

## 関連リポジトリへのリンク

- [なでしこ3開発リポジトリ(GitHub)](https://github.com/kujirahand/nadesiko3/)
- [なでしこ3拡張プラグイン](https://nadesi.com/v3/doc/index.php?FAQ%2F%E6%8B%A1%E5%BC%B5%E3%83%97%E3%83%A9%E3%82%B0%E3%82%A4%E3%83%B3%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6&show)
  - [nadesiko3-server](https://github.com/kujirahand/nadesiko3-server) --- Webサーバ(HTTP)
  - [nadesiko3-websocket](https://github.com/kujirahand/nadesiko3-websocket) --- WebSocket
  - [nadesiko3-office](https://github.com/kujirahand/nadesiko3-office) --- Excelなど
  - [nadesiko3-sqlite3](https://github.com/kujirahand/nadesiko3-sqlite3/) --- SQLite3
  - [nadesiko3-tools](https://github.com/kujirahand/nadesiko3-tools) --- 便利ツール
  - [nadesiko3-mecab](https://github.com/kujirahand/nadesiko3-mecab/) --- 形態素解析(MeCab)
  - [nadesiko3-htmlparser](https://github.com/kujirahand/nadesiko3-htmlparser) --- スクレイピング
  - [nadesiko3-ml](https://github.com/kujirahand/nadesiko3-ml/) --- 機械学習
  - [nadesiko3-odbc](https://github.com/kujirahand/nadesiko3-odbc) --- データベース(ODBC)
  - [nadesiko3-mysql](https://github.com/kujirahand/nadesiko3-mysql) --- データベースMySQL
  - [nadesiko3-postgresql](https://github.com/kujirahand/nadesiko3-postgresql) --- データベースPostgreSQL
  - [nadesiko3-mssql](https://github.com/kujirahand/nadesiko3-mssql) --- データベースmssql
- 配布用パッケージ
  - [nadesiko3webkit - なでしこ3軽量配布キット(webkit版)](https://github.com/kujirahand/nadesiko3webkit)
  - [nadesiko3electron - なでしこ3フル配布キット(electron版)](https://github.com/kujirahand/nadesiko3electron)
  - [nadesiko3win32 - なでしこ3(コンソール版)のWindows配布パッケージ](https://github.com/kujirahand/nadesiko3win32/releases)
- サーバーサイドJavaScriptエンジン用の実装
  - [nadesiko3(Node.js)](https://github.com/kujirahand/nadesiko3)
  - [nadesiko3(Deno)](https://github.com/kujirahand/nadesiko3deno)
- 実験的に別言語で実装したなでしこ3
  - [nadesiko3php - なでしこ3PHP](https://github.com/kujirahand/nadesiko3php)
  - [nadesiko3rust - なでしこ3Rust](https://github.com/kujirahand/nadesiko3rust)
  - [nadesiko3go - なでしこ3Go言語](https://github.com/kujirahand/nadesiko3go)
  - [nadesiko3core](https://github.com/kujirahand/nadesiko3core/) --- 言語コアのみ取り出したもの

