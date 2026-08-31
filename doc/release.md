# なでしこ3のリリース手順

なでしこ3の新しいバージョンを公開する手順をまとめます。以下の例では、公開するバージョンを`X.Y.Z`、関連するIssue番号を`ISSUE_NUMBER`と表記します。

## 1. リリース用のPRを作成

最初に`master`を最新にし、作業ツリーに別の変更がないことを確認します。

```sh
git switch master
git pull --ff-only origin master
git status --short
git switch -c verX_Y_Z
```

ルートの`package.json`にある`version`を`X.Y.Z`へ変更します。その後、リリース用ファイルを生成します。

```sh
npm run build
```

`npm run build`によって、次の4ファイルのバージョンが同期されます。

- `package.json`
- `core/package.json`
- `src/nako_version.mts`
- `core/src/nako_core_version.mts`

意図しないファイルが変更されていないことを確認します。

```sh
git status --short
git diff --check
git diff -- package.json core/package.json src/nako_version.mts core/src/nako_core_version.mts
```

## 2. ビルドとテスト

リリース前には、必ずビルドとテストを実行します。

```sh
npm run build
npm test
npm run test:all
```

すべて成功したら、対象ファイルだけを明示してコミットします。リリースに無関係なファイルは含めないでください。

```sh
git add package.json core/package.json src/nako_version.mts core/src/nako_core_version.mts
git commit -m "verX.Y.Z"
git push -u origin verX_Y_Z
```

`master`向けのPRを作成します。PRの本文には、必ず関連するIssue番号を記載します。

```sh
gh pr create \
  --base master \
  --head verX_Y_Z \
  --title "verX.Y.Z" \
  --body "verX.Y.Z

Refs #ISSUE_NUMBER"
```

PRでは、差分が意図したファイルだけであることと、CIがすべて成功したことを確認してからマージします。

## 3. GitHub Releaseを作成

PRをマージしたら、[GitHubのReleases](https://github.com/kujirahand/nadesiko3/releases)で`vX.Y.Z`のリリースを作成します。変更点と関連Issueをリリースノートに記載します。

## 4. npmへ公開

`master`を最新にし、`package.json`のバージョンとテスト結果を再確認してから公開します。

```sh
git switch master
git pull --ff-only origin master
npm run build
npm test
npm publish
```

公開後、npm上のバージョンを確認します。

```sh
npm view nadesiko3 version
```

## 5. Webサイトを更新

Webの簡易エディタを最新版に更新します。

- [なでしこ3のサイト](https://nadesi.com/doc3/)
- [マニュアル](https://nadesi.com/doc3/)
- [貯蔵庫](https://n3s.nadesi.com/)

必要に応じて対応ブラウザを更新します。`npm run build:browsers`はOSによって異なる値を生成するため、通常のビルドには含まれていません（#1211）。

```sh
npm run build:browsers
```

## 6. Windowsバイナリ版を更新

Windows用リポジトリを生成するため、ファイルを`nadesiko3win32`へコピーします。事前に同リポジトリを隣のディレクトリへcloneしておきます。

```sh
npm run build:win32
bash ./win32.bash
cd ../nadesiko3win32
```

Windowsで依存モジュールを更新し、7-Zipで固めます。

```bat
nodejs\npm install --production
nodejs\npm audit fix
bin\7z -mx=9 a node_modules.7z node_modules
```

生成内容を確認してから、`nadesiko3win32`リポジトリへコミットしてpushします。
