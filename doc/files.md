# なでしこを構成するファイルたち

## src/nako3.mjs

なでしこコンパイラ本体。なでしこのソースコードをJSに変換する。変換処理は、以下のように行われる。

- (1) なでしこソース
- (2) トークン列(語句を1つずつに区切ったもの)
- (3) 構文木(中間表現)
- (3) JavaScriptソース

## src/nako_prepare.mjs

なでしこのソースコードの前置処理を行うもの。主に全角半角の変換処理を行う。

## src/nako_parser3.mjs

なでしこ構文から構文木を生成するもの。

## src/nako_gen.mjs

構文木を元に、JavaScriptのコードを生成するもの。

## src/plugin_xxx.mjs

なでしこの命令を定義したプラグイン。

## src/cnako3.mjs + src/cnako3mod.mjs

バッチファイル実行用。コマンドラインのインタフェースを実装するもの。

## src/wnako3.mjs

ブラウザ用。

## src/enako3.mjs

Electronによるアプリ本体。
