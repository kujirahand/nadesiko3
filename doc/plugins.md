# プラグインのAPIの仕様

## Webプラグインの追加手順

メインHTMLで以下のファイルを読み込む
- wnako3.js
  - navigator.nako3にコンパイラのインスタンスが作成される
- 独自プラグイン

## プラグイン側の実装

プラグインの実体は、Object。

```
{ '命令名': { 定義 }, '命令名': { 定義 } ... }
```

### 定義：関数

```
{
  type: 'func',
  josi: [['を', 'から'], ['まで']],
  fn: function (s) { ... }
}
```

### 定義：定数

```
{ type: 'const', value: 100 }
```

### プラグインの自動登録

プラグインの末尾に以下のコードを仕込むことによって、scriptタグで読み込んだと同時に、システムに登録することができる。

```
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject(プラグイン名, オブジェクト)
}
```

## 初期化メソッド

以下のようなエントリを用意しておくと、プラグインを取り込み、初回実行する時に、初期化メソッドが実行される。(ただし、プラグイン取り込み時に、「!{プラグイン名}:初期化」というメソッド名にリネームされる。）

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

そのほかに、なでしこ側で定義した関数「HOGE」を実行したい時は、以下のように記述する。

```
{
  type: 'func',
  josi: [],
  fn: function (sys) {
    const result = sys.__exec('HOGE', [arg1, arg2, arg3])
    console.log(result)
  }
}
```

sys.__findVar(name) や sys.__exec(name, params) は、すべて src/plugin_system.jsで定義されている。
つまり、システム関数の初期化時に、これらの関数が追加される。


