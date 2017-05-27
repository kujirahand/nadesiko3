import 'date-utils'
import React from 'react'
import PropTypes from 'prop-types'

export default class EditorFormComponent extends React.Component {
  focus () {
    this.textarea.focus()
  }

  pos () {
    return this.textarea.selectionStart
  }

  render () {
    return <textarea className="src" rows="10" ref={(e) => this.textarea = e}
                     onChange={this.props.onChange} title={this.props.title} value={this.props.code} />
  }
}

EditorFormComponent.propTypes = {
  title: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
}

EditorFormComponent.defaultProps = {
  code: ''
}
