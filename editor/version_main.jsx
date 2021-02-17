// version_main.js
import React from 'react'
import ReactDOM from 'react-dom'
import VersionComponent from './version_component'

// tryとArray.fromはIE11のため
try {
  for (const e of Array.from(document.getElementsByClassName('version-component'))) {
    ReactDOM.render(<VersionComponent/>, e)
  }
} catch (e) {
  console.error(e)
}
