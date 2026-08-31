# core/test/fixtures/compat --- 差分fixture (#2448)

なでしこ3の**Go言語版など別実装**を作るときに、
「なでしこ3として何が同じなら正しいのか」を数値で測るためのデータ一式です。

現行のTypeScript版を**正解(oracle)**とし、同じ入力に対する
観測可能な結果（標準出力・変数の値と型・例外の種類と位置）を固定してあります。

設計の背景は Issue #2448、Go版の実装計画は `doc/gonako.md` を参照してください。

## ファイル

| ファイル | 役割 |
|---|---|
| `SPEC.md` | データ形式の仕様（言語非依存） |
| `cases/*.json` | ケース定義。人が書く |
| `expected/*.json` | 期待値。TypeScript版から自動生成 |
| `compat_case.mjs` | 読み込み・実行・値の正規化の共通処理 |
| `make_compat_golden.mjs` | `expected/*.json` を生成する |
| `check_compat.mjs` | 別実装の結果と期待値を突き合わせ、通過率を出す |

検証は `core/test/compat_fixture_test.mjs` が行います
（`npm run test:core` に含まれます）。

## 使い方

### 期待値を作り直す

ケースを追加・変更したとき、または**意図的に**挙動を変えたときに実行します。

```bash
npm run build:tsc      # core/src/*.mjs はビルド生成物なので必ず先にビルドする
npm run compat:golden
```

### 別実装の通過率を見る

別実装が `SPEC.md` の形式で結果を書き出したら、次で突き合わせます。

```bash
npm run compat:check -- path/to/results        # ディレクトリでも1ファイルでも可
npm run compat:check -- path/to/results --json # CI用
```

出力例:

```text
○ 01_literal: 38/38 通過
× 04_string: 34/43 通過
    - 置換
        期待: {"status":"ok","log":"a-b-c"}
        実際: {"status":"ok","log":"aXbXc"}

合計: 180/236 通過 (76.3%)  不一致 56件 / 未実行 0件 / 非対応 3件 / 意図的差異 2件
```

### ケースを追加する

1. `cases/*.json` にケースを足す（`SPEC.md` の約束を守る）
2. `npm run compat:golden` で期待値を生成する
3. 生成された期待値が**本当に正しいか目で確認する**
4. `npm run test:core` で回帰テストを通す

## 対象範囲

互換性を保証する範囲は **`plugin_system` の命令のみ**です（#2448）。
`plugin_node` 相当は命令名を寄せるだけで挙動互換は目標にせず、
`plugin_browser` と外部プラグインは対象外です。

### 一致を求めないケース

| 印 | 意味 |
|---|---|
| `unsupported` | まだ対応できていない（例: GoのRE2に後方参照がない） |
| `intentionalDiff` | 仕様として結果が異なる（例: Go版の文字列はrune基準） |

どちらも通過率の分母から外れます。詳しくは `SPEC.md` を参照してください。

## テストが落ちたときの読み方

`core/test/compat_fixture_test.mjs` が落ちたということは、
**TypeScript版の観測可能な挙動が変わった**ということです。
期待値を作り直して通す前に、その変化が意図したものか必ず確認してください。
ここは別実装が追いかけている基準そのものなので、
黙って動かすと追いかけている側が理由もなく壊れます。
