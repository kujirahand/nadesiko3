# 差分fixture 仕様 (#2448)

なでしこ3の**別実装（Go版など）と現行TypeScript版の挙動を突き合わせる**ための
データ形式を定める。この仕様は特定の言語に依存しない。

## 全体像

```text
cases/*.json      ケース定義（人が書く。言語非依存）
      │
      ├─► 現行TypeScript版で実行 ─► expected/*.json   期待値(oracle)
      │
      └─► 別実装で実行 ──────────► 任意の場所 *.json  実際の結果
                                          │
                        check_compat.mjs で突き合わせ ─► 通過率
```

期待値は**現行TypeScript版が出した結果**であり、それがなでしこ3の定義である。
別実装は「同じ入力に対して同じ結果を出すこと」を目標にする。

## ケース定義 `cases/*.json`

```json
{
  "group": "01_literal",
  "description": "このグループが何を固定するかの説明",
  "cases": [
    {
      "name": "整数",
      "code": "3を表示",
      "vars": ["A"],
      "tags": ["utf16"],
      "unsupported": { "go": "非対応の理由" }
    }
  ]
}
```

| キー | 必須 | 意味 |
|---|---|---|
| `group` | ○ | グループ名。ファイル名(拡張子なし)と一致させる |
| `description` | | グループの説明 |
| `cases[].name` | ○ | ケース名。グループ内で一意 |
| `cases[].code` | ○ | 実行するなでしこ3のソース |
| `cases[].vars` | | 実行後に値を検査する変数名の配列 |
| `cases[].tags` | | 分類用のタグ。`surrogate` / `timing` など |
| `cases[].unsupported` | | 実装名をキーに、**まだ対応できない**理由を書く。その実装の集計から除外される |
| `cases[].intentionalDiff` | | 実装名をキーに、**仕様として結果が異なる**理由を書く。その実装の集計から除外される |

`unsupported` と `intentionalDiff` は似ているが意味が違う。
`unsupported` は「いつか対応したい未達」、`intentionalDiff` は「対応する気がない意図的な差」。
Go版が文字列をGoネイティブ（UTF-8 / rune基準）にすると決めた結果生じる差は後者にあたる。

### ケースを書くときの約束

- **決定的であること。** 現在日時・乱数・実行環境のパスに依存する結果を書かない
- ファイル名は常に `main.nako3` として実行される（エラー文面に載るため固定）
- 変数は名前空間接頭辞 `main__` が付いた状態で保持されるが、`vars` には接頭辞なしで書く
- 互換性を保証する範囲は `plugin_system` の命令のみ（#2448）。
  `plugin_node` / `plugin_browser` / 外部プラグインの命令は書かない

## 実行結果の形式

1ケースにつき次のオブジェクトを作る。`expected/*.json` も別実装の出力もこの形式。

```json
{
  "name": "整数",
  "status": "ok",
  "log": "3",
  "vars": { "A": { "t": "num", "v": 3, "int": true } },
  "error": null
}
```

| キー | 意味 |
|---|---|
| `status` | `ok`(正常終了) / `error`(例外) / `timeout`(制限時間超過) |
| `log` | 『表示』などで出力された内容。行の区切りは `\n` |
| `vars` | `cases[].vars` に挙げた変数の最終値（下記の値表現）。`vars` が空なら省略 |
| `error` | `status` が `error` のときのみ。`{ type, line, message }` |

`error.line` は**0起点**。エラー文面（`message`）の「N行目」は1起点なので1つずれる。

グループ単位のファイルは次の形にまとめる。

```json
{
  "group": "01_literal",
  "description": "...",
  "generatedBy": "nadesiko3 (TypeScript)",
  "results": { "整数": { "...": "..." } }
}
```

## 値表現

JSONは数値の種別や辞書のキー順を落としてしまうので、型を明示的に持たせる。

| 型 | 表現 |
|---|---|
| 未定義 | `{"t":"undefined"}` |
| 空(null) | `{"t":"null"}` |
| 真偽値 | `{"t":"bool","v":true}` |
| 数値 | `{"t":"num","v":3,"int":true}` |
| 特殊な数値 | `{"t":"num","v":"NaN"}` / `"Infinity"` / `"-Infinity"` / `"-0"` |
| 多倍長整数 | `{"t":"bigint","v":"123"}` |
| 文字列 | `{"t":"str","v":"あ","len":1}` — `len` は**コードポイント数** |
| 配列 | `{"t":"arr","len":2,"v":[ ... ]}` |
| 辞書 | `{"t":"obj","keys":["x","y"],"v":{ ... }}` — `keys` で並び順を保存する |
| 日時 | `{"t":"date","v":"ISO8601文字列"}` |
| 関数 | `{"t":"func"}` |
| 循環参照 | `{"t":"circular"}` |

文字列の `len` は**コードポイント数**（JSの `Array.from(s).length`、
Goの `utf8.RuneCountInString`）である。Goの `len()` が返すUTF-8バイト数ではない。

現行TypeScript版の文字列命令（`文字数`・`要素数`・`文字抜出`・`文字列分解`・`ASC`/`CHR` など）は
すでに `Array.from` ベースでコードポイント単位に揃えられているため、
Goのrune基準とそのまま一致する。一致しないのは次の2点だけで、
いずれも `intentionalDiff` を付けて集計から除いてある。

| 箇所 | TypeScript版 | Go版(rune基準) |
|---|---|---|
| 文字列の添字アクセス `A[0]` | サロゲートの片割れ | `𩸽` |
| 正規表現の `.` など | サロゲートを2文字として扱う | 1文字として扱う |

サロゲートペアが絡むケースには `surrogate` タグを付けてある。

## 比較の規則

`check_compat.mjs` は `status` / `log` / `vars` / `error` を比較する。
`name` は比較しない。`unsupported` に自分の実装名があるケースは集計から除く。
