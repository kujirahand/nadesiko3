import 'date-utils'
import React from 'react'
import PropTypes from 'prop-types'
import EditorFormComponent from './editor_form_component'
import EditorButtonComponent from './editor_button_component'
import EditorInformationComponent from './editor_information_component'
import CommandListComponent from './command_list_component'

export default class EditorComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {code: props.code, err: null}
    this.info = []
  }

  render () {
    return (
      <div>
        <EditorFormComponent title={this.props.title} code={this.state.code}
                             ref={(e) => this.form = e} onChange={(e) => this.setState({code: e.target.value})} />
        <EditorButtonComponent nako3={this.props.nako3} code={this.state.code}
                               onInformationChanged={(s) => {
                                 this.info.push(s)
                                 this.setState({err: null})
                               }}
                               onReset={() => {
                                 this.info = []
                                 this.setState({err: null})
                               }}
                               onErrorChanged={(e) => this.setState({err: e})} />
        <EditorInformationComponent info={this.info.join('\n')} err={this.state.err} />
        <CommandListComponent onClick={(e) => {
          this.setState({code: this.state.code.substr(0, this.form.pos()) + e.target.getAttribute('data-paste') + this.state.code.substr(this.form.pos())})
          this.form.focus()
        }} />
      </div>
    )
  }
}

EditorComponent.propTypes = {
  title: PropTypes.string,
  code: PropTypes.string,
  nako3: PropTypes.object.isRequired
}
