# 日本語プログラミング言語「なでしこ3」 内部構造について

なでしこ3は、altJSと呼ばれる仕組みを採用しており、なでしこのプログラムが最終的にJavaScriptに変換されて実行されます。

大きく言って次の仕組みで実行されます。

- 1.[字句解析](/src/nako_lexer.mts)
- 2.[構文解析](/src/nako_parser3.mts)
- 3.[コード生成](/src/nako_gen.mts)
- 4.[実行](/src/nako3.mts)
 
## 字句解析

[字句解析](/src/nako_lexer.mts)では、なでしこのソースコードをトークンと呼ばれる、最小の字句要素に分割します。以下のtokenizeメソッドで分割します。

- [tokenizeメソッド](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_lexer.mts#L404)

なお、トークンを分割するのに複数のルールを利用します。ルールは、配列形式で記述されており、上から順にソースコードにマッチするかを順に確認していきます。

- [rules配列](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_lex_rules.mts#L32)

### 字句解析前後の細かな処理

ただし、実際には、字句解析を行う前に、全角半角を揃えたり、特殊な記法を一般的な記法に置き換えたりと前置処理が行われます。

- [前置処理](/src/nako_prepare.mts)

また、なでしこ3では、インデント構文やDNCLモードなどをサポートしており、これは、なでしこの文法を劇的に置換する特殊モードで、[字句解析の後に置換処理](https://github.com/kujirahand/nadesiko3core/blob/4f89cbf32f45584248f00719b7f6b5d0495d6c5c/src/nako3.mts#L359)がおこなれます。

- [インデント構文](/src/nako_indent.mts)
- [インラインインデント構文](/src/nako_indent_inline.mts)
- [DNCLモード](/src/nako_from_dncl.mjs)

## 構文解析

[構文解析](/src/nako_parser3.mts)では、なでしこの文法に沿った記述があるかどうかを一つずつ確認して、ソースコードを構文木に変換します。
なでしこの構文木は、複数のノードを木構造でつなげたものです。

- [構文木のノード(Ast)](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_types.mts#L72)

この構文木は、[本家(nadesiko3)](https://github.com/kujirahand/nadesiko3)のcnako3コマンドで、--ast オプションを付けると確認できます。
例えば、「2+3を表示」というプログラムは、次のような構文木に変換されます。

- block:
  - func (表示):
    - args:
      - op(+)
        - left:
          - number (2)
        - right:
          - number (3)

## コード生成

[コード生成](/src/nako_gen.mts)の処理では、構文解析で作成した構文木のコードを、JavaScriptのコードに変換します。
構文木の各要素を一つずつJavaScriptに変換します。

コード変換を実際に行うのが、[_codeGenメソッド](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_gen.mts#L418)です。このメソッドでは、Astのtypeプロパティを調べて、各要素を一つずつ変換していきます。

- 例えば、構文木の種類が[number](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_gen.mts#L460)であれば、数値なのでそのまま数値を返します。
- [演算子(op)](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_gen.mts#L1388)の時は計算を行うJavaScriptのコードを生成します。
- [繰り返す文(for)](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako_gen.mts#L909)であれば、必要なパラメータを取得しつつJavaScriptのfor文を生成します。

## 実行

[実行](/src/nako3.mts)は、JavaScriptのコードを評価する[evalJS](https://github.com/kujirahand/nadesiko3core/blob/7db54415b74815739fdb64aa05df7da9e5ab1bdf/src/nako3.mts#L749)メソッドで行います。
JavaScriptの`new Function(code)`を使ってJavaScriptのコードを実行します。

