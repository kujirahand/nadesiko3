import React from 'react'
import PropTypes from 'prop-types'

export default function CommandListButton (props) {
  let str
  if (props.flagShow) {
    str = '命令隠す'
  } else {
    str = '命令表示'
  }
  return (
    <div style={{paddingTop: '8px'}}>
      <button onClick={props.onChanged} className="default_button"><span>{str}</span></button>
    </div>
  )
}

CommandListButton.propTypes = {
  flagShow: PropTypes.bool.isRequired,
  onChanged: PropTypes.func.isRequired
}
