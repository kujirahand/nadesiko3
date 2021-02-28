import React from 'react'

/**
 * コマンドのリストを表示する。コマンドをクリックするとその値を引数に与えてonClickを呼ぶ。
 * @type {React.FC<{ onClick?: (value: string) => void }>}
 */
const CommandList = (props) => {
  const files = ['plugin_browser.js', 'plugin_turtle.js', 'plugin_system.js']
  const [list, setList] = React.useState(/** @type {{ name: string, group: string[][] }[]} */([]))

  React.useEffect(() => {
    fetch('../release/command.json')
      .then((res) => res.json())
      .then((/** @type {Record<string, Record<string, string[][]>>} */json) => {
        const result = /** @type {{ name: String, group: string[][] }[]} */([])
        for (const fname of files.map((v) => v.replace(/\.js$/, ''))) {
          const groups = json[fname]
          if (!groups) {
            console.log('command.jsonの[' + fname + ']が読み込めません。')
            continue // 読み込みに失敗した場合
          }
          for (const name in groups) {
            result.push({ name, group: groups[name] })
          }
        }
        setList(result)
      })
      .catch((err) => { console.error(err) })
  }, [])

  return <ul>{
    list.map(({ group, name }) => <li key={name}>
      <div style={{ color: '#55c' }}>{name}</div>
      <div style={{ marginLeft: '12px' }}>{
        group.map(([type, name, args], i) => {
          const value = (type === '関数') ? ((args + '/').split('/')[0] + name + '。') : name
          return <span key={i} style={{ marginRight: '12px', cursor: 'pointer' }} onClick={() => props.onClick?.(value)}>[{name}]</span>
        })
      }</div>
    </li>)
  }</ul>
}

export default CommandList
