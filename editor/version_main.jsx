// version_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import VersionComponent from './version_component'

// render
for (const e of document.getElementsByClassName('version-component')) {
  ReactDOM.render(<VersionComponent/>, e)
}
