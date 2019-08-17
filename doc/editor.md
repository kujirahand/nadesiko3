# エディタの仕様

## 通常のエディタ
HTMLに以下のコードを挿入することでエディタを実装できる。

```html
...
<head>
  ...
  <script src="https://unpkg.com/mocha/mocha.js"></script>
  ...
</head>
<body>
  ...
  <div class="editor-component">
    <script type="application/json">
      {
        "title": "{タイトル (エディタのtitle属性)}",
        "code": "{エディタに入力するコードの初期値}"
      }
    </script>
  </div>
  ...
</body>
...
```
