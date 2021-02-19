//
// nako_gen.js
//
'use strict'

class NakoGenError extends Error {
  constructor (msg, line) {
    if (line)
      {msg = '[文法エラー](' + line + ') ' + msg}
     else
      {msg = '[文法エラー] ' + msg}

    super(msg)
  }
}

/**
 * 行番号とファイル名が分かるときは `l123:main.nako3`、行番号だけ分かるときは `l123`、そうでなければ任意の文字列。
 * @type {string | null}
 */
let lastLineNo = null

/**
 * 構文木からJSのコードを生成するクラス
 */
class NakoGen {
  /**
   * @ param com {NakoCompiler} コンパイラのインスタンス
   */
  constructor (com) {
    this.header = NakoGen.getHeader()

    /**
     * プラグインで定義された関数の一覧
     * @type {{}}
     */
    this.funclist = com.funclist

    /**
     * なでしこで定義した関数の一覧
     * @type {{}}
     */
    this.nako_func = {}

    /**
     * なでしこで定義したテストの一覧
     * @type {{}}
     */
    this.nako_test = {}

    /**
     * JS関数でなでしこ内で利用された関数
     * 利用した関数を個別にJSで定義する
     * (全関数をインクルードしなくても良いように)
     * @type {{}}
     */
    this.used_func = {}

    /**
     * ループ時の一時変数が被らないようにIDで管理
     * @type {number}
     */
    this.loop_id = 1

    /**
     * 変換中の処理が、ループの中かどうかを判定する
     * @type {boolean}
     */
    this.flagLoop = false

    /**
     * なでしこのローカル変数をスタックで管理
     * __varslist[0] プラグイン領域
     * __varslist[1] なでしこグローバル領域
     * __varslist[2] 最初のローカル変数 ( == __vars }
     * @type {any[]}
     * @private
     */
    this.__varslist = com.__varslist
    this.__self = com

    /**
     * なでしこのローカル変数(フレームトップ)
     * @type {*}
     * @private
     */
    this.__vars = this.__varslist[2]

    /**
     * 利用可能なプラグイン(ファイル 単位)
     * @type {{}}
     */
    this.__module = com.__module

    /**
     * コマンドオプションがあれば記録
     * @type {{}}
     */
    this.__options = com.options

    // 1以上のとき高速化する。
    // 実行速度優先ブロック内で1増える。
    this.speedMode = {
      lineNumbers: 0,          // 行番号を出力しない
      implicitTypeCasting: 0,  // 数値加算でparseFloatを出力しない
    }
  }

  setOptions (options) {
    this.__options = options
    if (this.__options.speed) { this.speedMode.lineNumbers = 1 }
  }

  static getHeader () {
    return '' +
      'var __varslist = this.__varslist = [{}, {}, {}];\n' +
      'var __vars = this.__varslist[2];\n' +
      'var __self = this;\n' +
      'var __module = {};\n'
  }

  /**
   * @param {string} name
   */
  static isValidIdentifier(name) {
    // TODO: いらなそうな部分は削る
    // https://stackoverflow.com/a/9337047
    return /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/.test(name)
  }

  /**
   * @param {import("./nako3").Ast} node
   * @param {boolean} forceUpdate
   */
  convLineno (node, forceUpdate) {
    if (this.speedMode.lineNumbers > 0) { return '' }

    /** @type {string} */
    let lineNo
    if (typeof node.line !== 'number') {
      console.warn('lineNo = ""')
      lineNo = 'unknown'
    } else if (typeof node.file !== 'string') {
      lineNo = `l${node.line}`
    } else {
      lineNo = `l${node.line}:${node.file}`
    }

    // 強制的に行番号をアップデートするか
    if (!forceUpdate) {
      if (lineNo == lastLineNo) return ''
      lastLineNo = lineNo
    }
    // 例: __v0.line='l1:main.nako3'
    return `__v0.line=${JSON.stringify(lineNo)};`
  }

  /**
   * ローカル変数のJavaScriptコードを生成する。
   * @param {string} name
   */
  varname (name) {
    if (this.__varslist.length === 3) {
      // グローバル
      return `__varslist[${2}][${JSON.stringify(name)}]`
    } else {
      // 関数内
      if (NakoGen.isValidIdentifier(name)) {
        return name
      } else {
        return `__vars[${JSON.stringify(name)}]`
      }
    }
  }

