// version_main.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import nakoVersion from '../src/nako_version.mjs'

try {
  for (const e of Array.from(document.getElementsByClassName('version-component'))) {
    const doc = ReactDOM.createRoot(e)
    doc.render(<div>日本語プログラミング言語「なでしこ3」<br/>Ver. {nakoVersion.version}</div>)
  }
} catch (e) {
  console.error(e) // IE11
}
