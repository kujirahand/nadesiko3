# プラグインのAPIの仕様

なでしこ3には、以下の二種類のプラグインがある。

 - (1) なでしこ3自身で開発したなでしこプラグイン
 - (2) JavaScriptで開発したJSプラグイン

なお、(1)のプラグインはなでしこ自身で関数を定義するだけである。
以下では、(2)のJavaScriptで開発したプラグインについて解説する。


## Webプラグインを利用する手順

HTMLファイル内でなでしこ本体(wnako3.js)よりも後ろで<script src="(JSプラグイン).js">と記述して読み込む。

なお「wnako3.js」を読み込むと、ブラウザの「navigator」オブジェクトにプロパティ「nako3」(navigator.nako3)にコンパイラのインスタンスが作成される。

## プラグイン側の実装方法

プラグインの実体は、Objectである。

```
{
  '定数名': { 定義 },
  '命令名': { 定義 },
  ...
}
```

### 定義：関数

プラグインの実体は、Object。実際の関数定義は、fnプロパティに行う。実際の関数の引数に加えて、システムを表すsysを用意する。

```
{
  '関数名': { // @関数の説明 // @ヨミガナ
    type: 'func', // 関数であれば func にする
    josi: [['を', 'から'], ['まで']], // 助詞を配列で宣言する (可変長引数として扱いたい助詞は末尾で宣言する)
    isVariableJosi: false, // 末尾の助詞を可変長引数として扱う場合 true にする
    uses: [], // この関数から別の関数を呼ぶ場合に記述する // (TODO: #282)
    fn: function (aFrom, aTo, sys) { ... }, // 関数の実態
    return_none: false // 戻り値を返すかどうか
  },
  ...
}
```

なお、コメントを記述した場合、`npm run build:command`を実行すると自動的にコマンドマニュアルが生成される。

### 定義：定数

typeプロパティに「const」を指定して、valueプロパティに値を指定する。

```
{ type: 'const', value: 100 } // @ヨミガナ
```

### 定義：変数

typeプロパティに「var」を指定して、valueプロパティに値を指定する。

```
{ type: 'var', value: 100 } // @ヨミガナ
```


### プラグインの自動登録

プラグインの末尾に以下のコードを仕込むとscriptタグで読み込んだときシステムに登録できる。

```
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject(プラグイン名, オブジェクト)
}
```

## 初期化メソッド

以下のようなエントリを用意しておくと、プラグインを取り込み、初回実行するときに初期化メソッドが実行される。(ただし、プラグイン取り込み時に、 `!{プラグイン名}:初期化` というメソッド名にリネームされる)

```
{
  '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) { ... }
  }
  ...
}
```

## クリアメソッド

以下のようなエントリを用意しておくと、プログラム終了時（あるいはクリア時）にプラグインごとプログラムが実行される。

```
{
  '!クリア': {
    type: 'func',
    josi: [],
    fn: function (sys) { ... }
  }
  ...
}
```


## プラグイン側からシステム変数へのアクセス

関数を定義したとき、プラグイン関数側からシステムにアクセスしなければならない場合がある。
以下は引数のない関数を定義した例だが、必ず必要とされる引数の末尾に実行したシステムのthisを保持するオブジェクトが渡される。
このオブジェクトを参照することで、システム変数にアクセスできる。

```
{
  type: 'func',
  josi: [],
  fn: function (sys) {
    console.log(sys)
  }
}
```

例えば、なでしこで管理されている変数「A」にアクセスしたいときは、以下のようなコードを記述する。なお、ローカル変数を参照するときpure: trueの関数は正しく動作しない。

```
{
  type: 'func',
  josi: [],
  fn: function (sys) {
    const a = sys.__findVar('A')
    console.log(a)
  }
}
```

そのほかに、なでしこ側で定義した関数「HOGE」を実行したいときは、以下のように記述する。

```
{
  type: 'func',
  josi: [],
  fn: function (sys) {
    const result = sys.__exec('HOGE', [arg1, arg2, arg3, sys])
    console.log(result)
  }
}
```

また、関数の引数に与える、sysはなでしこ自身を表す。
もし、代入的関数呼び出し(setter)であれば、sys.isSetterにtrueの値が入る。


なお、プラグインでは、以下のメソッドが使えるようになる。(すべてsrc/plugin_system.jsで定義されている。システム関数の初期化時に、これらの関数が追加される)

 - sys.__findVar(name)
 - sys.__exec(name, params)

関数内で、システム・グローバル変数にアクセスするには、``sys.__v0['変数名']``でアクセスできる。

なお、最後の助詞を可変長引数として扱う場合、システム変数は末尾の引数の末尾の要素として挿入される。

```
{
  type: 'func',
  josi: [['は'], ['で']],
  isVariableJosi: true,
  fn: function (a, ...b) {
    const sys = b.pop()
    const result = sys.__exec('HOGE', [arg1, arg2, arg3, sys])
    console.log(result)
  }
}
```

## 非同期モードに対応した関数を作る場合

v3.2.22で導入された非同期モードに対応した関数を作るには、以下のように記述を行う。

```
  fn: function (n, sys) {
      if (sys.__genMode == '非同期モード') {
        sys.async = true // 非同期モードを使うことを明示
        setTimeout(() => {
          sys.nextAsync(sys) // ここで非同期処理が完了した時にこの関数を呼ぶ
        }, n * 1000)
      } else {
        // 非同期モードに対応していない時の処理
        throw new Error('「!非同期モード」で使ってください')
      }
  }
```

 - (参考)[秒待機](https://github.com/kujirahand/nadesiko3/blob/f3d51519aff77df04b0d9b1e29ed16914a3f0e74/src/plugin_system.js#L1808)




