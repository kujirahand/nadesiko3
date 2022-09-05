#!/bin/bash
SCRIPT_DIR=$(cd $(dirname $0); pwd)
# start server
bash $SCRIPT_DIR/server-start.sh &
# test with selenium
python3 $SCRIPT_DIR/test_chrome.py
# stop server
bash $SCRIPT_DIR/server-stop.sh


