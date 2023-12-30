# nadesko3win32 について

[nadesiko3win32](https://github.com/kujirahand/nadesiko3win32)はなでしこv3のWindows版です。

## nadesiko3win32の経緯

当初、Node.jsとなでしこのリポジトリを合わせた簡単な仕組みのものでした。バッチファイルで`npm isntall`を実行し動作環境を整えていました。

しかし、意外にも制限されたネット環境などnpmを利用したモジュールのインストールが不可能な環境は多く、仕方なくすべてのnode_modulesをリポジトリに梱包することとなります。

ところが、さらなる問題に直面します。node_modules次のパスが非常に深いため、単純なZIP圧縮したアーカイブをWindows標準の解凍ツールではエラーが出てしまうのです。この問題を特定するには多大な時間がかかりました。

そこで、Node.jsのアーカイブと、node_modulesを個別に7zで固めてなでしこの初回実行時に7zのアーカイブを解凍する形式に変更しました。そして、現在に至ります。

## アーカイブの更新方法

nadesiko3のリポジトリで、モジュールをビルドします。そして、build:win32を実行して、win32用のファイルを整えます。

```shell
npm run build
npm run build:win32
```

上記コマンドを実行すると、bashスクリプトが生成されるので、指示に従ってbashスクリプトを実行します。(LinuxかmacOSで実行します)

### Node.jsの更新方法

Node.jsのアーカイブ一式をプロジェクトの`/nodejs`フォルダに配置します。そのため、Node.jsの最新版をnodejsフォルダ以下にコピーします。さらに、次のコマンドを実行して、7zのアーカイブを作成してGitリポジトリにコミットします。

```shell
.\bin\7z.exe a nodejs.7z nodejs
```

なお、現在、32ビット版のNode.jsを利用していますので、ビット数に注意します。

### node_modules

上記でコピーした32ビット版のNode.jsでモジュールをインストール（ビルド）します。バイナリのモジュールを使う場合、PowerShellを管理者権限で起動し、次のコマンドを発行してビルドツールを整える必要があります。

この時、ネットワークフォルダ上では正しくnpmが動作しないため、ユーザーフォルダに一式を配置して実行する必要があります。

```shell
.\nodejs\npm install --global --production windows-build-tools
```

そして、なでしこに必要なモジュールをインストールします。なお、win32版は標準モジュールに加えて、次のモジュールを追加でインストールします。

```shell
# 基本
.\nodejs\npm install --production
# 追加モジュールをインストール
.\nodejs\npm install nadesiko3-sqlite3sync
.\nodejs\npm install nadesiko3-htmlparser
.\nodejs\npm install nadesiko3-websocket
# 圧縮
.\bin\7z.exe a node_modules.7z node_modules
```
