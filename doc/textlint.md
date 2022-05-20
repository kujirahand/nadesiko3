# textlint について

配布パッケージのスリム化のために、必要性が低いパッケージについては、別途グローバルにインストールして、時々チェックするという方針にした。([参考#1231](https://github.com/kujirahand/nadesiko3/issues/1231))

そのため、textlint のセットアップ方法については、ここで別途書いておく。

> なお、`git push`したときには、GitHub側でtextlintが自動でかかるため、コミットしてエラーが出たら、以下の項目を実施すること。
> [(参照)`.github/workflows/textlint.yml`](.github/workflows/textlint.yml)を参照。

## textlint のインストール

```shell
npm install -g textlint \
  textlint-rule-abbr-within-parentheses \
  textlint-rule-footnote-order \
  textlint-rule-general-novel-style-ja \
  textlint-rule-ja-hiragana-fukushi \
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
  textlint-rule-spellcheck-tech-word \
 ```

## textlint の実行

textlintの実行

```shell
textlint *.md && textlint doc/*.md && textlint batch/*.md && textlint tools/*.md
```

textlintで自動修正

```shell
textlint --fix *.md && textlint --fix doc/*.md && textlint --fix batch/*.md && textlint --fix tools/*.md
```
