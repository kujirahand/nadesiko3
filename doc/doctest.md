# DocTest 仕様

マニュアル(`manual/{プラグイン名}/{命令名}.txt`)と固定サンプル(`test/doctest/*.txt`)に
書かれたコードを実際に実行して、
書かれている表示結果のとおりに動くかを確認する仕組みです。([Issue #2409](https://github.com/kujirahand/nadesiko3/issues/2409))

## 書き方

マニュアルのサンプルコードは、`{{{#nako3` と `}}}` で囲んで書きます。
その中に `### 表示結果: 〜` を書くと、DocTestの対象になります。

```text
{{{#nako3
10 + 5を表示。
### 表示結果: 15
}}}
```

表示結果が複数行になる場合は、2行目以降を `### ` に続けて書きます。

```text
{{{#nako3
「あ{改行}い」と表示。
### 表示結果: あ
### い
}}}
```

`### 表示結果:`または`### WEB表示結果:`の記述がないブロックは、DocTestの対象になりません。

ブラウザ専用の命令を確認する場合は、`### WEB表示結果:` と書きます。

```text
{{{#nako3
L＝「こんにちは」のラベル作成。
Lのテキスト取得して表示。
### WEB表示結果: こんにちは
}}}
```

`{{{#nako3(canvas,size=40x30)` のようにCanvasを指定したサンプルでは、
ブラウザDocTestにも指定した大きさのCanvasが用意されます。

## 実行方法

```sh
# manualとtest/doctest以下のcnako用DocTestをまとめて実行する
npm run doctest

# 対象を絞って実行する(ファイルでもディレクトリでも可)
npm run doctest -- manual/plugin_system/表示.txt

# テストとして実行する(npm run test:node にも含まれます)
npm run test:doctest

# WEB表示結果のDocTestをPlaywright + Chromiumで実行する
cd test-browser
npm run test:doctest
```

`manual` は別リポジトリ `nadesiko3doc` の `data` ディレクトリへのシンボリックリンクです。
リンクがない環境では、テストはスキップされます（作り方は `AGENTS.md` を参照）。
ブラウザDocTestは`manual`と`test/doctest`を参照します。`manual`へのリンクがない場合や
`### WEB表示結果:`が1件もない場合はマニュアル部分だけをスキップします。
`test/doctest`の固定サンプルは通常のテストとCIで常に検証されます。

## しくみ

- 本体: `batch/doctest.mjs`
- テスト: `test/node/doctest_test.mjs`
- ブラウザテスト: `test-browser/test/browser_doctest.spec.mjs`

処理の流れは次の通りです。

1. `manual`と`test/doctest`以下の`*.txt`を再帰的に列挙する
2. `### 表示結果:`または`### WEB表示結果:`を含むファイルだけに絞り込む
3. `{{{#nako3 ... }}}` のブロックを抽出し、コードと期待する表示結果に分ける
4. 通常のDocTestは`NakoCompiler` + `plugin_node`、wnako用は`WebNakoCompiler`で実行する
5. 一致しない場合は、ファイル名・行番号・コード・期待値・実際の値・違いのある行を表示する

失敗時の出力例:

```text
[DocTest失敗] manual/plugin_system/表示.txt:3 の表示結果が期待と異なります。
--- 実行したコード ---
  「あ{改行}い」と表示。
--- 期待した表示結果 ---
  あ
  う
--- 実際の表示結果 ---
  あ
  い
--- 違いのある行 ---
  2行目: 期待="う" / 実際="い"
マニュアルの「### 表示結果:」の記述か、サンプルコードのどちらかを修正してください。
```
