import React from 'react'
import PropTypes from 'prop-types'
import EditorFormComponent from './editor_form_component'
import EditorButtonComponent from './editor_button_component'
import EditorInformationComponent from './editor_information_component'
import CommandListComponent from './command_list_component'
import EditorTestInformationComponent from "./editor_test_information_component";
import EditorFunctionInformationComponent from './editor_function_information_component'

export default class EditorComponent extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      code: props.code,
      err: null,
      usedFuncs: []
    }
    this.info = []
  }

  render () {
    const canvasId = 'nako3_canvas_1'
    const preCodeList = ['# 自動的に実行されるコード (編集不可)', `カメ描画先は『#${canvasId}』。`, `『#${canvasId}』へ描画開始。`]
    const preCode = preCodeList.join('\n')
    return (
      <div>
        <EditorFormComponent title={this.props.title} code={preCode} row={preCodeList.length} readOnly={true} />
        <EditorFormComponent title={this.props.title} code={this.state.code} row={10} readOnly={false}
                             ref={(e) => this.form = e} onChange={(e) => this.setState({code: e.target.value})} />
        <EditorButtonComponent nako3={this.props.nako3} preCode={preCode} code={this.state.code}
                               onInformationChanged={(s) => {
                                 this.info.push(s)
                                 this.setState({err: null})
                               }}
                               onUsedFuncsChanged={(funcs) => this.setState({ usedFuncs: Array.from(funcs).sort() })}
                               onReset={() => {
                                 this.info = []
                                 this.setState({err: null, usedFuncs: []})
                               }}
                               onErrorChanged={(e) => this.setState({err: e})} />
        <EditorInformationComponent info={this.info.join('\n')} err={this.state.err} canvasId={canvasId} />
        <EditorFunctionInformationComponent usedFuncs={this.state.usedFuncs}/>
        <EditorTestInformationComponent/>
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