  static getFuncName (name) {
    let name2 = name.replace(/[ぁ-ん]+$/, '')
    if (name2 === '') {name2 = name}
    return name2
  }

  static convPrint (node) {
    return `__print(${node});`
  }

  static convRequire (node) {
    const moduleName = node.value
    return this.convLineno(node, false) +
      `__module['${moduleName}'] = require('${moduleName}');\n`
  }

  reset () {
    // this.nako_func = {}
    // 初期化メソッド以外の関数を削除
    const uf = {}
    for (const key in this.used_func)
      {if (key.match(/^!.+:初期化$/)) {uf[key] = this.used_func[key]}}

    this.used_func = uf
    lastLineNo = null
    this.loop_id = 1
    this.__varslist[1] = {} // user global
    this.__vars = this.__varslist[2] = { 'それ': true } // user local
    for (const key of /** @type {(keyof NakoGen['speedMode'])[]} */(Object.keys(this.speedMode))) {
      this.speedMode[key] = 0
    }
    this.funclist = this.__self.funclist
  }

  /**
   * プログラムの実行に必要な関数を書き出す(システム領域)
   * @returns {string}
   */
  getVarsCode () {
    let code = ''

    // プログラム中で使った関数を列挙して書き出す
    for (const key in this.used_func) {
      const f = this.__varslist[0][key]
      const name = `this.__varslist[0]["${key}"]`
      if (typeof (f) === 'function')
        {code += name + '=' + f.toString() + ';\n'}
       else
        {code += name + '=' + JSON.stringify(f) + ';\n'}

    }
    return code
  }

  /**
   * プログラムの実行に必要な関数定義を書き出す(グローバル領域)
   * convGenの結果を利用するため、convGenの後に呼び出すこと。
   * @param {boolean} isTest テストかどうか
   * @returns {string}
   */
  getDefFuncCode(isTest) {
    let code = ''
    // よく使う変数のショートカット
    code += 'const __self = this.__self = this;\n'
    code += 'const __varslist = this.__varslist;\n'
    code += 'const __module = this.__module;\n'
    code += 'const __v0 = this.__v0 = this.__varslist[0];\n'
    code += 'const __v1 = this.__v1 = this.__varslist[1];\n'
    code += 'const __vars = this.__vars = this.__varslist[2];\n'

    // なでしこの関数定義を行う
    let nakoFuncCode = ''
    for (const key in this.nako_func) {
      const f = this.nako_func[key].fn
      nakoFuncCode += '' +
        `//[DEF_FUNC name='${key}']\n` +
        `__v1["${key}"]=${f};\n;` +
        `//[/DEF_FUNC name='${key}']\n`
    }
    if (nakoFuncCode !== '')
      {code += '__v0.line=\'関数の定義\';\n' + nakoFuncCode}

    // プラグインの初期化関数を実行する
    let pluginCode = ''
    for (const name in this.__module) {
      const initkey = `!${name}:初期化`
      if (this.__varslist[0][initkey])
        {pluginCode += `__v0["!${name}:初期化"](__self);\n`} // セミコロンがないとエラーになったので注意

    }
    if (pluginCode !== '')
      {code += '__v0.line=\'プラグインの初期化\';\n' + pluginCode}

    // テストの定義を行う
    if (isTest) {
      let testCode = ''

      for (const key in this.nako_test) {
        const f = this.nako_test[key].fn
        testCode += `${f};\n;`
      }

      if (testCode !== '') {
        code += '__v0.line=\'テストの定義\';\n'
        code += testCode + '\n'
      }
    }

    return code
  }

  getVarsList () {
    return this.__varslist
  }

  /**
   * プラグイン・オブジェクトを追加
   * @param po プラグイン・オブジェクト
   */
  addPlugin (po) {
    return this.__self.addPlugin(po)
  }

  /**
   * プラグイン・オブジェクトを追加(ブラウザ向け)
   * @param name オブジェクト名
   * @param po 関数リスト
   */
  addPluginObject (name, po) {
    this.__self.addPluginObject(name, po)
  }

  /**
   * プラグイン・ファイルを追加(Node.js向け)
   * @param objName オブジェクト名
   * @param path ファイルパス
   * @param po 登録するオブジェクト
   */
  addPluginFile (objName, path, po) {
    this.__self.addPluginFile(objName, path, po)
  }

