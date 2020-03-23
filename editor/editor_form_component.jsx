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
    return <textarea className="src" rows={this.props.row} ref={(e) => this.textarea = e}
                     onChange={this.props.onChange} title={this.props.title} value={this.props.code}
                     readOnly={this.props.readOnly}/>
  }
}

EditorFormComponent.propTypes = {
  title: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  row: PropTypes.number.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onChange: PropTypes.func
}

EditorFormComponent.defaultProps = {
  code: ''
}
