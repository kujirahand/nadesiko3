import React from 'react'
import { ajaxGet } from './common'
import PropTypes from 'prop-types'
import CommandGroup from './command_group'

export default class CommandList extends React.Component {
  constructor (props) {
    super(props)
    this.files = [
      'plugin_browser',
      'plugin_turtle',
      'plugin_system'
    ]
    this.listItems = []
  }

  render () {
    let items
    if (this.props.flagShow) {
      items = (
        <ul>
          {this.listItems}
        </ul>
      )
    } else {
      items = null
    }
    return (
      <div>
        {items}
      </div>
    )
  }

  componentDidMount () {
    ajaxGet('../release/command.json', {}, (text, xhr) => {
      this.listItems = []
      const cmd = JSON.parse(text)
      for (const fname of this.files) {
        const glist = cmd[fname]
        if (!glist) {
          console.log('command.jsonの[' + fname + ']が読み込めません。')
          continue // 読み込みに失敗した場合
          }
        for (const groupName in glist) {
          const gid = 'key_' + groupName
          this.listItems.push(<CommandGroup key={gid} gid={gid} groupName={groupName}
                                            group={glist[groupName]} onClick={this.props.onClick} />)
        }
      }
    })
  }
}

CommandList.propTypes = {
  flagShow: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
}
