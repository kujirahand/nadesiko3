import core from '../index.mjs'

const main = async () => {
  const com = new core.NakoCompiler()
  const g = await com.runAsync('1 + 2 * 3を表示', 'main.nako3')
  console.log(g.log)
}
await main()
