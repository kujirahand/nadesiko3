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
const fs = require('fs')
const child_process = require('child_process')
const execSync = child_process.execSync
const exec = child_process.exec

// --------------------------------------------
// デモサーバーを起動
const root = execSync('npm -g root').toString().replace(/\s+/, '')
const nadesiko = root + "\\nadesiko3"
const bat = nadesiko + '\\bin\\nako3server.bat'
exec('start cmd /c ' + bat)
setTimeout(function() {
    process.exit()
}, 3000)








