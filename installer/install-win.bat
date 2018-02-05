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
const opener = require('opener')
try {
  // インストールされているかチェック
  let cnakoVersion = execSync('cnako3 -v').toString().replace(/\s+/, '')
  if (cnakoVersion !== VERSION) {
    console.log("UPDATE")
    execSync('CALL npm -g update nadesiko3@' + VERSION)
    cnakoVersion = execSync('cnako3 -v').toString()
  }
  console.log("INSTALLED version=", cnakoVersion)
} catch (e) {
  // console.log(e);
  console.log("INSTALL NADESIKO3 --- Please wait a moment")
  const result =  execSync('CALL npm -g install nadesiko3@' + VERSION);
  console.log(result.toString());
}
// デモサーバーを起動
const root = execSync('npm -g root').toString().replace(/\s+/, '')
const nadesiko = root + "\\nadesiko3"
opener(nadesiko + '\\bin\\nako3server.bat')
console.log("ok.")



 





