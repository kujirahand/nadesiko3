@echo OFF
ECHO ------------------------------------
ECHO なでしこ3 Windows向けインストーラー
ECHO ------------------------------------

node -v
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
)

ECHO Node.jsが利用できます
ECHO ----------------------------------
ECHO なでしこ3の実行に必要な環境をダウンロードします。
ECHO 少々お待ちください。

CALL npm -g install nadesiko3

ECHO ok.
PAUSE











