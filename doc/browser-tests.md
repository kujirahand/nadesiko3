# ブラウザ系テストの現状メモ

`test/` 配下には、次のブラウザ系テストがあります。

- `npm run test:browser` … Browser プラグインの smoke test
- `npm run test:browser:full` … 旧来の browser 総合テスト
- `npm run test:ace-editor` … Ace Editor の smoke test
- `npm run test:ace-editor:full` … 旧来の ace editor 総合テスト
- `npm run test:bundled` … release 済みエディタの bundled test
- `npm run test:selenium` … Selenium の smoke test
- `npm run test:selenium:full` … 旧来の Selenium 総合テスト

## 旧来テストがそのままでは動かなかった理由

- Karma 関連パッケージが `package.json` から外れていた
- Ace Editor テストが CDN 上の `ace.js` に依存していた
- Selenium ラッパーが失敗時でも終了コード `0` を返していた
- 画像比較や WebWorker を含む一部テストは、ブラウザ差分の影響を受けやすい

## 現在の方針

GitHub Actions では、安定して動く smoke test を既定で実行します。
既存の重い総合テストは `*:full` として残し、ローカルでの詳細調査用に使います。

## GitHub で実行する構成

`.github/workflows/nodejs.yml` では Node.js の通常テストに加えて、`24.x` で以下を実行します。

- `npm run test:browser`
- `npm run test:ace-editor`
- `npm run test:bundled`
- `python3 -m pip install -r test/selenium/requirements.txt`
- `npm run test:selenium`

## 今後の改善案

- browser / ace / selenium の full suite を段階的に分割し、失敗要因ごとに独立させる
- 画像比較のようにブラウザ差分を受けやすいテストは、許容差付き比較に置き換える
- WebWorker や turtle のような重い統合テストは、CI の smoke と別ジョブに分離する