  /**
   * 関数を追加する
   * @param key 関数名
   * @param josi 助詞
   * @param fn 関数
   */
  addFunc (key, josi, fn) {
    this.__self.addFunc(key, josi, fn)
  }

  /**
   * 関数をセットする
   * @param key 関数名
   * @param fn 関数
   */
  setFunc (key, fn) {
    this.__self.setFunc(key, fn)
  }

  /**
   * プラグイン関数を参照する
   * @param key プラグイン関数の関数名
   * @returns プラグイン・オブジェクト
   */
  getFunc (key) {
    return this.__self.getFunc(key)
  }

  /**
   * 関数を先に登録してしまう
   */
  registerFunction (ast) {
    if (ast.type !== 'block')
      {throw new NakoGenError('構文解析に失敗しています。構文は必ずblockが先頭になります')}

    for (let i = 0; i < ast.block.length; i++) {
      const t = ast.block[i]
      if (t.type === 'def_func') {
        const name = t.name.value
        this.used_func[name] = true
        this.__varslist[1][name] = function () { } // 事前に適当な値を設定
        this.nako_func[name] = {
          'josi': t.name.meta.josi,
          'fn': '',
          'type': 'func'
        }
      }
    }
  }

  convGen(node, isTest) {
    const result = this.convLineno(node, false) + this._convGen(node)
    if (isTest) {
      return ''
    } else {
      return result
    }
  }

  _convGen(node) {
    let code = ''
    if (node instanceof Array) {
      for (let i = 0; i < node.length; i++) {
        const n = node[i]
        code += this._convGen(n)
      }
      return code
    }
    if (node === null) {return 'null'}
    if (node === undefined) {return 'undefined'}
    if (typeof (node) !== 'object') {return '' + node}
    // switch
    switch (node.type) {
      case 'nop':
        break
      case 'block':
        for (let i = 0; i < node.block.length; i++) {
          const b = node.block[i]
          code += this._convGen(b)
        }
        break
      case 'comment':
      case 'eol':
        code += this.convComment(node)
        break
      case 'break':
        code += this.convCheckLoop(node, 'break')
        break
      case 'continue':
        code += this.convCheckLoop(node, 'continue')
        break
      case 'end':
        code += '__varslist[0][\'終\']();'
        break
      case 'number':
        code += node.value
        break
      case 'string':
        code += this.convString(node)
        break
      case 'def_local_var':
        code += this.convDefLocalVar(node)
        break
      case 'let':
        code += this.convLet(node)
        break
      case 'word':
      case 'variable':
        code += this.convGetVar(node)
        break
      case 'op':
      case 'calc':
        code += this.convOp(node)
        break
      case 'renbun':
        code += this.convRenbun(node)
        break
      case 'not':
        code += '((' + this._convGen(node.value) + ')?0:1)'
        break
      case 'func':
      case 'func_pointer':
      case 'calc_func':
        code += this.convFunc(node)
        break
      case 'if':
        code += this.convIf(node)
        break
      case 'promise':
        code += this.convPromise(node)
        break
      case 'for':
        code += this.convFor(node)
        break
      case 'foreach':
        code += this.convForeach(node)
        break
      case 'repeat_times':
        code += this.convRepeatTimes(node)
        break
      case 'speed_mode':
        code += this.convSpeedMode(node)
        break
      case 'while':
        code += this.convWhile(node)
        break
      case 'switch':
        code += this.convSwitch(node)
        break
      case 'let_array':
        code += this.convLetArray(node)
        break
      case 'ref_array':
        code += this.convRefArray(node)
        break
      case 'json_array':
        code += this.convJsonArray(node)
        break
      case 'json_obj':
        code += this.convJsonObj(node)
        break
      case 'func_obj':
        code += this.convFuncObj(node)
        break
      case 'bool':
        code += (node.value) ? 'true' : 'false'
        break
      case 'null':
        code += 'null'
        break
      case 'def_test':
        code += this.convDefTest(node)
        break
      case 'def_func':
        code += this.convDefFunc(node)
        break
      case 'return':
        code += this.convReturn(node)
        break
      case 'try_except':
        code += this.convTryExcept(node)
        break
      case 'require':
        code += NakoGen.convRequire(node)
        break
      default:
        throw new Error('System Error: unknown_type=' + node.type)
    }
    return code
  }

