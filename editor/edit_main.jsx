// edit_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import dayjs from 'dayjs'

/** @type {Record<string, Record<string, string[][]>>} */
const commandListJSON = require('../release/command.json')
const commandList = /** @type {{ name: String, group: { type: string, name: String, args: string, value: string }[] }[]} */([])
for (const fname of ['plugin_browser', 'plugin_turtle', 'plugin_system']) {
  const groups = commandListJSON[fname]
  if (!groups) {
    console.log('command.jsonの[' + fname + ']が読み込めません。')
    continue // 読み込みに失敗した場合
  }
  for (const [groupName, group] of Object.entries(groups)) {
    commandList.push({
      name: groupName,
      group: group.map(([type, name, args]) => ({ type, name, args, value: (type === '関数') ? ((args + '/').split('/')[0] + name + '。') : name }))
    })
  }
}

// @ts-ignore
const getNako3 = () => /** @type {import('../src/wnako3')} */(navigator.nako3)

/** @type {React.FC<{ onClick: () => void, text: string }>} */
const Button = (props) => <button className='default_button' onClick={props.onClick}>{props.text}</button>

/** @type {React.FC<{ title: string }>} */
const Section = (props) => <section><h5 className='edit_head'>{props.title}</h5>{props.children}</section>

/** @type {React.FC<{ code: string, editorId: number, autoSave?: string }>} */
const Editor = ({ code, editorId, autoSave }) => {
  const preCode = `\
# 自動実行されるコード (編集不可)
カメ描画先は『#nako3_canvas_${editorId}』。
『#nako3_canvas_${editorId}』へ描画開始。
『#nako3_div_${editorId}』へDOM親要素設定。
`

  // エディタの状態
  const [usedFuncs, setUsedFuncs] = React.useState(/** @type {Set<string>} */(new Set()))
  const [showCommandList, toggleCommandList] = React.useReducer((x) => !x, false)

  // ace editor の初期化
  const preCodeEditorRef = /** @type {React.MutableRefObject<HTMLDivElement>} */(React.useRef())
  const editorRef = /** @type {React.MutableRefObject<HTMLDivElement>} */(React.useRef())
  const editor = /** @type {React.MutableRefObject<ReturnType<import('../src/wnako3')['setupEditor']>>} */(React.useRef())
  React.useEffect(() => { getNako3().setupEditor(preCodeEditorRef.current) }, [])
  React.useEffect(() => {
    editor.current = getNako3().setupEditor(editorRef.current)
    if (autoSave) {
      editor.current.editor.on('change', () => {
        window.localStorage[autoSave] = editor.current.editor.getValue()
      })
    }
  }, [])
  const editorOptions = () => ({ preCode, outputContainer: /** @type {HTMLDivElement} */(document.getElementById(`nako3_editor_info_${editorId}`)) })

  return (
    <div>
      <Section title='エディタ'>
        <div ref={preCodeEditorRef} data-nako3-readonly style={{ height: '100px', borderBottom: 'gray 1px solid' }}>{preCode}</div>
        <div className='nako3_editor_code' ref={editorRef}>{code}</div>
        <div className='buttons'>
          <Button
            text='実行' onClick={async () => {
              await editor.current.run({ ...editorOptions() }).promise
              setUsedFuncs(getNako3().usedFuncs)
            }}
          />
          <Button text='テスト' onClick={() => editor.current.run({ ...editorOptions(), method: 'test' })} />
          <Button
            text='クリア' onClick={() => {
              const c = editorOptions().outputContainer
              c.innerHTML = ''
              c.style.display = 'none'
              navigator.nako3.clearPlugins()
            }}
          />
          <Button
            text='↓' onClick={async () => {
              const js = await editor.current.run({ ...editorOptions(), method: 'compile' }).promise
              if (typeof js === 'string') {
                // ファイルのダウンロード
                const link = document.createElement('a')
                link.href = window.URL.createObjectURL(new Blob([js])) // ファイルの中身
                link.download = 'nako3_' + dayjs().format('YYYYMMDDHHmmss') + '.js' // ファイル名
                link.click()
              }
            }}
          />
        </div>
      </Section>
      <Section title='実行結果'>
        <div id={`nako3_editor_info_${editorId}`} className='info' />
        <div id={`nako3_div_${editorId}`} />
        <canvas id={`nako3_canvas_${editorId}`} width='310' height='150' />
      </Section>
      <Section title='使用した命令'><p className='info'>{
      usedFuncs && <span>{
        Array.from(usedFuncs).map((name) => {
          const linkUrl = 'https://nadesi.com/v3/doc/index.php?FrontPage&plugin&name=nako3doc&q=' + encodeURIComponent(name)
          return <span key={name}>[<a href={linkUrl}>{name}</a>]&nbsp;</span>
        })
      }
                   </span>
    }
                              </p>
      </Section>
      <Section title='命令の一覧'>
        <div style={{ paddingTop: '8px' }}>
          <Button text={showCommandList ? '命令の一覧を隠す' : '命令の一覧を表示する'} onClick={toggleCommandList} />
        </div>
        {showCommandList && <ul>{
        commandList.map(({ group, name }) => <li key={name}>
          <div style={{ color: '#55c' }}>{name}</div>
          <div style={{ marginLeft: '12px' }}>{group.map(({ value, name }, i) =>
            <span
              key={i} style={{ marginRight: '12px', cursor: 'pointer' }} onClick={() => {
                // カーソル位置に命令を挿入する。
                editor.current.editor.session.insert(editor.current.editor.getCursorPosition(), value)
              }}
            >[{name}]
            </span>)}
          </div>
                                             </li>)
      }
        </ul>}
      </Section>
    </div>
  )
}

try {
  for (const [i, e] of Array.from(Array.from(document.getElementsByClassName('editor-component')).entries())) {
    const data = JSON.parse(e.getElementsByTagName('script')[0].text)
    let code = data.code
    if (data.autoLoad && window.localStorage['nako3/editor/code']) {
      code = window.localStorage['nako3/editor/code']
    }
    ReactDOM.render(<Editor code={code} editorId={i} autoSave={data.autoLoad ? 'nako3/editor/code' : undefined} />, e)
  }
} catch (err) {
  console.error(err) // IE11
}
