// edit_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import WebNakoCompiler from '../src/wnako3'
import EditorComponent from './editor_component'

const nako3 = new WebNakoCompiler()

// なでしこの関数をカスタマイズ
nako3.setFunc('言', (msg) => window.alert(msg))

// なでしこにオリジナル関数をJSで追加
nako3.addFunc('色変更', [['に', 'へ']], (s) => {document.getElementById('info').style.color = s})

// render
for (const e of document.getElementsByClassName('editor-component')) {
  const data = JSON.parse(e.getElementsByTagName('script')[0].text)
  ReactDOM.render(<EditorComponent nako3={nako3} title={data['title']} code={data['code']} />, e)
}
