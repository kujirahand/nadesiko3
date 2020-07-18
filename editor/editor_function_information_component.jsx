import React from 'react'
import PropTypes from 'prop-types'

export default function EditorFunctionInformationComponent (props) {
  if (props.used_funcs.length > 0) {
    return (
      <div>
        <div>
          <div className="edit_head">使用した命令:</div>
          <p className="info">{props.used_funcs.join(', ')}</p>
        </div>
      </div>
    )
  }

  return null
}

EditorFunctionInformationComponent.propTypes = {
  used_funcs: PropTypes.arrayOf(PropTypes.string).isRequired
}
