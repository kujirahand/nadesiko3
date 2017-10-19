# なでしこを構成するファイルたち

### src/nako3.js

なでしこコンパイラ本体。なでしこのソースコードをJSに変換する。変換処理は、以下のように行われる。

 - なでしこソース
 - 構文木(中間表現)
 - JavaScriptソース


### src/nako_prepare.js

なでしこのソースコードの前置処理を行うもの。主に全角半角の変換処理を行う。

### src/nako_parser3.js

なでしこ構文から構文木を生成するもの。

### src/nako_gen.js

構文木を元に、JavaScriptのコードを生成するもの

### src/plugin_xxx.js

なでしこの命令を定義したプラグイン。


### src/cnako3.js

バッチファイル実行用。コマンドラインのインターフェイスを実装するモノ

### src/wnako3.js

Webブラウザ用。

### src/enako3.js

Electronによるアプリ本体。
