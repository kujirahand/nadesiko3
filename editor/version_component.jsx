import React from 'react'
import nakoVersion from '../src/nako_version.js'

export default function VersionComponent () {
  return (
    <div>
      日本語プログラミング言語「なでしこ3」<br/>
      Ver. {nakoVersion.version}
    </div>
  )
}