  /**
   * @param {string} name
   * @returns {{i: number, name: string, isTop: boolean, js: string} | null}
   */
  findVar (name) {
    // __vars ? (ローカル変数)
    if (this.__varslist.length > 3 && this.__vars[name] !== undefined) {
      return { i: this.__varslist.length - 1, name, isTop: true, js: this.varname(name) }
    }
    // __varslist ?
    for (let i = 2; i >= 0; i--) {
      const vlist = this.__varslist[i]
      if (!vlist) {continue}
      if (vlist[name] !== undefined) {
        // ユーザーの定義したグローバル変数 (__varslist[2]) は、変数展開されている（そのままの名前で定義されている）可能性がある。
        // それ以外の変数は、必ず__varslistに入っている。
        return { i, name, isTop: false, js: `__varslist[${i}][${JSON.stringify(name)}]` }
      }
    }
    
    return null
  }

  /**
   * 定義済みの変数の参照
   */
  genVar (name, line) {
    const res = this.findVar(name)
    const lno = line
    if (res === null) {
      // 定義されていない名前の参照は変数の定義とみなす
      this.__vars[name] = true
      return this.varname(name)
    }

    const i = res.i
    // システム関数・変数の場合
    if (i === 0) {
      const pv = this.funclist[name]
      if (!pv) {return `${res.js}/*err:${lno}*/`}
      if (pv.type === 'const' || pv.type === 'var') {return res.js}
      if (pv.type === 'func') {
        if (pv.josi.length === 0)
          {return `(${res.js}())`}

        throw new NakoGenError(`『${name}』が複文で使われました。単文で記述してください。(v1非互換)`, line)
      }
      throw new NakoGenError(`『${name}』は関数であり参照できません。`, line)
    }
    return res.js
  }

  convGetVar (node) {
    const name = node.value
    return this.genVar(name, node.line)
  }

  convComment (node) {
    let commentSrc = String(node.value)
    commentSrc = commentSrc.replace(/\n/g, '¶')
    const lineNo = this.convLineno(node, false)
    if (commentSrc === '' && lineNo === '') { return ';' }
    if (commentSrc === '') {
      return ';' + lineNo + '\n'
    }
    return ';' + lineNo + '//' + commentSrc + '\n'
  }

  convReturn (node) {
    // 関数の中であれば利用可能
    if (typeof (this.__vars['!関数']) === 'undefined')
      {throw new NakoGenError('『戻る』がありますが、関数定義内のみで使用可能です。', node.line)}

    const lno = this.convLineno(node, false)
    let value
    if (node.value) {
      value = this._convGen(node.value)
      return lno + `return ${value};`
    } else {
      return lno + `return ${this.varname('それ')};`
    }
  }

  convCheckLoop (node, cmd) {
    // ループの中であれば利用可能
    if (!this.flagLoop) {
      const cmdj = (cmd === 'continue') ? '続ける' : '抜ける'
      throw new NakoGenError(`『${cmdj}』文がありますが、それは繰り返しの中で利用してください。`, node.line)
    }
    return this.convLineno(node.line) + cmd + ';'
  }

  convDefFuncCommon (node, name) {
    let variableDeclarations = '(function(){\n'
    this.__vars = {'それ': true, '!関数': name}
    // ローカル変数をPUSHする
    this.__varslist.push(this.__vars)
    // JSの引数と引数をバインド
    variableDeclarations += `  var 引数 = arguments;\n`
    // 宣言済みの名前を保存
    const varsDeclared = Object.keys(this.__vars)
    let code = ''
    // 引数をローカル変数に設定
    let meta = (!name) ? node.meta : node.name.meta
    for (let i = 0; i < meta.varnames.length; i++) {
      const word = meta.varnames[i]
      code += `  ${this.varname(word)} = arguments[${i}];\n`
      this.__vars[word] = true
    }
    // 関数定義は、グローバル領域で。
    if (name) {
      this.used_func[name] = true
      this.__varslist[1][name] = function () {
      } // 再帰のために事前に適当な値を設定
      this.nako_func[name] = {
        'josi': node.name.meta.josi,
        'fn': '',
        'type': 'func'
      }
    }
    // ブロックを解析
    const block = this._convGen(node.block)
    code += block.split('\n').map((line) => '  ' + line).join('\n') + '\n'
    // 関数の最後に、変数「それ」をreturnするようにする
    code += `  return (${this.varname('それ')});\n`
    // 関数の末尾に、ローカル変数をPOP
    code += `})`

    // 関数内で定義されたローカル変数の宣言
    let needsVarsObject = false
    for (const name of Object.keys(this.__vars)) {
      if (!varsDeclared.includes(name)) {
        if (NakoGen.isValidIdentifier(name)) {
          variableDeclarations += `  var ${name};\n`
        } else {
          needsVarsObject = true
        }
      }
    }
    if (!NakoGen.isValidIdentifier('それ')) {
      needsVarsObject = true
    }
    // 一度でも__varsを使ったら、それも宣言する。
    if (needsVarsObject) {
      variableDeclarations += `  var __vars = {};\n`
    }
    if (NakoGen.isValidIdentifier('それ')) {
      variableDeclarations += `  var それ = '';\n`
    } else {
      variableDeclarations += `  ${this.varname('それ')} = '';`
    }
    code = variableDeclarations + code

    if (name)
      {this.nako_func[name]['fn'] = code}

    this.__varslist.pop()
    this.__vars = this.__varslist[this.__varslist.length-1]
    if (name)
      {this.__varslist[1][name] = code}

    return code
  }

