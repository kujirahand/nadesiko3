import { build } from 'esbuild';

await build({
  entryPoints: ['src/cnako3.mts'], // エントリーポイントとなるTypeScriptファイル
  bundle: true,
  platform: 'node', // Node.js向けにバンドル
  target: ['node18'], // ターゲットとするNode.jsのバージョン
  outfile: 'release_node/cnako3.mjs', // 出力ファイル名
  tsconfig: 'tsconfig.json', // TypeScriptの設定ファイル
  // sourcemap: true, // ソースマップを生成
  format: 'esm' // モジュール形式はES Modules
})

