# AGENTS.md

## プロジェクト概要

- 本リポジトリは、日本語プログラミング言語「なでしこ3」のメイン実装です。
- 言語コア（`core/`）とランタイム・プラグイン群（`src/`）を同梱し、Node.js（`cnako3`）とブラウザ（`wnako3`）の両方をサポートします。
- 方式は altJS で、なでしこコードを JavaScript に変換して実行します。

## 主要ディレクトリ

- `core/`: 言語エンジン本体（字句解析・構文解析・コード生成・実行）
- `src/`: 実行環境ごとの実装（CLI/Browser）と標準プラグイン
- `test/`: Node/common/browser/bundled/selenium のテスト
- `tools/`: 開発補助ツール（`nako3server`, `nako3edit` など）
- `batch/`: なでしこで書かれたビルド補助スクリプト
- `demo/`: ブラウザ実行サンプル
- `release/`: ビルド成果物
- `doc/`, `docs/`: 開発・利用ドキュメント
- `manual/`: ユーザー向けマニュアル --- リポジトリ `nadesiko3doc` のdataディレクトリのシンボリックリンク

```sh
# なでしこのマニュアルWikiをリンクして`manual`ディレクトリに配置する
cd ..
git clone git@github.com:kujirahand/nadesiko3doc.git
ln -s ../nadesiko3doc/data manual
```

## 実行形態とエントリポイント

- Node.js CLI: `src/cnako3.mts`（実体は `CNako3` in `src/cnako3mod.mts`）
- Browser runtime: `src/wnako3.mts`（実体は `WebNakoCompiler` in `src/wnako3mod.mts`）
- パッケージ公開エントリ: `src/index.mts`
- 言語コアクラス: `core/src/nako3.mts` の `NakoCompiler`

## コンパイル/実行パイプライン

`NakoCompiler`（`core/src/nako3.mts`）を中心に、概ね次の順で処理します。

1. 前処理: `nako_prepare`
2. 字句解析: `nako_lexer`
3. 構文変換: インデント構文 / DNCL 変換
4. 構文解析: `nako_parser3`
5. コード生成: `nako_gen`
6. 実行: 生成 JavaScript を評価

## プラグイン構成

- コア同梱プラグイン: `plugin_system`, `plugin_math`, `plugin_csv`, `plugin_promise`, `plugin_toml`, `plugin_test`
- Node 拡張: `src/plugin_node.mts`（ファイルI/O、OS、プロセス、ネットワークなど）
- Browser 拡張: `src/plugin_browser.mts` と分割パーツ（DOM/AJAX/Canvas/Storage/Speech 等）
- JSプラグイン仕様の詳細: `doc/plugins.md`

## 開発でよく使うコマンド

- 依存関係インストール: `npm install`
- ビルド: `npm run build`
- 主要テスト: `npm test`
- Lint: `npm run eslint`

## AIによるなでしこ3コード生成

`.nako3`ファイルを作成・修正するときは、次の順序で作業してください。

1. `doc/syntax-nako3.md`を読み、なでしこ3の文法を確認する。
2. 実行環境をNode.js版の`cnako`またはブラウザ版の`wnako`のどちらかに決める。
3. 使用する命令を`doc/command_list.json`で検索する。
4. 命令の`args`に記載された助詞と、`target`に目的の実行環境が含まれることを確認する。
5. `group`が`拡張プラグイン`の命令を使う場合は、必要なプラグインと導入方法も確認する。
6. 命令名や助詞を推測で作らず、一覧にある情報を優先する。
7. cnako用プログラムは、作成後に`node src/cnako3.mjs ファイル名.nako3`で実行確認する。
8. エラーになった場合は、エラーメッセージを確認してコードを修正し、再実行する。

詳しい使い方とプロンプト例は、`doc/ai-code-generation.md`を参照してください。

## 変更時の実務メモ

- 言語仕様やパーサー変更時: `core/test` を優先して実行し、あわせて `test/node` で回帰確認
- Nodeプラグイン変更時: `test/node` と `test/common` を実行
- コマンド生成や定義更新時: `npm run build:command` を実行
- 命令の検索: `npm run search:command -- <検索語> [--target cnako] [--json]`（詳細は `doc/search_command.md`）

## 補足ドキュメント

- 全体README: `README.md`
- core詳細: `core/README.md`, `core/doc/README.md`
- 開発環境: `doc/SETUP.md`
- ファイル構成メモ: `doc/files.md`

## コミットルール

- 開発者は日本人です。コメントやコミットメッセージは日本語で書いてください。
- masterブランチには直接コミットできないようにしています。必ずブランチを切ってプルリクエストしてください。
- プルリクエストには、必ずIssuesの番号を入れてください。例: `#123`。
- プルリクエストをするときは、**必ずテストを作成**して、`test/` または、`core/test`のディレクトリに追加してください。

## コードレビューに関して

- 分かりやすく親切な日本語でレビューしてください。

## マニュアルについて

manualディレクトリは、別リポジトリ`nadesiko3doc`のdataディレクトリをシンボリックリンクで参照していますが、命令・関数・定数などを追加した時には、次のファイルを作成します。git操作は、手動で行います。

```text
manual/{プラグイン名}/{命令名}.txt
```

例えば、`manual/plugin_system/合計.txt`を参考にマニュアルを作成してください。

### DocTestについて

manualディレクトリのマニュアル(`manual/{プラグイン名}/{命令名}.txt`)には、DocTest形式でサンプルコードを記述して、それを実行テストの一つにします。

```text

{{{#nako3
# ここにプログラム
10 + 5を表示。
### 表示結果: 15
}}}
```

プログラムの最下行に、`### 表示結果: 15`のように、期待する表示結果を記述します。DocTestは、マニュアルのサンプルコードが正しく動作するかを確認するためのテストです。複数行の結果であれば、次のように記述します。

```text
{{{#nako3
「あ{改行}い」と表示。
### 表示結果: あ
### い
}}}
```

DocTestは、次のコマンドで実行できます（詳しい仕様は`doc/doctest.md`を参照）。

```sh
npm run doctest          # manual以下のDocTestをまとめて実行
npm run test:doctest     # テストとして実行(npm run test:node にも含まれる)
```

## 関連リポジトリ

- Issuesの中で`貯蔵庫`や`簡易エディタ`に言及することがあります。
  - これらは別リポジトリで管理されているプロジェクトです。
  - [貯蔵庫](https://github.com/kujirahand/nako3storage): ユーザーがなでしこプログラムを保存・共有できるサービス
  - [簡易エディタ3](https://github.com/kujirahand/konawiki3/blob/master/kona3engine/plugins/nako3.inc.php): Wiki上でなでしこコードを編集・実行できるエディタ
  - [簡易エディタ](https://github.com/kujirahand/konawiki2/blob/master/kona-engine/plugins/nako3.inc.php) or 簡易エディタ2: Wiki上でなでしこコードを編集・実行できるエディタ
