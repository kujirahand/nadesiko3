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
const VERSION = "3.0.24"
const fs = require('fs')
const execSync = require('child_process').execSync

// なでしこインストールディレクトリを見る
const root = execSync('npm -g root').toString()
const nadesiko = root + "\\nadesiko3"
execSync(nadesiko + "\\bin\\nako3-server.bat")
console.log("ok.");









