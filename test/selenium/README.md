# SeleniumとGoogle Chromeで実行テスト

簡単なWebベースのテスト。
test_target以下になでしこ3のプログラムを配置する。

## Setup

実行には、PHP8/Python3/Chromeが必要です。

```
$ python3 -m pip install -r requirements.txt
```

## テストの実行

PORT=8887を使います。

```
$ bash ./gotest.sh
```

## ブラウザ上でスクリプトを実行したい場合

```
$ ./server-start.sh
```

その後、index.php?m=file&f=スクリプト名

## 任意のファイルだけテストしたい場合

test_targetにファイルを配置しているものとして

```
$ python3 test_chrome.py スクリプト名
```

例えば、test_target/ajax.nako3をテストする場合:

```
$ ./server-start.sh
$ python3 test_chrome.py ajax.nako3
```


