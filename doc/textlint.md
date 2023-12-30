# textlint について

配布パッケージのスリム化のために、必要性が低いパッケージについては、別途グローバルにインストールして、時々チェックするという方針にした。([参考#1231](https://github.com/kujirahand/nadesiko3/issues/1231))

そのため、textlintのセットアップ方法については、ここで別途書いておく。

> なお、`git push`したときには、GitHub側でtextlintが自動でかかるため、コミットしてエラーが出たら、以下の項目を実施すること。
> [→GitHub側で実行されるtextlint](/.github/workflows/textlint.yml)

## textlint のインストール

```sh
npm install -g textlint \
  textlint-rule-abbr-within-parentheses \
  textlint-rule-footnote-order \
  textlint-rule-general-novel-style-ja \
  textlint-rule-ja-hiragana-hojodoushi \
  textlint-rule-ja-hiragana-keishikimeishi \
  textlint-rule-ja-unnatural-alphabet \
  textlint-rule-ng-word \
  textlint-rule-no-dead-link \
  textlint-rule-no-mixed-zenkaku-and-hankaku-alphabet \
  textlint-rule-prefer-tari-tari \
  textlint-rule-preset-ja-spacing \
  textlint-rule-preset-ja-technical-writing \
  textlint-rule-preset-jtf-style \
  @proofdict/textlint-rule-proofdict \
  @textlint-ja/textlint-rule-no-insert-dropping-sa
 ```

## textlint の実行

`bach/textlint.sh`を実行して結果を確認します。

### コマンドラインから textlint を実行する場合

手動の場合、次のコマンドを実行します。

```sh
textlint *.md && textlint doc/*.md && textlint batch/*.md && textlint tools/*.md
```

textlintで自動修正する場合は次のコマンドを実行します。

```sh
textlint --fix *.md && \
  textlint --fix doc/*.md && \
  textlint --fix batch/*.md && \
  textlint --fix tools/*.md
```
