# Dockerfile の使い方

この `Dockerfile` は、なでしこ3のビルド済み実行環境を作成します。
作成したイメージでは、`cnako3`、`nako3server`、`nako3edit` コマンドを利用できます。

## イメージを作成

```sh
docker build -t nadesiko3 .
```

## なでしこプログラムを実行

ワンライナーを実行する例です。

```sh
docker run --rm nadesiko3 cnako3 -e "「こんにちは」と表示"
```

ローカルの `.nako3` ファイルを実行する場合は、現在のディレクトリをコンテナへマウントします。

```sh
docker run --rm -v "$PWD:/work" -w /work nadesiko3 cnako3 sample.nako3
```

## なでしこサーバーを起動

コンテナ内の `nako3server` は標準で 3000 番ポートを使います。

```sh
docker run --rm -p 3000:3000 nadesiko3 nako3server
```

起動後、ブラウザで次のURLを開きます。

```text
http://localhost:3000/
```

## なでしこエディタを起動

コンテナ内の `nako3edit` は標準で 8888 番ポートを使います。

```sh
docker run --rm -p 8888:8888 nadesiko3 nako3edit
```

起動後、ブラウザで次のURLを開きます。

```text
http://localhost:8888/
```

作成したファイルをコンテナ終了後も残す場合は、保存先ディレクトリをマウントします。

```sh
mkdir -p nadesiko3_user
docker run --rm -p 8888:8888 -v "$PWD/nadesiko3_user:/root/nadesiko3_user" nadesiko3 nako3edit
```

## ポート番号を変更

例えば、ホスト側の 8080 番で開く場合は次のようにします。

```sh
docker run --rm -p 8080:3000 nadesiko3 nako3server
```

コンテナ内のポート番号も変更したい場合は、`PORT` 環境変数を指定します。

```sh
docker run --rm -e PORT=8080 -p 8080:8080 nadesiko3 nako3server
```

`nako3edit` のコンテナ内ポート番号を変更する場合は、`NAKO3EDIT_PORT` 環境変数を指定します。

```sh
docker run --rm -e NAKO3EDIT_PORT=8088 -p 8088:8088 nadesiko3 nako3edit
```

## ヘルプを表示

```sh
docker run --rm nadesiko3
docker run --rm nadesiko3 cnako3 --help
```
