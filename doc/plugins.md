# プラグインのAPIの仕様

なでしこ3には、次の二種類のプラグインがある。

- (1) なでしこ3自身で開発した[NAKO3プラグイン](https://nadesi.com/v3/doc/index.php?%E6%96%87%E6%B3%95%2FNAKO3%E3%83%97%E3%83%A9%E3%82%B0%E3%82%A4%E3%83%B3%E3%81%AE%E4%BD%9C%E3%82%8A%E6%96%B9&show)
- (2) JavaScriptで開発した[JSプラグイン](https://nadesi.com/v3/doc/index.php?%E6%96%87%E6%B3%95%2FJS%E3%83%97%E3%83%A9%E3%82%B0%E3%82%A4%E3%83%B3%E3%81%AE%E4%BD%9C%E3%82%8A%E6%96%B9&show)

なお、(1)のプラグインは、なでしこ自身で関数を定義するもの。
以下では、(2)のJavaScriptで開発したプラグインについて解説する。

## JSプラグインを利用する手順

次の2つの方法で利用ができる。

- (1)「[取り込む構文](https://nadesi.com/v3/doc/index.php?%E6%96%87%E6%B3%95%2F%E3%83%97%E3%83%A9%E3%82%B0%E3%82%A4%E3%83%B3%E5%8F%96%E8%BE%BC&show)」を使ってプラグインを取り込める。
- (2) HTMLファイル内でなでしこ本体(wnako3.js)よりも後ろで`<script src="(JSプラグイン).js">`と記述して読み込む。

なお「wnako3.js」を読み込むと、ブラウザの「navigator」オブジェクトにプロパティ「nako3」(navigator.nako3)にコンパイラのインスタンスが作成される。

## 最も簡単なプラグイン

足し算するだけの関数「テスト加算」と引き算するだけの関数「テスト減算」を定義するには次のように記述する。
ただし、以下はESModules対応版のため、`cnako3`から使う場合は拡張子を`.mjs`で保存する必要がある。

```js
// file: testfunc.mjs
// なでしこ3プラグインはモジュールオブジェクト
default export {
  'テスト加算': {
      type: 'func',
      josi: [['と'],['を']],
      fn: function (a, b) {
        return a + b
      }
  },
  'テスト減算': {
      type: 'func',
      josi: [['から'],['を']],
      fn: function (a, b) {
        return a - b
      }
  }
}
```

上記プログラムを使うには、同じフォルダに次のような、なでしこ3のプログラムを記述する。

```nako3
!「./testfunc.mjs」を取り込む。
7と2をテスト加算して表示。 # 結果 →9
10から3をテスト減算して表示。# 結果 → 7
```

## プラグイン側の実装方法

プラグインの実体は、Object。

```js
{
  '定数名': { 定義 },
  '命令名': { 定義 },
  ...
}
```

### 定義：関数

プラグインの実体は、Object。実際の関数定義は、fnプロパティに行う。実際の関数の引数に加えて、システムを表すsysを用意する。

```js
{
  '関数名': { // @関数の説明 // @ヨミガナ
    type: 'func', // 関数であれば func にする
    josi: [['を', 'から'], ['まで']], // 助詞を配列で宣言する (可変長引数として扱いたい助詞は末尾で宣言する)
    isVariableJosi: false, // 末尾の助詞を可変長引数として扱う場合 true にする
    uses: [], // この関数から別の関数を呼ぶ場合に記述する // (TODO: #282)
    asyncFn: false, // async関数定義かPromiseを返す関数を定義する場合 true にする (参照: #1154)
    fn: function (aFrom, aTo, sys) { ... }, // 関数の実態
    return_none: false // 戻り値を返すかどうか
  },
  ...
}
```

なお、コメントを記述した場合、`npm run build:command`を実行すると自動的にコマンドマニュアルが生成される。

### 定義：定数

typeプロパティに「const」を指定して、valueプロパティに値を指定する。

```js
{ type: 'const', value: 100 } // @ヨミガナ
```

### 定義：変数

typeプロパティに「var」を指定して、valueプロパティに値を指定する。

```js
{ type: 'var', value: 100 } // @ヨミガナ
```

### プラグインの自動登録

プラグインの末尾に次のコードを仕込むとscriptタグで読み込んだときシステムに登録できる。

```js
if (typeof (navigator) === 'object') {
  navigator.nako3.addPluginObject(プラグイン名, オブジェクト)
}
```

## 初期化メソッド

次のようなエントリを用意しておくと、プラグインを取り込み、初回実行するときに初期化メソッドが実行される。
(ただし、プラグイン取り込み時に、 `!{プラグイン名}:初期化` というメソッド名にリネームされる)

```js
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

次のようなエントリを用意しておくと、プログラム終了時（あるいはクリア時）にプラグインごとプログラムが実行される。

```js
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

```js
'xxx': {
  type: 'func',
  josi: [],
  fn: function (sys) {
    console.log(sys)
  }
}
```

例えば、なでしこで管理されている変数「A」にアクセスしたいときは、次のようなコードを記述する。なお、ローカル変数を参照するときpure: trueの関数は正しく動作しない。

```js
'xxx': {
  type: 'func',
  josi: [],
  fn: function (sys) {
    const a = sys.__findVar('A')
    console.log(a)
  }
}
```

そのほかに、なでしこ側で定義した関数「HOGE」を実行したいときは、次のように記述する。

```js
'xxx': {
  type: 'func',
  josi: [],
  fn: function (sys) {
    const result = sys.__exec('HOGE', [arg1, arg2, arg3, sys])
    console.log(result)
  }
}
```

また、関数の引数に与える、sysはなでしこのシステム情報を保持する。
もし、代入的関数呼び出し(setter)であれば、sys.isSetterにtrueの値が入る。

なお、プラグインでは、次のメソッドが使えるようになる。(すべてsrc/plugin_system.jsで定義されている。システム関数の初期化時に、これらの関数が追加される)

- sys.__findVar(name)
- sys.__exec(name, params)

関数内で、システム・グローバル変数にアクセスするには、``sys.__v0['変数名']``でアクセスできる。

なお、最後の助詞を可変長引数として扱う場合、システム変数は末尾の引数の末尾の要素として挿入される。

```js
'xxx': {
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

## 非同期処理に対する関数を作る場合

v3.3で`asyncFn`が導入された(参照： #1154)。このプロパティを`true`に設定した場合、関数は非同期処理で実行される。
つまり、この関数を呼び出す前に、自動的に`await`が指定される。そのため、`asyncFn`を`true`とした場合、Promiseのオブジェクトを返すようにする。

```js
'xxx': {
  type: 'func',
  josi: [['で']],
  asyncFn: true, // 非同期処理であることを明示
  fn: function (msec, sys) {
    // asyncFnをtrueにしたら、必ずPromiseを返すようにする
    return new Promise((resolve, _reject) => {
      setTimeout(()=>{
        resolve()
      }, msec)
    })
  }
}
```

あるいは、次のように、`async` をつけて関数を定義する。このように書くと、自動的にPromiseオブジェクトを返す。

```js
'xxx': {
  type: 'func',
  josi: [['で']],
  asyncFn: true, // 非同期処理であることを明示
  fn: async function (msec, sys) {
    // ここで非同期処理
  }
}
```

この機能の追加により、`「!非同期モード」`や`「逐次実行」`の利用は非推奨となった。

## (非推奨) 非同期モードに対応した関数を作る場合

v3.2.22で導入された非同期モードの利用は非推奨となったが、非同期モードに対応した関数を作るには、次のように記述する。
なお、今後、非同期関数を利用するには、上記asyncFnを使うこと。

```js
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

## マニュアルを自動生成する

- [doc/docgen.md](docgen.md) にマニュアル自動生成のスクリプトが紹介されている。
