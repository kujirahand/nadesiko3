import React from 'react'
import packageInfo from '../package.json'

export default function VersionComponent () {
  return (
    <div>
      日本語プログラミング言語「なでしこ3」<br/>
      Ver. {packageInfo.version}
    </div>
  )
}
