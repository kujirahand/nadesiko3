#!/bin/bash
ROOT_DIR=$(
  cd $(dirname "$0")
  cd ..
  pwd
)

npx textlint $ROOT_DIR/*.md
npx textlint $ROOT_DIR/doc/*.md
npx textlint $ROOT_DIR/batch/*.md
npx textlint $ROOT_DIR/tools/*.md
