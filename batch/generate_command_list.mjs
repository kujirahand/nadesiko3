import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const inputPath = path.join(projectRoot, 'batch', 'command.txt')
const outputDir = path.join(projectRoot, 'docs')
const outputPath = path.join(outputDir, 'command_list.json')

function main () {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(inputPath, 'utf-8')
  const lines = content.split(/\r?\n/)

  let currentPlugin = ''
  let currentGroup = ''
  let currentTarget = []
  let currentCategory = ''

  const result = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    // プラグイン宣言行: ■plugin_system(基本プラグイン,wnako,cnako,phpnako) または ■plugin_system
    const pluginMatch = trimmed.match(/^■([^\(]+)(?:\((.+)\))?/)
    if (pluginMatch) {
      currentPlugin = pluginMatch[1].trim()
      if (pluginMatch[2]) {
        const params = pluginMatch[2].split(',').map((s) => s.trim())
        currentGroup = params[0] || ''
        currentTarget = params.slice(1)
      } else {
        currentGroup = ''
        currentTarget = []
      }
      currentCategory = ''
      continue
    }

    // カテゴリ宣言行: ●システム定数
    const categoryMatch = trimmed.match(/^●(.+)/)
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim()
      continue
    }

    // 命令・定数データ行: | タイプ | 名前 | 引数 | 説明または値 | よみ | URL
    if (trimmed.startsWith('|')) {
      const parts = trimmed.split('|').map((s) => s.trim())
      // split('|') の先頭は空文字列（| の前）
      // parts[1]: タイプ, parts[2]: 名前, parts[3]: 引数, parts[4]: 説明/値, parts[5]: よみ, parts[6]: URL
      if (parts.length >= 7) {
        const type = parts[1]
        const name = parts[2]
        const args = parts[3]
        const descOrVal = parts[4]
        const yomi = parts[5]
        const url = parts[6]

        const item = {
          type,
          name,
          args,
          yomi,
          plugin: currentPlugin,
          group: currentGroup,
          target: currentTarget,
          category: currentCategory,
          url
        }

        if (type === '定数') {
          item.value = descOrVal
        } else {
          item.description = descOrVal
        }

        result.push(item)
      }
    }
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`Successfully generated ${outputPath} (${result.length} commands)`)
}

main()
