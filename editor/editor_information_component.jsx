import 'date-utils'
import React from 'react'
import PropTypes from 'prop-types'
import { nl2br } from './common'

export default function EditorInformationComponent (props) {
  let err
  if (props.err) {
    err = <div className="err" style={{display: 'block'}}>{props.err.message}</div>
    console.error(props.err)
  } else {
    err = null
  }
  return (
    <div>
      {err}
      <div>
        <p className="edit_head">実行結果:</p>
        <p className="info">{nl2br(props.info)}</p>
      </div>
    </div>
  )
}

EditorInformationComponent.propTypes = {
  info: PropTypes.string,
  err: PropTypes.object
}