  convDefTest(node) {
    const name = node.name.value
    let code = `describe('test', () => {\n` +
      ` it('${name}', () => {\n`

    // ブロックを解析
    const block = this._convGen(node.block)

    code += `   ${block}\n` +
      ` })\n` +
      `})`

    this.nako_test[name] = {
      'josi': node.name.meta.josi,
      'fn': code,
      'type': 'test_func'
    }

    // ★この時点ではテストコードを生成しない★
    // プログラム冒頭でコード生成時にテストの定義を行う
    return ''
  }

  convDefFunc(node) {
    const name = NakoGen.getFuncName(node.name.value)
    this.convDefFuncCommon(node, name)
    // ★この時点では関数のコードを生成しない★
    // プログラム冒頭でコード生成時に関数定義を行う
    return ''
  }

  convFuncObj (node) {
    return this.convDefFuncCommon(node, '')
  }

  convJsonObj (node) {
    const list = node.value
    const codelist = list.map((e) => {
      const key = this._convGen(e.key)
      const val = this._convGen(e.value)
      return `${key}:${val}`
    })
    return '{' + codelist.join(',') + '}'
  }

  convJsonArray (node) {
    const list = node.value
    const codelist = list.map((e) => {
      return this._convGen(e)
    })
    return '[' + codelist.join(',') + ']'
  }

  convRefArray(node) {
    const name = this._convGen(node.name)
    const list = node.index
    let code = name
    for (let i = 0; i < list.length; i++) {
      const idx = this._convGen(list[i])
      code += '[' + idx + ']'
    }
    return code
  }

  convLetArray(node) {
    const name = this._convGen(node.name)
    const list = node.index
    let code = name
    for (let i = 0; i < list.length; i++) {
      const idx = this._convGen(list[i])
      code += '[' + idx + ']'
    }
    const value = this._convGen(node.value)
    code += ' = ' + value + ';\n'
    return this.convLineno(node, false) + code
  }

  convGenLoop (node) {
    const tmpflag = this.flagLoop
    this.flagLoop = true
    try {
      return this._convGen(node)
    } finally {
      this.flagLoop = tmpflag
    }
  }

  convFor (node) {
    // ループ変数について
    let word
    if (node.word !== null) { // ループ変数を使う時
      const varName = node.word.value
      this.__vars[varName] = true
      word = this.varname(varName)
    } else {
      this.__vars['dummy'] = true
      word = this.varname('dummy')
    }
    const idLoop = this.loop_id++
    const varI = `$nako_i${idLoop}`
    // ループ条件を確認
    const kara = this._convGen(node.from)
    const made = this._convGen(node.to)
    // ループ内のブロック内容を得る
    const block = this.convGenLoop(node.block)
    // ループ条件を変数に入れる用
    const varFrom = `$nako_from${idLoop}`
    const varTo = `$nako_to${idLoop}`
    const code =
      `\n//[FOR id=${idLoop}]\n` +
      `const ${varFrom} = ${kara};\n` +
      `const ${varTo} = ${made};\n` +
      `if (${varFrom} <= ${varTo}) { // up\n` +
      `  for (let ${varI} = ${varFrom}; ${varI} <= ${varTo}; ${varI}++) {\n` +
      `    ${this.varname('それ')} = ${word} = ${varI};\n` +
      `    ${block}\n` +
      `  };\n` +
      `} else { // down\n` +
      `  for (let ${varI} = ${varFrom}; ${varI} >= ${varTo}; ${varI}--) {\n` +
      `    ${this.varname('それ')} = ${word} = ${varI};` + '\n' +
      `    ${block}\n` +
      `  };\n` +
      `};\n//[/FOR id=${idLoop}]\n`
    return this.convLineno(node, false) + code
  }

