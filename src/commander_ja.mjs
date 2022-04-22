// commander_ja.js
export default {
  args: /** @type {string[]} */([]),
  _alias: /** @type {Record<string, string>} */({}),
  _hasarg: /** @type {Record<string, boolean>} */({}),
  _help: /** @type {[string, string][]} */([]),
  _usage: '',
  _version: '1.0.0',
  _title: '',
  reset: function () {
    this.args = []
    this._alias = {}
    this._hasarg = {}
    this._help = []
    this._usage = ''
    this._version = '1.0.0'
    this._title = ''
    this.option('-h, --help', '使い方を表示する')
  },
  /**
     * set version info
     * @param {*} ver version info
     * @param {*} cmd -v, --version
     */
  version (ver, cmd) {
    this.option(cmd, 'バージョン情報を表示')
    this._version = ver
    return this
  },
  /**
     * @param {string} title
     */
  title (title) {
    this._title = title
    return this
  },
  /**
     * @param {string} usage
     */
  usage (usage) {
    this._usage = usage
    return this
  },
  /**
     * @param {string} cmd
     * @param {string} desc
     */
  option (cmd, desc) {
    this._help.push([cmd, desc])
    let name1 = ''
    const name2 = /** @type {string[]} */([])
    const cmdList = cmd.split(',')
    cmdList.forEach((t) => {
      const c = t.replace(/\s+/, '')
      const m = c.match(/^(-+)([a-zA-Z0-9_]+)/)
      if (!m) {
        throw Error('[Invalid option]: should be -(shortname) --(longname): ' + cmd)
      }
      if (m[1] === '--') {
        name1 = m[2]
        return
      }
      if (m[1] === '-') {
        name2.push(m[2])
      }
    })
    if (name1 === '') {
      throw Error('Invalid option(no longname): ' + cmd)
    }
    if (name1 === 'version') { name1 = 'version_' }
    this[name1] = false
    name2.forEach((t) => {
      this._alias[t] = name1
    })
    this._hasarg[name1] = (cmd.indexOf('[') >= 0)
    return this
  },
  /**
     * parse and return str
     * @param {string[]} argv
     * @return {string}
     */
  parseStr (argv) {
    this.args = []
    const paramStack = []
    let lastOpt = ''
    for (let i = 2; i < argv.length; i++) {
      const arg = argv[i]
      // Not Options
      if (arg.charAt(0) !== '-') {
        if (paramStack.length > 0) {
          const argParam = paramStack.pop()
          this[argParam] = arg
          continue
        }
        this.args.push(arg)
        continue
      }
      // Options
      if (arg.substring(0, 2) === '--') {
        lastOpt = arg.substring(2)
        if (lastOpt === 'version') { lastOpt = 'version_' }
      } else {
        // Short Option
        const shortName = arg.substring(1)
        if (this._alias[shortName]) {
          lastOpt = this._alias[shortName]
        } else {
          // Not exists
          continue
        }
      }
      // set option true
      this[lastOpt] = true
      if (this._hasarg[lastOpt]) { // has argument?
        // init parameter
        this[lastOpt] = ''
        paramStack.push(lastOpt)
      }
    }
    // show version?
    if (this.version_) {
      return this._version
    }
    // show help?
    if (this.help) {
      return this.getHelp()
    }
    return ''
  },

  /**
     * parse
     * @param {*} argv
     */
  parse (argv) {
    const s = this.parseStr(argv)
    if (s === '') {
      return this
    }
    console.log(s)
    process.exit(0)
  },

  getHelp () {
    let ss = ''
    if (this._title) {
      ss += this._title + '\n'
    }
    ss += '使い方: ' + this._usage + '\n'
    ss += 'オプション:\n'
    const spc = '                               '
    this._help.forEach((c) => {
      const opt = c[0] + spc
      ss += '  ' + opt.substring(0, 20) + ' ' + c[1] + '\n'
    })
    return ss
  }
}
