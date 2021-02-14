// commander_ja.js
const app = {
    'args': [],
    '_alias': {},
    '_hasarg':{},
    '_help': [],
    '_usage': '',
    '_version': '1.0.0',
    '_title': ''
}
/**
 * set version info
 * @param {*} ver version info
 * @param {*} cmd -v, --version
 */
app.version = (ver, cmd) => {
    app.option(cmd, 'バージョン情報を表示')
    app._version = ver
    return app
}
app.title = (title) => {
    app._title = title
    return app
}
app.usage = (usage) => {
    app._usage = usage
    return app
}
app.option = (cmd, desc) => {
    app._help.push([cmd, desc])
    let name1 = ''
    let name2 = []
    const cmdList = cmd.split(',')
    cmdList.forEach((t) => {
        const c = t.replace(/\s+/, '')
        const m = c.match(/^(\-+)([a-zA-Z0-9_]+)/)
        if (!m) {
            throw Error('[Invalid option]: should be -(shortname) --(longname): ' + cmd)
        }
        if (m[1] == '--') {
            name1 = m[2]
            return
        }
        if (m[1] == '-') {
            name2.push(m[2])
            return
        }
    })
    if (name1 === '') {
        throw Error('Invalid option(no longname): ' + cmd)
    }
    if (name1 === 'version') {name1='version_'}
    app[name1] = false
    name2.forEach((t) => {
        app._alias[t] = name1
    })
    app._hasarg[name1] = (cmd.indexOf('[') >= 0)
    return app
}
/**
 * parse and return str
 * @param {*} argv 
 * @return {string}
 */
app.parseStr = (argv) => {
    app['args'] = []
    let lastname = ''
    for (let i = 2; i < argv.length; i++) {
        arg = argv[i]
        if (arg.substr(0, 2) == '--') {
            lastname = arg.substr(2)
            if (lastname === 'version') {lastname='version_'}
            app[lastname] = true
            if(!app._hasarg[lastname]) {
                lastname = ''
            }
            continue
        }
        if (arg.charAt(0) == '-') {
            const short = arg.substr(1)
            if (app._alias[short]) {
                lastname = app._alias[short]
                app[lastname] = true
                if(!app._hasarg[lastname]) {
                    lastname = ''
                }
                continue
            }
            continue
        }
        if (lastname != '') {
            app[lastname] = arg
            lastname = ''
            continue
        }
        app.args.push(arg)
    }
    if (app.version_) {
        return app._version
    }
    if (app.help) {
        return app.getHelp()
    }
    return ''
}
/**
 * parse
 * @param {*} argv 
 */
app.parse = (argv) => {
    const s = this.parseStr(argv)
    if (s === '') {
        return app
    }
    console.log(s)
    process.exit(0)
}
app.option('-h, --help', 'コマンドの使い方を表示')

app.getHelp = ()=> {
    let ss = ''
    if (app._title) {
        ss += app._title + '\n'
    }
    ss += '使い方: ' + app._usage + '\n'
    ss += 'オプション:\n'
    const spc = '                               '
    app._help.forEach((c) =>{
        const opt = c[0] + spc
        ss += '  ' + opt.substr(0, 20) + ' ' + c[1] + '\n'
    })
    return ss
}

// register app
module.exports = app

