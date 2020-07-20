import React from 'react'
import PropTypes from 'prop-types'
import dayjs from 'dayjs'

export default class EditorButtonComponent extends React.Component {
  constructor (props) {
    super(props)
    this.preCode = this.props.preCode + '\n'
  }

  onRunButtonClick () {
    try {
      // なでしこの関数をカスタマイズ --- TODO: なでしこの追加命令は edit_main.jsxで書いているので別途関数を作ってそこでまとめるように
      this.props.nako3.setFunc('表示', [['と', 'を', 'の']], this.props.onInformationChanged)
      window.localStorage['nako3/editor/code'] = this.props.code
      this.props.nako3.run(this.preCode + this.props.code)
      this.props.onUsedFuncsChanged(this.props.nako3.usedFuncs)
    } catch (e) {
      this.props.onErrorChanged(e)
    }
  }

  onTestButtonClick () {
    try {
      window.localStorage['nako3/editor/code'] = this.props.code
      this.props.nako3.test(this.preCode + this.props.code)
    } catch (e) {
      this.props.onErrorChanged(e)
    }
  }

  onDownloadButtonClick () {
    try {
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(new Blob([this.props.nako3.compile(this.preCode + this.props.code)]))
      link.download = 'nako3_' + dayjs().format('YYYYMMDDHHmmss') + '.js'
      link.click()
    } catch (e) {
      this.props.onErrorChanged(e)
    }
  }

  render () {
    return (
      <div className="buttons">
        <button onClick={this.onRunButtonClick.bind(this)} className="default_button">
          実行
        </button>
        <button onClick={this.onTestButtonClick.bind(this)} className="default_button">
          テスト
        </button>
        <button onClick={this.props.onReset} className="default_button">クリア</button>
        <button onClick={this.onDownloadButtonClick.bind(this)}>
          ↓
        </button>
      </div>
    )
  }
}

EditorButtonComponent.propTypes = {
  preCode: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  onInformationChanged: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onErrorChanged: PropTypes.func.isRequired,
  onUsedFuncsChanged: PropTypes.func.isRequired,
  nako3: PropTypes.object.isRequired
}
