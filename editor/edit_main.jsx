// edit_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import 'mocha-css'
import dayjs from 'dayjs'
import CommandList from './command_list'

/** @returns {import('../src/wnako3')} */
const getNako3 = () => navigator.nako3

/** @param {string} id @returns {HTMLElement} */
const mustGetElementById = (id) => {
  const element = document.getElementById(id)
  if (element === null) {
    throw new Error(`idが${id}の要素は存在しません。`)
  }
  return element
}

/** @type {React.FC<{ code: string, editorId: number }>} */
const Editor = ({ code, editorId }) => {
  const preCode = `\
  # 自動実行されるコード (編集不可)
  カメ描画先は『#nako3_canvas_${editorId}』。カメ全消去。
  『#nako3_canvas_${editorId}』へ描画開始。
  『#nako3_div_${editorId}』へDOM親要素設定。
  `

  // エディタの状態
  const [usedFuncs, setUsedFuncs] = React.useState(/** @type {Set<string>} */(new Set()))
  const [showCommandList, setShowCommandList] = React.useState(false)

  /** @type {React.MutableRefObject<ReturnType<import('../src/wnako3')['setupEditor']> | null>} */
  const editor = React.useRef(null)

  // 各ボタンが押された時の動作
  const run = React.useCallback(async () => {
    await editor.current?.run({ preCode, outputContainer: mustGetElementById(`nako3_editor_info_${editorId}`) }).promise
    setUsedFuncs(getNako3().usedFuncs)
  }, [])
  const test = React.useCallback(() => { editor.current?.run({ preCode, outputContainer: mustGetElementById(`nako3_editor_info_${editorId}`), method: 'test' }) }, [])
  const clear = React.useCallback(() => { mustGetElementById(`nako3_editor_info_${editorId}`).innerHTML = '' }, [])
  const download = React.useCallback(async () => {
    const js = await editor.current?.run({ preCode, outputContainer: mustGetElementById(`nako3_editor_info_${editorId}`), method: 'compile' }).promise
    const link = document.createElement('a')
    if (typeof js !== 'string') { return }  // コンパイルエラーなど
    link.href = window.URL.createObjectURL(new Blob([js]))
    link.download = 'nako3_' + dayjs().format('YYYYMMDDHHmmss') + '.js'
    link.click()
  }, [])

  // コマンドのリスト
  const toggleCommandList = React.useCallback(() => { setShowCommandList(!showCommandList) }, [showCommandList])
  const insertCommand = React.useCallback((/** @type {string} */value) => {
    // カーソル位置に命令を挿入する。
    const aceEditor = editor.current?.editor
    if (!aceEditor) { return }
    aceEditor.session.insert(aceEditor.getCursorPosition(), value)
  }, [])

  // ace editor のマウント
  React.useEffect(() => {
    getNako3().setupEditor(`nako3_editor_precode_${editorId}`)
    editor.current = getNako3().setupEditor(`nako3_editor_code_${editorId}`)
  }, [])

  return <div>
    {React.useMemo(() => <div id={`nako3_editor_precode_${editorId}`} data-nako3-readonly style={{ height: '100px', borderBottom: 'gray 1px solid' }}>{preCode}</div>, [])}
    {React.useMemo(() => <div id={`nako3_editor_code_${editorId}`}>{code}</div>, [])}
    <div className="buttons">
      <button className="default_button" onClick={run}>実行</button>
      <button className="default_button" onClick={test}>テスト</button>
      <button className="default_button" onClick={clear}>クリア</button>
      <button onClick={download}>↓</button>
    </div>
    <div>
      <div className="edit_head">実行結果:</div>
      <div id={`nako3_editor_info_${editorId}`} className="info"></div>
      <div id={`nako3_div_${editorId}`}></div>
      <canvas id={`nako3_canvas_${editorId}`} width="310" height="150"/>
    </div>
    <div>
      <div className="edit_head">使用した命令:</div>
      <p className="info">{Array.from(usedFuncs.values()).sort().join(', ')}</p>
    </div>
    <div>
      <p className="edit_head">テスト結果:</p>
      <div id="mocha"/>
    </div>
    <div>
      <div style={{paddingTop: '8px'}}>
        <button onClick={toggleCommandList} className="default_button">
          <span>{showCommandList ? '命令の一覧を隠す' : '命令の一覧を表示する'}</span>
        </button>
      </div>
      {showCommandList ? <CommandList onClick={insertCommand} /> : null}
    </div>
  </div>
}

try {
  for (const [i, e] of Array.from(Array.from(document.getElementsByClassName('editor-component')).entries())) {
    const data = JSON.parse(e.getElementsByTagName('script')[0].text)
    const autoLoad = data['autoLoad']
    let code = data['code']
    if (autoLoad && window.localStorage['nako3/editor/code']) {
      code = window.localStorage['nako3/editor/code']
    }
    ReactDOM.render(<Editor code={code} editorId={i} />, e)
  }
} catch (err) {
  console.error(err) // IE11
}