  convForeach (node) {
    let target
    if (node.target === null)
      {target = this.varname('それ')}
     else
      {target = this._convGen(node.target)}

    // blockより早く変数を定義する必要がある
    let nameS = '__v0["対象"]'
    if (node.name) {
      nameS = this.varname(node.name.value)
      this.__vars[node.name.value] = true
    }
  
    const block = this.convGenLoop(node.block)
    const id = this.loop_id++
    const key = '__v0["対象キー"]'
    const code =
      `let $nako_foreach_v${id}=${target};\n` +
      `for (let $nako_i${id} in $nako_foreach_v${id})` + '{\n' +
      `  if ($nako_foreach_v${id}.hasOwnProperty($nako_i${id})) {\n` +
      `    ${nameS} = ${this.varname('それ')} = $nako_foreach_v${id}[$nako_i${id}];` + '\n' +
      `    ${key} = $nako_i${id};\n` +
      `    ${block}\n` +
      '  }\n' +
      '};\n'
    return this.convLineno(node, false) + code
  }

  convRepeatTimes (node) {
    const id = this.loop_id++
    const value = this._convGen(node.value)
    const block = this.convGenLoop(node.block)
    const kaisu = '__v0["回数"]'
    const code =
      `for(var $nako_i${id} = 1; $nako_i${id} <= ${value}; $nako_i${id}++)` + '{\n' +
      `  ${this.varname('それ')} = ${kaisu} = $nako_i${id};` + '\n' +
      '  ' + block + '\n}\n'
    return this.convLineno(node, false) + code
  }

  convSpeedMode (node) {
    const prev = { ...this.speedMode }
    if (node.options['行番号無し']) {
      this.speedMode.lineNumbers++
    }
    if (node.options['暗黙の型変換無し']) {
      this.speedMode.implicitTypeCasting++
    }
    try {
      return this._convGen(node.block)
    } finally {
      this.speedMode = prev
    }
  }

  convWhile (node) {
    const cond = this._convGen(node.cond)
    const block = this.convGenLoop(node.block)
    const code =
      `while (${cond})` + '{\n' +
      `  ${block}` + '\n' +
      '}\n'
    return this.convLineno(node, false) + code
  }

  convSwitch (node) {
    const value = this._convGen(node.value)
    const cases = node.cases
    let body = ''
    for (let i = 0; i < cases.length; i++) {
      const cvalue = cases[i][0]
      const cblock = this.convGenLoop(cases[i][1])
      if (cvalue.type == '違えば') {
        body += `  default:\n`
      } else {
        const cvalue_code = this._convGen(cvalue)
        body += `  case ${cvalue_code}:\n`
      }
      body += `    ${cblock}\n` +
              `    break\n`
    }
    const code =
      `switch (${value})` + '{\n' +
      `${body}` + '\n' +
      '}\n'
    return this.convLineno(node, false) + code
  }

  convIf (node) {
    const expr = this._convGen(node.expr)
    const block = this._convGen(node.block)
    const falseBlock = (node.false_block === null)
      ? ''
      : 'else {' + this._convGen(node.false_block) + '};\n'
    return this.convLineno(node, false) +
      `if (${expr}) {\n  ${block}\n}` + falseBlock + ';\n'
  }

  convPromise (node) {
    const pid = this.loop_id++
    let code = `const __pid${pid} = async () => {\n`
    for (let i = 0; i < node.blocks.length; i++) {
      const block = this._convGen(node.blocks[i]).replace(/\s+$/, '') + '\n'
      const blockCode =
        'await new Promise((resolve) => {\n' +
        '  __self.resolve = resolve;\n' +
        '  __self.resolveCount = 0;\n' +
        `  ${block}\n` +
        '  if (__self.resolveCount === 0) resolve();\n' +
        '\n' +
        '})\n'
      code += `${blockCode}`
    }
    code += `};/* __pid${pid} */\n`
    code += `__pid${pid}();\n`
    code += '__self.resolve = undefined;\n'
    return this.convLineno(node, false) + code
  }

