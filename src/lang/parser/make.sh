#!/bin/sh
cd `dirname $0`
$(npm bin)/pegjs --cache -o nako_parser.js nako_parser.pegjs


