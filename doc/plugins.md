# プラグインのAPIの仕様

## Webプラグインの追加手順

メインHTMLで以下のファイルを読み込む
- wnako3.js
  - ブラウザのオブジェクト「navigator」のプロパティ「nako3」(navigator.nako3)にコンパイラのインスタンスが作成される
- 独自プラグイン

## プラグイン側の実装

プラグインの実体は、Object。

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

### 定義：定数

```
{ type: 'const', value: 100 } // @ヨミガナ
```

### プラグインの自動登録

プラグインの末尾に以下のコードを仕込むことによって、scriptタグで読み込んだと同時に、システムに登録できる。

```
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject(プラグイン名, オブジェクト)
}
```

## 初期化メソッド

以下のようなエントリを用意しておくと、プラグインを取り込み、初回実行するときに、初期化メソッドが実行される。(ただし、プラグイン取り込み時に、「!{プラグイン名}:初期化」というメソッド名にリネームされる）

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

## プラグイン側からシステム変数へのアクセス

関数を定義したとき、プラグイン関数側からシステムにアクセスすることが必要な場合がある。
以下は、引数のない関数を定義した例だが、必ず、必要とされる引数の末尾に、実行したシステムのthisを保持するオブジェクトが渡される。
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

例えば、なでしこで管理されている変数「A」にアクセスしたいときは、以下のようなコードを記述する。

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