  convFuncGetArgsCalcType (funcName, func, node) {
    const args = []
    const opts = {}
    for (let i = 0; i < node.args.length; i++) {
      const arg = node.args[i]
      if (i === 0 && arg === null) {
        args.push(this.varname('それ'))
        opts['sore'] = true
      } else
        {args.push(this._convGen(arg))}

    }
    return [args, opts]
  }

  getPluginList () {
    const r = []
    for (const name in this.__module) {r.push(name)}
    return r
  }

  /**
   * 関数の呼び出し
   * @param node
   * @returns string コード
   */
  convFunc (node) {
    const funcName = NakoGen.getFuncName(node.name)
    const res = this.findVar(funcName)
    if (res === null) {
      throw new NakoGenError(`関数『${funcName}』が見当たりません。有効プラグイン=[` + this.getPluginList().join(', ') + ']', node.line)
    }
    let func
    if (res.i === 0) { // plugin function
      func = this.funclist[funcName]
      if (func.type !== 'func') {
        throw new NakoGenError(`『${funcName}』は関数ではありません。`, node.line)
      }
    } else {
      func = this.nako_func[funcName]
      // 無名関数の可能性
      if (func === undefined) {func = {return_none: false}}
    }
    // 関数の参照渡しか？
    if (node.type === 'func_pointer') {
      return res.js
    }
    // 関数の参照渡しでない場合
    // 関数定義より助詞を一つずつ調べる
    const argsInfo = this.convFuncGetArgsCalcType(funcName, func, node)
    const args = argsInfo[0]
    const argsOpts = argsInfo[1]
    // function
    if (typeof (this.used_func[funcName]) === 'undefined') {
      this.used_func[funcName] = true
    }

    // 関数呼び出しで、引数の末尾にthisを追加する-システム情報を参照するため
    args.push('__self')
    let funcBegin = ''
    let funcEnd = ''
    // setter?
    if (node['setter']) {
      funcBegin += ';__self.isSetter = true;\n'
      funcEnd += ';__self.isSetter = false;\n'
    }
    // 関数内 (__varslist.length > 3) からプラグイン関数 (res.i === 0) を呼び出すとき、 そのプラグイン関数がpureでなければ
    // 呼び出しの直前に全てのローカル変数をthis.__localsに入れる。
    if (res.i === 0 && this.__varslist.length > 3 && func.pure !== true) { // undefinedはfalseとみなす
      // 展開されたローカル変数の列挙
      const localVars = []
      for (const name of Object.keys(this.__vars).filter((v) => v !== '!関数')) {
        if (NakoGen.isValidIdentifier(name)) {
          localVars.push({ str: JSON.stringify(name), js: this.varname(name) })
        }
      }

      // --- 実行前 ---

      // 全ての展開されていないローカル変数を __self.__locals にコピーする
      funcBegin += `__self.__locals = __vars;\n`

      // 全ての展開されたローカル変数を __self.__locals に保存する
      for (const v of localVars) {
        funcBegin += `__self.__locals[${v.str}] = ${v.js};\n`
      }

      // --- 実行後 ---

      // 全ての展開されたローカル変数を __self.__locals から受け取る
      // 「それ」は関数の実行結果を受け取るために使うためスキップ。
      for (const v of localVars) {
        if (v.js !== 'それ') {
          funcEnd += `${v.js} = __self.__locals[${v.str}];\n`
        }
      }
    }
    // 変数「それ」が補完されていることをヒントとして出力
    if (argsOpts['sore']){funcBegin += '/*[sore]*/'}

    const indent = (text, n) => {
      let result = ''
      for (const line of text.split('\n')) {
        if (line !== '') {
          result += '  '.repeat(n) + line + '\n'
        }
      }
      return result
    }

    // 関数呼び出しコードの構築
    let argsCode = args.join(',')
    let funcCall = `${res.js}(${argsCode})`
    let code = ``
    if (func.return_none) {
      if (funcEnd === '') {
        code = `${funcBegin} ${funcCall};\n`
      } else {
        code = `${funcBegin}try {\n${indent(funcCall, 1)};\n} finally {\n${indent(funcEnd, 1)}}\n`
      }
    } else {
      if (funcBegin === '' && funcEnd === '') {
        code = `(${this.varname('それ')} = ${funcCall})`
      } else {
        if (funcEnd === '') {
          code = `(function(){\n${indent(`${funcBegin};\nreturn ${this.varname('それ')} = ${funcCall}`, 1)}}).call(this)`
        } else {
          code = `(function(){\n${indent(`${funcBegin}try {\n${indent(`return ${this.varname('それ')} = ${funcCall};`, 1)}\n} finally {\n${indent(funcEnd, 1)}}`, 1)}}).call(this)`
        }
      }
      // ...して
      if (node.josi === 'して'){code += ';\n'}
    }
    return code
  }

