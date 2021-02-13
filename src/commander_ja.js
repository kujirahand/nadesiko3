// commander_ja.js
//
const app = {
    'args': [],
    '_alias': {},
    '_help': [],
    '_usage': '',
    '_version': '1.0.0',
    '_title': ''
}
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
    app[name1] = false
    name2.forEach((t) => {
        app._alias[t] = name1
    })
    return app
}
app.parse = (argv) => {
    let lastname = ''
    for (let i = 1; i < argv.length; i++) {
        arg = argv[i]
        if (arg.substr(0, 2) == '--') {
            lastname = arg.substr(2)
            app[lastname] = true
            continue
        }
        if (arg.charAt(0) == '-') {
            const short = arg.substr(1)
            if (app._alias[short]) {
                lastname = app._alias[short]
                app[lastname] = true
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
    if (app.version) {
        console.log(app._version)
        process.exit(0)
    }
    if (app.help) {
        app.showHelp()
        process.exit(0)
    }
    return app
}
app.option('-h, --help', 'コマンドの使い方を表示')

app.showHelp = ()=> {
    if (app._title) {
        console.log(app._title)
    }
    console.log('使い方: ', app._usage)
    console.log('オプション:')
    const spc = '                               '
    app._help.forEach((c) =>{
        const opt = c[0] + spc
        console.log('  ', opt.substr(0, 20), c[1])
    })
}

// register app
module.exports = app

