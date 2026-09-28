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
# manualとtest/doctest以下のcnako用DocTestをまとめて実行する(JS実装・高速)
npm run doctest

# 対象を絞って実行する(ファイルでもディレクトリでも可)
npm run doctest -- manual/plugin_system/表示.txt

# テストとして実行する(npm run test:node にも含まれます)
npm run test:doctest

# なでしこで書いたDocTest本体で実行する(batch/doctest.nako3)
npm run doctest:nako3
npm run doctest:nako3 -- --max 0 manual/plugin_system/表示.txt

# WEB表示結果のDocTestをPlaywright + Chromiumで実行する
cd test-browser
npm run test:doctest
```

## なでしこで書いたDocTest(`batch/doctest.nako3`)

DocTestの本体は、なでしこ自身でも記述しています。([#2570](https://github.com/kujirahand/nadesiko3/issues/2570))
書式とオプションは gonako 版(`gonako/gonako-package/doctest.nako3`)に合わせているので、
ランタイムを切り替えて同じマニュアルを検証できます。

```sh
# 既定では、このファイルと同じなでしこ(cnako3)を別プロセスで実行して検証する
npm run doctest:nako3

# 外部ランタイム(gonako など)を指定して実行する
npm run doctest:nako3 -- --runtime gonako
npm run doctest:nako3 -- --runtime "node src/cnako3.mjs"

# 失敗した結果をJSONで出力する(AIが修正しやすい形式)
npm run doctest:nako3 -- --json            # 標準出力
npm run doctest:nako3 -- --json=result.json # ファイルに保存
```

なお、外部ランタイムの実行にはPOSIXのシェル(`/bin/sh`)を使うため、
macOS・Linux(CI)での利用を想定しています。

### オプション

| オプション | 説明 |
| --- | --- |
| `--max 件数` | 失敗の詳細を表示する最大件数(既定10、0で全件) |
| `--runtime 実行ファイル` | サンプルを実行する外部ランタイム(`"node src/cnako3.mjs"` のようにまとめても書ける) |
| `--subcommand 命令` | `--runtime` に渡す引数(サブコマンドなど) |
| `--label ラベル` | 対象にする表示結果のラベル(既定「表示結果」。カンマ区切りで複数指定可) |
| `--json[=ファイル名]` | 失敗した結果をJSONで出力する(ファイル名を省略すると標準出力) |
| `--internal` | 同じなでしこの中で実行する(高速だがDoctest本体の環境の影響を受ける) |
| `--usage` | 使い方を表示する(`-h`/`--help` は cnako3 本体が先に受け取る) |

環境変数 `NAKO3_DOCTEST_RUNTIME` で `--runtime` の既定値を指定できます。

### JSONの形式

```json
{
  "ツール": "nadesiko3-doctest",
  "件数": 3,
  "成功数": 1,
  "失敗数": 2,
  "省略数": 0,
  "結果": [
    {
      "ファイル": "test/doctest/ng.txt",
      "行": 3,
      "ラベル": "表示結果",
      "コード": "「こんにちは」と表示。",
      "期待": "さようなら",
      "実際": "こんにちは",
      "エラー": ""
    }
  ]
}
```

`結果` には失敗したサンプルだけが入ります。`ファイル` はリポジトリのルートからの相対
パス(ルートの外にあるときはそのまま)、`行` は「`{{{#nako3`」の行番号です。

### 終了コード

| 終了コード | 意味 |
| --- | --- |
| 0 | すべて成功(対象なしも含む) |
| 1 | 失敗したサンプルがある |
| 2 | 引数の誤り・実行時の異常 |

`manual` は別リポジトリ `nadesiko3doc` の `data` ディレクトリへのシンボリックリンクです。
リンクがない環境では、テストはスキップされます（作り方は `AGENTS.md` を参照）。
ブラウザDocTestは`manual`と`test/doctest`を参照します。`manual`へのリンクがない場合や
`### WEB表示結果:`が1件もない場合はマニュアル部分だけをスキップします。
`test/doctest`の固定サンプルは通常のテストとCIで常に検証されます。

## しくみ

2つの実装があり、マニュアルの書式は共通です。

| 実装 | 本体 | テスト | 特徴 |
| --- | --- | --- | --- |
| JS版 | `batch/doctest.mjs` | `test/node/doctest_test.mjs` | `NakoCompiler` の内部で実行するので高速 |
| なでしこ版 | `batch/doctest.nako3` | `test/node/doctest_nako3_test.mjs` | ランタイムを指定できる。JSON出力あり |

- ブラウザテスト: `test-browser/test/browser_doctest.spec.mjs`

処理の流れは次の通りです。

1. `manual`と`test/doctest`以下の`*.txt`を再帰的に列挙する
2. `### 表示結果:`または`### WEB表示結果:`を含むファイルだけに絞り込む
3. `{{{#nako3 ... }}}` のブロックを抽出し、コードと期待する表示結果に分ける
4. 通常のDocTestは`NakoCompiler` + `plugin_node`、wnako用は`WebNakoCompiler`で実行する
5. 一致しない場合は、ファイル名・行番号・コード・期待値・実際の値・違いのある行を表示する

なでしこ版は、4の手順で元のファイルの隣に一時ファイルを作り、
サンプルを別プロセス(既定では cnako3)で実行して標準出力を比べます。
相対パスの参照を保つため、一時ファイルは元のマニュアルと同じディレクトリに置き、
実行後に削除します。

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
