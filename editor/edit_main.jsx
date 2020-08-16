// edit_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import EditorComponent from './editor_component'
import 'mocha-css'

// なでしこコンパイラ唯一のインスタンス
const nako3 = navigator.nako3

// なでしこの関数をカスタマイズ
nako3.setFunc('言', [['を', 'と']], (msg) => window.alert(msg))
// なでしこにオリジナル関数をJSで追加
nako3.addFunc('色変更', [['に', 'へ']], (s) => {document.getElementById('info').style.color = s})

// render every editor-component 
for (const e of document.getElementsByClassName('editor-component')) {
  // data from editor-component's script text
  const data = JSON.parse(e.getElementsByTagName('script')[0].text)
  const autoLoad = data['autoLoad']
  let code = data['code']
  if (autoLoad && window.localStorage['nako3/editor/code']) {
    code = window.localStorage['nako3/editor/code']
  }
  ReactDOM.render(<EditorComponent nako3={nako3} title={data['title']} code={code} />, e)
}


