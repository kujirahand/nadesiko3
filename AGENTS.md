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

## 変更時の実務メモ

- 言語仕様やパーサー変更時: `core/test` を優先して実行し、あわせて `test/node` で回帰確認
- Nodeプラグイン変更時: `test/node` と `test/common` を実行
- コマンド生成や定義更新時: `npm run build:command` を実行

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

## 関連リポジトリ

- Issuesの中で`貯蔵庫`や`簡易エディタ`に言及することがあります。
  - これらは別リポジトリで管理されているプロジェクトです。
  - [貯蔵庫](https://github.com/kujirahand/nako3storage): ユーザーがなでしこプログラムを保存・共有できるサービス
  - [簡易エディタ3](https://github.com/kujirahand/konawiki3/blob/master/kona3engine/plugins/nako3.inc.php): Wiki上でなでしこコードを編集・実行できるエディタ
  - [簡易エディタ](https://github.com/kujirahand/konawiki2/blob/master/kona-engine/plugins/nako3.inc.php) or 簡易エディタ2: Wiki上でなでしこコードを編集・実行できるエディタ
