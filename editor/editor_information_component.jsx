import React from 'react'
import PropTypes from 'prop-types'
import { nl2br } from './common'

export default function EditorInformationComponent (props) {
  let err
  if (props.err) {
    let msg = props.err.message
    err = <div className="err" style={{display: 'block'}}>
      {
          msg.split('\n').map(line => {
            return (<span>{line}<br /></span>)
          })
      }
      </div>
    console.error(props.err)
  } else
    err = null


  return (
    <div>
      {err}
      <div>
        <p className="edit_head">実行結果:</p>
        <p className="info">{nl2br(props.info)}</p>
        <div id={props.divId}></div>
        <canvas id={props.canvasId} width="310" height="150"/>
      </div>
    </div>
  )
}

EditorInformationComponent.propTypes = {
  info: PropTypes.string,
  err: PropTypes.object,
  canvasId: PropTypes.string.isRequired
}
