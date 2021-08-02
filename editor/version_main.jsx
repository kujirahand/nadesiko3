// version_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import nakoVersion from '../src/nako_version.js'

try {
  for (const e of Array.from(document.getElementsByClassName('version-component'))) {
    ReactDOM.render(<div>日本語プログラミング言語「なでしこ3」<br />Ver. {nakoVersion.version}</div>, e)
  }
} catch (e) {
  console.error(e) // IE11
}
