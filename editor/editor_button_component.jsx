import 'date-utils'
import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-timezone'

export default function EditorButtonComponent (props) {
  const preCode = `カメ描画先は『#${props.canvasId}』。\n『#${props.canvasId}』へ描画開始。\n`
  return (
    <div className="buttons">
      <button onClick={() => {
        try {
          // なでしこの関数をカスタマイズ --- TODO: なでしこの追加命令は edit_main.jsxで書いているので別途関数を作ってそこでまとめるように
          props.nako3.setFunc('表示', [['と', 'を', 'の']], props.onInformationChanged)
          window.localStorage['nako3/editor/code'] = props.code
          props.nako3.run(preCode + props.code)
        } catch (e) {
          props.onErrorChanged(e)
        }
      }} className="default_button">
        実行
      </button>
      <button onClick={() => {
        try {
          window.localStorage['nako3/editor/code'] = props.code
          props.nako3.test(preCode + props.code)
        } catch (e) {
          props.onErrorChanged(e)
        }
      }} className="default_button">
        テスト
      </button>
      <button onClick={props.onReset} className="default_button">クリア</button>
      <button onClick={() => {
        try {
          const link = document.createElement('a')
          link.href = window.URL.createObjectURL(new Blob([props.nako3.compile(preCode + props.code)]))
          link.download = 'nako3_' + moment().format('YYYYMMDDHHmmss') + '.js'
          link.click()
        } catch (e) {
          props.onErrorChanged(e)
        }
      }}>
        ↓
      </button>
    </div>
  )
}

EditorButtonComponent.propTypes = {
  code: PropTypes.string.isRequired,
  onInformationChanged: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onErrorChanged: PropTypes.func.isRequired,
  nako3: PropTypes.object.isRequired,
  canvasId: PropTypes.string.isRequired
}
