import React from 'react'
import PropTypes from 'prop-types'

export default function EditorFunctionInformationComponent (props) {
  return (
    <div>
      <div>
        <p className="edit_head">使用した命令 (プログラム内で定義した命令除く):</p>
        <ul>
          {props.used_funcs.map(func => (<li key={func}>{func}</li>))}
        </ul>
      </div>
    </div>
  )
}

EditorFunctionInformationComponent.propTypes = {
  used_funcs: PropTypes.arrayOf(PropTypes.string).isRequired
}
