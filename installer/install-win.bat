rem=/* 日本語プログラミング言語「なでしこ」v3
@echo OFF
node %~0 %*
IF "%ERRORLEVEL%"=="9009" (
  ECHO ------------------------------------
  ECHO なでしこ3 Windows向けインストーラー
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
try {
  // インストールされているかチェック
  const cnakoVersion =  execSync('cnako3 -v').toString()
  console.log("INSTALLED version=", cnakoVersion)
} catch (e) {
  // console.log(e);
  console.log("INSTALL NADESIKO3 --- Please wait a moment")
  const result =  execSync('CALL npm -g install nadesiko3');
  console.log(result.toString());
}
console.log("ok.");









