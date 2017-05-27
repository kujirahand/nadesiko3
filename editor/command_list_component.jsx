import React from 'react'
import PropTypes from 'prop-types'
import CommandListButton from './command_list_button'
import CommandList from './command_list'

export default class CommandListComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {flagShow: false}
  }

  render () {
    return (
      <div>
        <CommandListButton flagShow={this.state.flagShow}
                           onChanged={() => this.setState({'flagShow': !this.state.flagShow})} />
        <CommandList flagShow={this.state.flagShow} onClick={this.props.onClick} />
      </div>
    )
  }
}

CommandListComponent.propTypes = {
  onClick: PropTypes.func.isRequired
}
