# プラグインのAPIの仕様

## Webプラグインの追加手順

- メインHTMLで、wnako3.js を読み込む
  - navigator.nako3 にコンパイラのインスタンスが作成される
- script src="plugin_xxx.js で独自プラグインを読み込む
- navigator.nako3.addPluginObject(プラグイン名, オブジェクト)

## プラグイン側の実装

プラグインの実体は、Object。

```
{ "命令名":{ 定義 }, "命令名": { 定義 } ... }
```

定義：関数

```
{ type:"func", josi: [["を","から"], ["まで"]],
  fn: function(s) { ... }
}
```

定義：定数

```
{ type: "const", value: 100 }
```

## プラグイン側からシステム変数へのアクセス



