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
  PAUSE
  EXIT
)
*/0;
// --------------------------------------------
// ここから Node.js のプログラム
// --------------------------------------------
const fs = require('fs')
const execSync = require('child_process').execSync
const opener = require('opener')

// なでしこインストールディレクトリを見る
const root = execSync('npm -g root').toString().replace(/\s+/, '')
const nadesiko = root + "\\nadesiko3"
opener(nadesiko + "\\bin\\nako3server.bat")
console.log("ok.")
// process.exit()








