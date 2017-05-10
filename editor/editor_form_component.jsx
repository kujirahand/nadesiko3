import 'date-utils'
import React from 'react'
import PropTypes from 'prop-types'

export default function EditorFormComponent (props) {
  return <textarea className="src" rows="10" onChange={props.onChange} title={props.title} value={props.code} />
}

EditorFormComponent.propTypes = {
  title: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

EditorFormComponent.defaultProps = {
  code: ''
}
