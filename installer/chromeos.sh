#!/bin/bash

# Node.jsをインストール
sudo apt update
sudo apt install -y nodejs npm

# Node.jsを最新版にアップデート
sudo npm install n -g
sudo n stable
sudo ln -sf /usr/local/bin/node /usr/bin/node
sudo ln -sf /usr/local/bin/npm /usr/bin/npm

# なでしこ3をインストール
sudo npm install -g nadesiko3

# 追加
sudo apt install -y p7zip-full xdotool
