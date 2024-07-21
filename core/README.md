# 日本語プログラミング言語「なでしこ3」言語エンジン

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
[![npm version](https://badge.fury.io/js/nadesiko3core.svg)](https://www.npmjs.com/package/nadesiko3core)

## 「なでしこ3」とは

「なでしこ3」とは、日本語のプログラミング言語です。HTML5/JavaScript(TypeScript)をベースとしているので、PC/スマホ/タブレットなど、さまざまな環境で動作させることができます。日本語プログラミング言語は、読みやすく理解しやすいのが特徴で、初めてでも楽しくプログラミングを覚えることができます。

- [なでしこ3開発リポジトリ - nadesiko3](https://github.com/kujirahand/nadesiko3)
- [なでしこのWebサイト](https://nadesi.com/top/)

## 本リポジトリについて

本リポジトリは、なでしこ3の言語エンジンのみを取り出したものです。最小限の構成となっています。
言語機能と最小限のプラグインのみを備えています。

- [なでしこの基本文法(外部サイト)](https://nadesi.com/v3/doc/index.php?%E6%96%87%E6%B3%95)

最小限のプラグイン構成

- [plugin_system](./src/plugin_system.mts) --- 言語機能の補助など基本的な関数群
- [plugin_math](./src/plugin_math.mts) --- 数学関数群
- [plugin_csv](./src/plugin_csv.mts)--- CSV処理のための関数群
- [plugin_promise](./src/plugin_promise.mts) --- プロミス機能を実現するための関数群
- [plugin_test](./src/plugin_test.mts) --- テストを記述するための関数群

## 本ライブラリの使い方

例えば、`npm install nadesiko3core`でなでしこ3言語エンジンをインストールしたら、以下のプログラムを記述します。
`hoge.mjs`という名前で保存します。そして、以下のようなプログラムを記述します。

```js
import core from 'nadesiko3core'
const com = new core.NakoCompiler()
const g = com.run('1 + 2 * 3を表示') // ← ここになでしこのプログラム
console.log(g.log) // ← 「表示」した内容がlogに入っている
```

プログラムを実行するには、`node hoge.mjs`と記述すれば実行できます。

## コマンドラインから実行したい場合

コマンドラインからなでしこのプログラムを実行したい場合には、[nadesiko3](https://github.com/kujirahand/nadesiko3)リポジトリを利用してください。
nadesiko3リポジトリには、コマンドライン版のなでしこ(cnako3)が含まれています。

### 簡易版のコマンドラインツールの使い方

```sh
git clone https://github.com/kujirahand/nadesiko3core.git
cd nadesiko3core
# ライブラリのインストール
npm install
# パッケージをビルド
npm run build
```

なお、本リポジトリにも、[簡易版のコマンドラインツール(snako)](/command/snako.mts)を収録しています。以下は簡単な使い方です。

```sh
# ファイル sample/hello.nako3 を実行
node command/snako.mjs sample/hello.nako3
# その場でコードを実行
node command/snako.mjs -e "1+2を表示"
```

### 簡易コマンドラインをグローバルインストールして使う場合

簡易コマンドライン(snako)を手軽に利用したい場合は、次のように実行します。

```sh
npm install -g nadesiko3core
snako -e "1+2を表示"
snako nadesiko3core/sample/hello.nako3
```

## なでしこの内部構造について

なでしこの内部構造の仕組みについては、[こちら](/doc/README.md)に詳しく書かれています。

## 開発時のメモ

新バージョンを`npm publish`する場合、必ず、ビルドしてからpublishすること。

```sh
# build
npm run build
npm publish
```