  convRenbun(node) {
    let right = this._convGen(node.right)
    let left = this._convGen(node.left)
    return `(function(){${left}; return ${right}}).call(this)`
  }

  convOp (node) {
    const OP_TBL = { // トークン名からJS演算子
      '&': '+""+',
      'eq': '==',
      'noteq': '!=',
      'gt': '>',
      'lt': '<',
      'gteq': '>=',
      'lteq': '<=',
      'and': '&&',
      'or': '||',
      'shift_l': '<<',
      'shift_r': '>>',
      'shift_r0': '>>>'
    }
    let op = node.operator // 演算子
    let right = this._convGen(node.right)
    let left = this._convGen(node.left)
    if (op === '+' && this.speedMode.implicitTypeCasting === 0) {
      if (node.left.type !== 'number') {
        left = `parseFloat(${left})`
      }
      if (node.right.type !== 'number') {
        right = `parseFloat(${right})`
      }
    }
    // 階乗
    if (op === '^')
      {return '(Math.pow(' + left + ',' + right + '))'}

    // 一般的なオペレータに変換
    if (OP_TBL[op]) {op = OP_TBL[op]}
    //
    return `(${left} ${op} ${right})`
  }

  convLet (node) {
    // もし値が省略されていたら、変数「それ」に代入する
    let value = this.varname('それ')
    if (node.value) {value = this._convGen(node.value)}
    // 変数名
    const name = node.name.value
    const res = this.findVar(name)
    let code = ''
    if (res === null) {
      this.__vars[name] = true
      code = `${this.varname(name)}=${value};`
    } else {
      // 定数ならエラーを出す
      if (this.__varslist[res.i].meta)
        {if (this.__varslist[res.i].meta[name]) {
          if (this.__varslist[res.i].meta[name].readonly)
            {throw new NakoGenError(
              `定数『${name}』は既に定義済みなので、値を代入することはできません。`,
              node.line)}

        }}
        code = `${res.js}=${value};`
    }

    return ';' + this.convLineno(node, false) + code + '\n'
  }

  convDefLocalVar(node) {
    const value = (node.value === null) ? 'null' : this._convGen(node.value)
    const name = node.name.value
    const vtype = node.vartype // 変数 or 定数
    // 二重定義？
    if (this.__vars[name] !== undefined)
      {throw new NakoGenError(
        `${vtype}『${name}』の二重定義はできません。`,
        node.line)}

    //
    this.__vars[name] = true
    if (vtype === '定数') {
      if (!this.__vars.meta)
        {this.__vars.meta = {}}

      if (!this.__vars.meta[name]) {this.__vars.meta[name] = {}}
      this.__vars.meta[name].readonly = true
    }
    const code = `${this.varname(name)}=${value};\n`
    return this.convLineno(node, false) + code
  }

  convString (node) {
    let value = '' + node.value
    let mode = node.mode
    value = value.replace(/\\/g, '\\\\')
    value = value.replace(/"/g, '\\"')
    value = value.replace(/\r/g, '\\r')
    value = value.replace(/\n/g, '\\n')
    if (mode === 'ex') {
      let rf = (a, name) => {
        return '"+' + this.genVar(name) + '+"'
      }
      value = value.replace(/\{(.+?)\}/g, rf)
      value = value.replace(/｛(.+?)｝/g, rf)
    }
    return '"' + value + '"'
  }

  convTryExcept(node) {
    const block = this._convGen(node.block)
    const errBlock = this._convGen(node.errBlock)
    return this.convLineno(node, false) +
      `try {\n${block}\n} catch (e) {\n` +
      '__varslist[0]["エラーメッセージ"] = e.message;\n' +
      ';\n' +
      `${errBlock}}\n`
  }
}

module.exports = NakoGen
