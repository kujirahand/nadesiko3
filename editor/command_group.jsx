import React from 'react'
import PropTypes from 'prop-types'

export default class CommandGroup extends React.Component {
  render () {
    const a = []
    for (const c of this.props.group) {
      const cType = c[0]
      const cName = c[1]
      const cArgs = String(c[2] + '/').split('/')[0]
      let paste
      if (cType === '関数') {
        paste = cArgs + cName + '。'
      } else {
        paste = cName
      }
      a.push(<span key={'key_' + cName} onClick={(e) => {
        if (!e.target) return
        const paste = e.target.getAttribute('data-paste')
        console.log(paste)
        const txt = document.getElementById('src_box')
        const org = txt.value
        const cur = txt.selectionStart
        const left = org.substr(0, cur)
        const right = org.substr(cur)
        txt.value = left + paste + right
        txt.focus()
      }} data-paste={paste}>[{cName}]&nbsp;</span>)
    }
    return (
      <li>
        <div key={this.props.gid + '_name'} style={{color: '#55c'}}>{this.props.groupName}</div>
        <div key={this.props.gid + '_list'} style={{marginLeft: '12px'}}>{a}</div>
      </li>
    )
  }
}

CommandGroup.propTypes = {
  gid: PropTypes.string.isRequired,
  group: PropTypes.array.isRequired,
  groupName: PropTypes.string.isRequired
}
