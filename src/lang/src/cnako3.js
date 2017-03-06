// cnako3.js

const fs = require('fs');
const exec = require('child_process').exec;

const NakoCompiler = require('./nako3.js');
const nako = new NakoCompiler();
nako.silent = false;
nako.addPluginFile('PluginNode', __dirname + "/plugin_node.js");

const opt = checkArguments();
nako_run(opt);

// コマンドライン引数を解析
function checkArguments() {
  if (process.argv.length <= 2) {
    console.log("cnako3 nakofile");
    process.exit();
  }
  let mainfile = "", output = "";
  let flag_compile = false, flag_run = false;
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
    "debug": nako.debug,
  };
}

// なでしこを実行
function nako_run(opt) {
  const src = fs.readFileSync(opt.mainfile, "utf-8");
  if (opt.compile) {
    nako_compile(opt, src);
    return;
  }
  nako.run_reset(src);
}

// コンパイルモードの場合
function nako_compile(opt, src) {
  // system
  nako.addPluginFile('PluginSystem', __dirname + "/plugin_system.js");
  nako.addPluginFile('PluginNode', __dirname + "/plugin_node.js");
  const js = nako.compile(src);
  const jscode = 
    nako.getHeader() +
    nako.getVarsCode() +
    js;
  fs.writeFileSync(opt.output, jscode, "utf-8");
  if (opt.run) {
    exec(`node ${opt.output}`, function(err, stdout, stderr) {
      if (err) console.log("[ERROR]", stderr);
      console.log(stdout);
    });
  }
}



