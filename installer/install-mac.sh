#!/bin/bash
NODE_PATH=`which node`
if [ $NODE_PATH = "" ]; then
  echo "なでしこ3のインストールには、Node.jsが必要です。"
  echo "以下のURLよりダウンロードしてインストールしてください。"
  echo "[URL] https://nodejs.org/"
  exit
else
  npm -g install nadesiko3
  echo "ok."
fi

