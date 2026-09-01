# gonako --- なでしこ3 Go言語版 設計メモ

なぜ作るのか、何を作らないのかは **Issue [#2448](https://github.com/kujirahand/nadesiko3/issues/2448)** に書いてあります。
実装は別リポジトリ **[kujirahand/nadesiko3go](https://github.com/kujirahand/nadesiko3go)** で進めます。
このドキュメントは、両リポジトリにまたがる**ファイル構成・データ形式・実装手順**を扱います。

前提だけ再掲します。

- 目的は速度ではなく**配布性**。インストール不要のCUI版・GUI版を得る
- **現行のTypeScript版が公式実装**。Go版は置き換えではなく追加のバックエンド
- ブラウザ版（`wnako3`）はaltJS方式を継続。WASMは対象外
- **互換性を保証する範囲は `plugin_system` のみ**
- **文字列はGoネイティブ（UTF-8 / rune基準）**。UTF-16互換層は作らない（→ 5節）
- **プログラムとリソースを1ファイルに梱包して配布できる**ことを目標に入れる

---

## 1. 差分fixture

コードより先に「何が同じなら正しいのか」を固定します。これは**本リポジトリ側に実装済み**です。

```text
core/test/fixtures/compat/
  SPEC.md              データ形式の仕様（言語非依存）
  cases/*.json         ケース定義（人が書く）
  expected/*.json      期待値。TypeScript版から自動生成
  compat_case.mjs      読み込み・実行・値の正規化
  make_compat_golden.mjs   期待値を生成する
  check_compat.mjs     別実装の結果と突き合わせ、通過率を出す
core/test/compat_fixture_test.mjs   期待値が勝手に変わらないことを守る回帰テスト
```

Go版から見た使い方は次のとおりです。

```bash
# 1. ケースを読み、1件ずつ実行して SPEC.md の形式でJSONに書き出す（Go側の仕事）
gonako compat run --cases ./testdata/compat/cases --out ./out

# 2. 通過率を見る（なでしこ3リポジトリ側のツール）
npm run compat:check -- /path/to/out
#   合計: 180/236 通過 (76.3%)  不一致 56件 / 未実行 0件 / 非対応 3件 / 意図的差異 2件
```

**この通過率が、開発中ずっと唯一の進捗指標になります。** 実装 → 実行 → 通過率、
という短いループが回るので、コーディングエージェントに任せられる形になります。

### fixtureをGo側リポジトリへ持っていく方法

`cases/` と `expected/` は、Go側の `scripts/sync-compat-fixtures.sh` でコピーし、
コピー元のコミットハッシュを `testdata/compat/SOURCE` に記録します。
`cases/` と `expected/` の片方だけを手作業で更新してはいけません。

なでしこ3側で期待値を作り直したら、Go側で同期し直して通過率の変化を見ます。

---

## 2. リポジトリ構成

Go版は **[kujirahand/nadesiko3go](https://github.com/kujirahand/nadesiko3go)** で管理します。
別リポジトリにする理由は次の3つです。

- Goモジュールのバージョンとnpmパッケージのバージョンは別々に進む
- CIのマトリクス（OS × Goバージョン）が本リポジトリのCIと混ざらない
- リリース成果物（各OS向けバイナリ）の配布経路が違う

ただし**差分fixtureは本リポジトリを正**とし、Go側は同期したコピーと
コピー元コミットを持ちます。

---

## 3. パッケージ構成

```text
nadesiko3go/
├── go.mod
├── cmd/
│   ├── gonako/            CUI本体。実行・ビルド・fixture実行のサブコマンド
│   └── gonako-gui/        GUI版（Wails）。段階8
├── internal/
│   ├── prepare/           前処理（全角記号の正規化など。nako_prepare 相当）
│   ├── lexer/             字句解析（nako_lexer 相当）
│   │   └── josi/          助詞リスト（nako_josi_list 相当）
│   ├── indent/            インデント構文の変換（nako_indent 相当）
│   ├── dncl/              DNCL変換（nako_from_dncl 相当）
│   ├── parser/            構文解析。ASTを作る（nako_parser3 相当）
│   ├── ast/               AST定義
│   ├── ir/                直列化可能IR。バージョン付き。★境界
│   ├── compiler/          AST → IR
│   ├── vm/                IR（バイトコード） → 実行
│   ├── value/             値モデル。★言語の心臓部
│   │   └── text/          文字列のrune基準ヘルパ
│   ├── re/                正規表現エンジンの抽象。RE2とregexp2を差し替える
│   ├── event/             イベントキュー。非同期の実行順を決定的にする
│   ├── errs/              エラー型・文面・ソース位置
│   ├── host/              Host API定義。VMと標準命令の境界
│   ├── stdlib/            plugin_system 相当。★互換保証の対象
│   │   ├── system/  string/  array/  dict/  math/  datetime/  json/  regexp/
│   ├── nodelib/           plugin_node 相当。ファイル・OS・プロセス・ネットワーク
│   ├── bundle/            単一ファイル梱包。リソースの仮想ファイルシステム
│   ├── gogen/             Goソース生成バックエンド（段階10）
│   └── compat/            差分fixtureの実行と結果出力
├── testdata/
│   └── compat/            本リポジトリから同期した cases/、expected/、SOURCE
├── scripts/
│   └── sync-compat-fixtures.sh
└── docs/
```

`internal/` に置くのは、外部から不用意に依存されないようにするためです。
公開APIが必要になった段階で `pkg/` へ昇格させます（→ 12節）。

**`stdlib/` と `nodelib/` を分けているのが要点**です。前者だけが互換保証の対象で、
後者はGoらしく再設計してよい領域です。混ぜると保証範囲が曖昧になります。

`re/` と `stdlib/regexp/` も役割が違います。`re/` は正規表現エンジンの抽象、
`stdlib/regexp/` は `正規表現マッチ` などのなでしこ命令を実装します。
前者は互換保証の対象外、後者は対象です。

---

## 4. 値モデル

なでしこの値はJavaScriptの値です。ここを最初に決めないと全部が揺れます。

```go
// internal/value
type Kind uint8

const (
    KindUndefined Kind = iota
    KindNull            // なでしこの「空」
    KindBool
    KindNumber          // float64。JSのnumberと同じ
    KindString          // Goネイティブの文字列(UTF-8)
    KindArray
    KindDict            // 挿入順を保持する
    KindFunc
)

type Value struct {
    kind Kind
    num  float64
    str  string    // Goの文字列をそのまま持つ
    arr  *Array
    dict *Dict
    fn   *Func
}
```

決めておくこと。

- **数値は `float64` 一本**。整数型を別に持つとJSとの差が出る。
  `9007199254740993` が `9007199254740992` になるのも含めて互換
- **文字列はGoネイティブ（UTF-8）**。UTF-16互換層は作らない（→ 5節）
- **辞書は挿入順を保持**する。Goの `map` は順序を保証しないので、
  `map[string]*Value` に加えてキーの順序を保つスライスを持つ
- 配列は**疎（穴あき）になりうる**。`A=[1]` に `A[3]=9` を代入したときの
  中間要素は `undefined` であって `null` ではない
- 暗黙の型変換（`0` と `"0"` の比較、`+` が加算か連結か）は
  **JSの規則をそのまま移植**する。ここは自分で考えず、差分fixtureに従う
- **日時に専用の値型を作らない**。`plugin_system_datetime` は日時を文字列、
  `システム時間` をUNIX秒の数値として扱うため、`stdlib/datetime` は文字列と
  数値の変換として実装する
- **多倍長整数は当面サポートしない**。必要になった時点で `KindBigInt` を追加する

---

## 5. 文字列 --- Goネイティブ（UTF-8 / rune基準）

**Go版の文字列はGoの `string`（UTF-8）をそのまま使い、UTF-16互換層は作りません。**

当初はUTF-16互換層が必要だと考えていましたが、現行のTypeScript版を調べたところ、
`core/src/plugin_system_string.mts` の主な文字列命令は `Array.from`、
`String.fromCodePoint`、`codePointAt` などを使い、サロゲートペアを考慮しています。
さらに #2449 で残っていた長さ・桁数の不整合も修正され、Goのrune基準と一致しました。

実測で確認した対応状況です（`"𩸽あ"` などで検証）。

| 命令 | TS版 | Go版(rune基準) | |
|---|---|---|---|
| `文字数` / `文字抜出` / `文字左部分` / `文字右部分` | コードポイント単位 | 同じ | ○ 一致 |
| `文字検索` / `何文字目` / `文字挿入` / `文字削除` | コードポイント単位 | 同じ | ○ 一致 |
| `文字列分解` | コードポイント単位 | 同じ | ○ 一致 |
| `置換` / `単置換` / `出現回数` | 部分文字列単位 | 同じ | ○ 一致 |
| `ASC` / `CHR` | コードポイント値 | 同じ | ○ 一致 |
| `配列要素数` / `要素数` / `LEN` | コードポイント単位 | 同じ | ○ 一致（#2449） |
| `ゼロ埋` / `空白埋` | コードポイント単位 | 同じ | ○ 一致（#2449） |
| ZWJ絵文字 `"👨‍👩‍👦"` の `文字数` | 5 | 5 | ○ 一致 |

### 一致しない2点

現時点で確認済みの意図的差異は、次の2つです。
いずれも差分fixtureで `intentionalDiff` を付けて集計から外してあります。

| 箇所 | TS版 | Go版 | 備考 |
|---|---|---|---|
| 文字列の添字アクセス `A[0]` | サロゲートの片割れ | `𩸽` | 単独では文字として成立しない値 |
| 正規表現の `.` など | サロゲートを2文字扱い | 1文字扱い | JSは `u` フラグなしのため |

いずれも**サロゲートペア（BMP外の文字）を含む文字列に限った話**で、
日本語の常用範囲・絵文字の`文字数`では差が出ません。

> **文字コード変換（`ASC`/`CHR`）で差が出るのでは、という懸念について。**
> ここは逆に**既に一致しています。** TS版が `codePointAt` / `fromCodePoint` を
> 使っているため、`("𩸽"のASC)` は `171581`（コードポイント値）を返します。
> UTF-16のコードユニット値（`0xD867`）ではありません。

### 2点への対処

1. **添字アクセス**: サロゲートの片割れは単独で文字として成立しないので、
   Go版がrune基準にするほうが自然です。**意図的差異として受け入れます**
2. **正規表現**: Goの `regexp` はrune基準なので、こちらも意図的差異とします。
   JSの `u` フラグ付き正規表現と同じ挙動になります

`配列要素数` / `要素数` / `LEN` / `ゼロ埋` / `空白埋` は、当初は
UTF-16コードユニット基準のままで `文字数` と食い違っていましたが、
**#2449 でコードポイント基準に揃えられました**。これらに付いていた
`intentionalDiff` は不要で、通常の互換対象として扱います。

### 実装上の注意

Goの `string` は**UTF-8バイト列**なので、`len(s)` はバイト数、
`s[i]` はバイトを返します。なでしこの命令で使ってよいのは次だけです。

```go
// internal/value/text
func RuneLen(s string) int              // utf8.RuneCountInString
func RuneSlice(s string, i, j int) string
func RuneAt(s string, i int) string
```

**`len()` と `s[i]` を直接使わない**ことを、コードレビューの観点に入れてください。
ここを間違えると、日本語を含むほぼ全ての文字列でバグります。

## 6. IR --- 最重要の設計境界

現行のASTは `meta` に実際のJS関数（`FuncListItem.fn`）を持つため直列化できません。
Go版では**バージョン付きの直列化可能IR**を新規に定義します。

```go
// internal/ir
type Program struct {
    Version   int          // IRのバージョン
    Consts    []Const      // 定数プール
    Funcs     []Func       // 関数（無名関数を含む）
    Main      int          // エントリのFuncインデックス
    Sources   []SourceFile // ソースファイル
    Positions []SourcePos  // 命令から参照するソース位置
}

type Func struct {
    Name    string
    Params  []Param    // 助詞を含む
    NumVars int
    Code    []Inst
    Async   bool       // 効果情報
    Pure    bool
}

type Inst struct {
    Op   Op
    A, B int
    Pos  int   // Positionsのインデックス
}
```

VMは**値スタック方式**とし、ローカル変数は `Func.NumVars` 個のスロット配列で
持ちます。可変長のオペランドは、個数を `B`、実体をスタックに積む規約にします。

守ること。

- **命令は名前ではなくIDで参照**する（`stdlib` の関数テーブルの添字）
- `Async` / `Pure` などの**効果情報をIRに持たせる**。VMもGoコード生成も両方使う
- **ソース位置を必ず持つ。** `Inst.Pos` から `SourcePos`、さらに `SourceFile` を
  参照してファイル名と行を復元する。エラー文面の行番号が互換対象なので落とせない
- IRのバージョンを上げたら、古いバイトコードは読めないと明示的に拒否する

**IRからGoソースを生成できる粒度に保つ**ことを、設計レビューの観点に入れます（→ 12節）。

---

## 7. Host API

VMと外界の境界です。**Goのポインタやmapを直接公開しません。**

```go
// internal/host
type Host interface {
    Print(s string)                       // 『表示』の出力先
    Now() time.Time                       // 日時（テストで固定できるように）
    Env() Env                             // ファイル・OS・プロセス・ネットワーク
    Timer() Timer                         // イベントキューへの登録
}
```

CUI版は `os` / `net` / `io` を、GUI版はWebViewへの橋渡しを、
差分fixture実行時は**出力を集めるだけの実装**を差します。
外部境界では整数handleと明示的なValue APIを使い、GC境界を跨がせません。

---

## 8. 非同期とイベントキュー

**goroutineの実行順を仕様にしません。** 専用のイベントキューを1本持ち、
そこに積まれた順・時刻順にシングルスレッドで回します。

```go
// internal/event
type Loop struct { ... }
func (l *Loop) Post(at time.Time, fn func()) TimerID  // 秒後・秒毎
func (l *Loop) Cancel(id TimerID)                     // タイマー停止
func (l *Loop) Run()                                  // 空になるまで回す
```

`Run()` は実時間を待たず、キュー内で最も早い時刻まで**仮想時刻を進めて**
コールバックを実行します。同じ時刻なら `Post` した順に実行します。
`Host.Now()` もこの仮想時刻を返すことで、非同期fixtureを高速かつ決定的にします。

差分fixtureの `10_async` グループが、この実行順を固定しています
（`秒後` のコールバックが本体より後に動く、待ち時間の短いものが先に動く、など）。
goroutineを使ってもよいのは、**観測可能な順序に影響しない範囲**だけです。

---

## 9. エラー

エラーの**種類・行番号・文面**が互換対象です。

```go
// internal/errs
type Kind int   // Lexer / Syntax / Runtime

type NakoError struct {
    Kind Kind
    File string
    Line int      // 0起点。文面では +1 して「N行目」と出す
    Msg  string
}

func (e *NakoError) Error() string   // "[実行時エラー]main.nako3(1行目): ..."
```

`compat run` の `error.type` はTypeScript版のクラス名に合わせます。

| `Kind` | `error.type` | `Error()` の接頭辞 |
|---|---|---|
| `Lexer` | `NakoLexerError` | `[字句解析エラー]` |
| `Syntax` | `NakoSyntaxError` | `[文法エラー]` |
| `Runtime` | `NakoRuntimeError` | `[実行時エラー]` |

`Msg` は複数行になりうるため、1行に限定しません。

差分fixtureの `09_error` グループが、この文面をそのまま固定しています。
文面の日本語は現行TS版からの**逐語移植**であり、Go版で言い回しを改善しないでください。

---

## 10. 単一ファイル梱包

なでしこ1で好評だった「作ったものをそのまま渡せる」を取り戻す部分です。

```bash
gonako build かんたんゲーム.nako3 --resource ./images --out かんたんゲーム
```

構成はシンプルに、**ランタイム本体の末尾にペイロードを追記**する方式にします。

```text
[ gonako ランタイム本体 (通常のGoバイナリ) ][ ペイロード ][ フッタ(マジック+長さ) ]
```

- ペイロードは `IR + リソース` をまとめたzip
- 起動時に自分自身（`os.Executable()`）の末尾を読み、フッタがあれば同梱モードで動く
- リソースは `internal/bundle` の仮想ファイルシステム越しに見せ、
  **なでしこ側からは通常のファイル読み込み命令と同じ書き方**でアクセスできるようにする
- 開発中（同梱なし）は実ファイルを読むので、書き換えなしで同じコードが動く

クロスコンパイルは `GOOS` / `GOARCH` を指定してランタイム本体を用意しておき、
それにペイロードを追記するだけなので、**ビルド機にGoツールチェインが要りません**。

> 注意: macOSの署名済みバイナリは末尾追記で署名が壊れます。
> 配布時は追記後に `codesign` し直す手順を用意します。

---

## 11. GUI版（Wails）

日本語入力（IME）が死活問題なので、OSのWebViewを使うWailsを採用します。
`internal/host` の実装を差し替えるだけで、言語本体は共有されます。
UIはブラウザ版の資産を流用できます。着手は段階8です。

---

## 12. Goコード生成バックエンド

速度が必要な場面のための追加バックエンドです（#2448 参照）。

```text
IR ──► internal/gogen ──► Goソース ──► go build ──► ネイティブ実行ファイル
```

JS生成と違い、**標準命令の実装を二重に持つ必要がありません。**
ただしリポジトリ外に生成したGoコードは、Goの可視性規則により
`internal/stdlib` を直接 `import` できません。最小限の公開ファサードを
`pkg/runtime` に設け、生成コードはそこから同じ `internal/stdlib` を呼びます。

- Goツールチェインが要るのは**作る側だけ**。受け取る側は実行ファイルを動かすだけ
- 動的な性質を持つ機能は制限されるか、VMへのフォールバックが必要
- **差分fixtureを「TS版 / Go VM / Go生成コード」の3系統で回し、結果の一致を保証する**

---

## 13. 実装手順

各段階の完了条件を**差分fixtureの通過率**で定義します。

| 段階 | 内容 | 完了条件 |
|---|---|---|
| 0 | fixtureのGo側同期、`value` / `text` / `ir` / `host` の定義、`compat run` の器 | 全ケースを `UnsupportedError` として出力し、`compat:check` が「未実行 0件」で動く |
| 1 | `prepare` / `lexer` / `parser`。ASTまで | `09_error` 以外を解析でき、字句・構文エラーは期待どおりの種別になる |
| 2 | `compiler`（AST→IR）と `vm`。`stdlib` の中核（表示・演算・変数・制御構文） | `01`〜`03` `07` グループが通過 |
| 3 | `stdlib` の残り（文字列・配列・辞書・数学・日時・JSON）と `errs` | `04`〜`09` グループが通過。全体9割 |
| 4 | `re` / `stdlib/regexp`（RE2の範囲） | `11` グループが通過（非対応3件・意図的差異1件を除く） |
| 5 | `event` と非同期命令 | `10` グループが通過。**全グループ通過（非対応3件・意図的差異2件を除く）** |
| 6 | `nodelib`。CUI版の完成 | 実用スクリプトが動く。単一バイナリを配布できる |
| 7 | `bundle`。プログラムとリソースの単一ファイル梱包 | `gonako build` の成果物が別マシンで動く |
| 8 | GUI版（Wails） | IMEで日本語入力ができる |
| 9 | オフィス処理・PDF作成・画像生成 | 各機能のテストが通る |
| 10 | `gogen`。Goコード生成バックエンド | 3系統の差分fixtureが一致する |

**段階6で単体の価値が出ます**（インストール不要のCUI版）。
**段階7で当初の目的が達成されます**（作ったものをそのまま渡せる）。
段階8以降はそれぞれ独立して判断できます。

### 進め方

1. まず落ちているケースを1つ選ぶ
2. 通すために必要な最小の実装を書く
3. `compat run` して通過率を見る
4. 下がっていないことを確認して次へ

順番に迷ったら、**グループ番号の小さい順**に潰すのが安全です。
`01_literal` → `02_operator` → `03_type_convert` の順に、
言語の土台から固まっていくように並べてあります。

---

## 14. 本リポジトリ（TypeScript版）側でやること

- 差分fixtureを**育てる**。互換で困ったケースが見つかるたびに `cases/` へ足す
- UTF-16依存が見つかったら、まずTypeScript版を修正し、サロゲートペアの
  回帰ケースを追加する。Go側は同期スクリプトでfixtureと `SOURCE` を更新する
- 期待値を変える変更（挙動の変更）は、**変えた理由をコミットメッセージに残す**。
  Go側は理由が分からないと追随できません
- `plugin_system` に命令を足したら、対応するケースも足す

差分fixtureは、**Go版の計画が途中で止まってもTS版の回帰テストとして残る資産**です。

---

## 15. 未決事項

決め打ちせず、実装しながら判断する項目です。

- **多倍長整数**: 当面は対象外とし、必要になった時点で `math/big` と
  `KindBigInt` の追加を検討する
- **正規表現エンジン**: 標準 `regexp`(RE2) で始める。後方参照・先読みが必要になったら
  `dlclark/regexp2` を後付けし、失敗したものだけ流す二段構えにする（#2448）
- **`plugin_node` の命令名**: TS版に寄せる範囲をどこまでにするか
- **オフィス処理などのライブラリ選定**: ライセンス（MIT/BSD系を優先）と日本語の扱いで選ぶ
