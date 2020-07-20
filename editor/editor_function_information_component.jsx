import React from 'react'
import PropTypes from 'prop-types'

export default function EditorFunctionInformationComponent (props) {
  return (
    <div>
      <div>
        <div className="edit_head">使用した命令:</div>
        <p className="info">{props.usedFuncs.join(', ')}</p>
      </div>
    </div>
  )
}

EditorFunctionInformationComponent.propTypes = {
  usedFuncs: PropTypes.arrayOf(PropTypes.string).isRequired
}
