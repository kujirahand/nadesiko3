# core/test/fixtures

テストが読み込む固定データを置くディレクトリです。
`npm run test:core` のテストグロブは `core/test/*.mjs` なので、
このディレクトリのファイルがテストとして実行されることはありません。

## 構文解析器のゴールデン AST (#2364)

| ファイル | 役割 |
|---|---|
| `parser_corpus.mjs` | 構文解析のコーパス(なでしこコード集)と、AST をプレーン化するヘルパー |
| `parser_ast_golden.json` | コーパスを構文解析した結果の AST を固定したもの |
| `make_parser_ast_golden.mjs` | `parser_ast_golden.json` を生成するスクリプト |

`core/test/nako_parser_test.mjs` が、現在の構文解析結果と
`parser_ast_golden.json` を `assert.deepStrictEqual` で比較します。
AST の全キー・全値に加えて**キーの並び順**まで比較するため、
構文解析器に手を入れて結果が少しでも変われば必ず検出できます。

### ゴールデンを再生成する

コーパス(`parser_corpus.mjs` の `PARSER_CORPUS`)を追加・変更したときや、
**意図的に**構文解析の結果を変更したときに再生成します。

```bash
npm run build:tsc && node core/test/fixtures/make_parser_ast_golden.mjs
```

`core/src/*.mjs` はビルド生成物(git 管理外)なので、
**再生成の前に必ずビルドしてください**。ビルドを忘れると古いコードの
AST がゴールデンになってしまいます。

### 差分が出たときの読み方

構文解析器のリファクタリング中にこのテストが落ちた場合、それは
**リファクタリングで挙動が変わってしまった**ことを意味します。
ゴールデンを再生成して通す前に、差分が意図したものか必ず確認してください。
`assert.deepStrictEqual` は差分箇所を表示するので、
どのノードのどのキーが変わったかを追えます。
