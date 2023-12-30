# エディタの仕様

## 通常のエディタ

HTMLに次のコードを挿入することでエディタを実装できる。

```html
...
<head>
  <link rel="stylesheet" type="text/css" href="basic.css">
  <link rel="stylesheet" href="../src/wnako3_editor.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js"
    integrity="sha512-GZ1RIgZaSc8rnco/8CXfRdCpDxRCphenIiZ2ztLy3XQfCbQUSCuk8IudvNHxkRA3oUg6q0qejgN/qqyG1duv5Q=="
    crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ext-language_tools.min.js"
    integrity="sha512-8qx1DL/2Wsrrij2TWX5UzvEaYOFVndR7BogdpOyF4ocMfnfkw28qt8ULkXD9Tef0bLvh3TpnSAljDC7uyniEuQ=="
    crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ext-options.min.js"
    integrity="sha512-oHR+WVzBiVZ6njlMVlDDLUIOLRDfUUfRQ55PfkZvgjwuvGqL4ohCTxaahJIxTmtya4jgyk0zmOxDMuLzbfqQDA=="
    crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ext-code_lens.min.js"
    integrity="sha512-gsDyyKTnOmSWRDzUbpYcPjzVsEyFGSWeWefzVKvbMULPR2ElIlKKsOtU3ycfybN9kncZXKLFSsUiG3cgJUbc/g=="
    crossorigin="anonymous"></script>
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
  <script src="../release/wnako3.js"></script>
  <script src="../release/editor.js"></script>
  ...
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mocha/8.3.0/mocha.min.js"
    integrity="sha512-LA/TpBXau/JNubKzHQhdi5vGkRLyQjs1vpuk2W1nc8WNgf/pCqBplD8MzlzeKJQTZPvkEZi0HqBDfRC2EyLMXw=="
    crossorigin="anonymous"></script>
</body>
...
```
