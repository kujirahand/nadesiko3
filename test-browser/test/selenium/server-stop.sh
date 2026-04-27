#!/bin/sh
ps aux | grep "php -S localhost" | grep -v grep | awk '{ print "kill -9", $2 }' | sh

