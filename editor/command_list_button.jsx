import React from 'react'
import PropTypes from 'prop-types'

export default class CommandListButton extends React.Component {
  render () {
    return (
      <div style={{paddingTop: '8px'}}>
        <button onClick={this.props.onChanged}><span>{(this.props.flagShow) ? '命令隠す' : '命令表示'}</span></button>
      </div>
    )
  }
}

CommandListButton.propTypes = {
  flagShow: PropTypes.bool.isRequired,
  onChanged: PropTypes.func.isRequired
}
