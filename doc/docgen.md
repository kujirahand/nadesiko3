# なでしこ3のマニュアルについて

なでしこ3の[マニュアル](https://nadesi.com/v3/doc/)はkonawiki3形式になっており、[こちら](https://github.com/kujirahand/nadesiko3doc)で保守されている。

## 命令一覧ページ

なお、[命令一覧ページ](https://nadesi.com/v3/doc/index.php?%E5%91%BD%E4%BB%A4%E4%B8%80%E8%A6%A7%2F%E6%A9%9F%E8%83%BD%E9%A0%86)の目次と概要は、マニュアル生成スクリプトにより生成されている。リポジトリ内のソースコードのマニュアルの自動生成は以下のコマンドで生成できる。

```sh
npm build:command
```

## 独自のプラグインの目次を生成するには

独自のプラグインを作った場合、マニュアル生成機能を利用して、独自のマニュアルを生成できる。

```sh
cnako3 batch/jsplugin2text.nako3 /plugin/path/nadesiko3-xxx
```

生成したテキストは、konawiki3 形式となっている。
