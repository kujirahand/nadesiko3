import * as esbuild from 'esbuild'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// esbuild でバンドルするファイルのリスト
const files = [
  // main code
  'src/wnako3.mts',
  // mjs
  'src/wnako3webworker.mjs',
  'src/plugin_webworker.mjs',
  'src/plugin_kansuji.mjs',
  'src/plugin_markup.mjs',
  'src/plugin_datetime.mjs',
  'src/plugin_caniuse.mjs',
  // mts
  'src/plugin_keigo.mts',
  'src/plugin_three.mts',
  'src/plugin_turtle.mts',
  'src/plugin_weykturtle3d.mts',
  'editor/edit_main.jsx',
  'editor/version_main.jsx'
]
const outdir = path.join(__dirname, 'release')
const watch = process.argv.includes('--watch')

// create outdir
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir)
  console.log(`[esbuild] created ${outdir}`)
}
// build options
const options = {
  entryPoints: files,
  bundle: true,
  outdir,
  minify: true,
  sourcemap: true,
}
if (!watch) {
  await esbuild.build(options)
  // 例外的なコピー
  const src = path.join(outdir, 'edit_main.js')
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outdir, 'editor.js'))
    fs.copyFileSync(path.join(outdir, 'version_main.js'), path.join(outdir, 'version.js'))
  }
} else {
  const ctx = await esbuild.context(options)
  await ctx.watch()
}
