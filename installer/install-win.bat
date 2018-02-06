rem=/* 日本語プログラミング言語「なでしこ」v3
@echo OFF
node "%~0" %*
IF "%ERRORLEVEL%"=="9009" (
  ECHO ------------------------------------
  ECHO [エラーの理由]
  ECHO ------------------------------------
  ECHO なでしこ3をローカルで実行するには Node.js が必要です。
  ECHO 下記のWebサイトからインストールしてください。
  ECHO [URL] https://nodejs.org
  ECHO インストール後、改めて、このバッチファイルを実行してください。
  PAUSE
  EXIT
) ELSE (
  rem PAUSE
  EXIT
)
*/0;
// --------------------------------------------
// ここから Node.js のプログラム
// --------------------------------------------
const VERSION = "3.0.24"
// --------------------------------------------
const fs = require('fs')
const child_process = require('child_process')
const execSync = child_process.execSync
const exec = child_process.exec
const opener = require('opener')
// --------------------------------------------
try {
    // インストールされているかチェック
    let cnakoVersion = execSync('cnako3 -v').toString().replace(/\s+/, '')
    console.log('cnakoVer=', cnakoVersion)
    if (gtVersion(VERSION, cnakoVersion)) {
        console.log("Checked version", VERSION, '>', cnakoVersion)
        console.log("Now, updating nadesiko3 ...")
        execSync('CALL npm -g update nadesiko3')
        cnakoVersion = execSync('cnako3 -v').toString()
    }
    console.log("Installed version=", cnakoVersion)
} catch (e) {
    console.log(e);
    console.log("Install nadesiko3...")
    const result = execSync('CALL npm -g install nadesiko3')
    console.log(result.toString());
}
// --------------------------------------------
// デモサーバーを起動
const root = execSync('npm -g root').toString().replace(/\s+/, '')
const nadesiko = root + "\\nadesiko3"
const bat = nadesiko + '\\bin\\nako3server.bat'
exec('start cmd /c ' + bat)
setTimeout(function() {
    process.exit()
}, 3000)
// opener(bat)

// バージョンチェック
function gtVersion(a, b) {
    const aa = parseFloat(a.replace(/^3\./, ''))
    const bb = parseFloat(b.replace(/^3\./, ''))
    // console.log("gtVersion=", aa, '>', bb)
    return (aa > bb)
}




 





