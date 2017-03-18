// cnako3.js

const fs = require('fs');
const exec = require('child_process').exec;

const NakoCompiler = require(__dirname + '/nako3');
const PluginNode = require(__dirname + '/plugin_node');

const nako = new NakoCompiler();
nako.silent = false;
nako.addPluginFile('PluginNode', __dirname + "/plugin_node.js", PluginNode);

const opt = checkArguments();
nako_run(opt);

/**
 * コマンドライン引数を解析
 * @returns {{mainfile: string, compile: boolean, run: boolean, output: string, source: string, one_liner: boolean, debug: (boolean|*)}}
 */
function checkArguments() {
    if (process.argv.length <= 2) {
        console.log("cnako3 nakofile");
        process.exit();
    }
    let mainfile = "", output = "", source = "";
    let flag_compile = false, flag_run = false, flag_one_liner = false;
    let i = 2;
    while (i < process.argv.length) {
        const arg = process.argv[i];
        if (arg == "-debug" || arg == "--debug") {
            nako.debug = true;
            i++;
            continue;
        }
        // コンパイルモードを使うか
        if (arg == "-c" || arg == "--compile") {
            flag_compile = true;
            i++;
            continue;
        }
        // コンパイルモードでも実行するか
        if (arg == "-run" || arg == "--run") {
            flag_run = true;
            i++;
            continue;
        }
        // ワンライナー
        if (arg == "-e" || arg == "--eval") {
            flag_one_liner = true;
            i++;
            source = process.argv[i++];
            continue;
        }
        if (arg == "-o") {
            i++;
            output = arg;
            i++;
        }
        if (mainfile == "") {
            mainfile = process.argv[i];
            i++;
            continue;
        }
        i++;
    }
    if (output == "") {
        output = mainfile + ".js";
    }
    return {
        "mainfile": mainfile,
        "compile": flag_compile,
        "run": flag_run,
        "output": output,
        "source": source,
        "one_liner": flag_one_liner,
        "debug": nako.debug,
    };
}

/**
 * なでしこを実行
 * @param opt
 */
function nako_run(opt) {
    if (opt.one_liner) {
        nako_one_liner(opt);
        return;
    }

    const src = fs.readFileSync(opt.mainfile, "utf-8");
    if (opt.compile) {
        nako_compile(opt, src);
        return;
    }
    nako.run_reset(src);
}

/**
 * コンパイルモードの場合
 * @param opt
 * @param src
 */
function nako_compile(opt, src) {
    // system
    const js = nako.compile(src);
    const jscode =
        nako.getHeader() +
        nako.getVarsCode() +
        js;
    fs.writeFileSync(opt.output, jscode, "utf-8");
    if (opt.run) {
        exec(`node ${opt.output}`, function (err, stdout, stderr) {
            if (err) console.log("[ERROR]", stderr);
            console.log(stdout);
        });
    }
}

// ワンライナーの場合
function nako_one_liner(opt) {
    nako.run_reset(opt.source);
}
