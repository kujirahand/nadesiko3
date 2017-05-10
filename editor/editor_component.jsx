import 'date-utils'
import React from 'react'
import PropTypes from 'prop-types'
import EditorFormComponent from './editor_form_component'
import EditorButtonComponent from './editor_button_component'
import EditorInformationComponent from './editor_information_component'

export default class EditorComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {code: this.props.code, flagInfoChanged: false, err: null}
    this.info = []
  }

  render () {
    return (
      <div>
        <EditorFormComponent title={this.props.title} code={this.state.code}
                             onChange={(e) => {this.setState({code: e.target.value})}} />
        <EditorButtonComponent nako3={this.props.nako3} code={this.state.code}
                               onInformationChanged={(s) => {
                                 this.info.push(s)
                                 this.setState({flagInfoChanged: true})
                               }}
                               onReset={() => {
                                 this.setState({flagInfoChanged: false, err: null})
                                 this.info = []
                               }}
                               onErrorChanged={(e) => this.setState({err: e})} />
        <EditorInformationComponent info={this.info.join('\n')} err={this.state.err} />
      </div>
    )
  }
}

EditorComponent.propTypes = {
  title: PropTypes.string,
  code: PropTypes.string,
  nako3: PropTypes.object.isRequired
}
