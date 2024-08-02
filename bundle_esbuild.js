import * as esbuild from 'esbuild'

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

const watch = process.argv.includes('--watch')
const ctxArray = []

// bundle
for (const file of files) {
  // output filename
  const out = file
    .replace(/\.(mts|mjs|jsx)$/, '.js')
    .replace(/^(src|editor)\//, 'release/')
  console.log('-', out)
  // build
  const ctx = await esbuild.context({
    entryPoints: [file],
    bundle: true,
    outfile: out,
    minify: true,
    sourcemap: true,
  })
  ctxArray.push(ctx)
}
for (const ctx of ctxArray) {
  const result = await ctx.rebuild()
  if (result.errors.length > 0) {
    console.warn(result)
  }
}

// watch
if (watch) {
  for (const ctx of ctxArray) {
    await ctx.watch()
  }
}
