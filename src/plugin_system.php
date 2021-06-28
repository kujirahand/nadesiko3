<?php
// 関数を定義した後に php2json.php を実行
// 関数の定義は $exports という名前の変数に代入する

$exports = [
  '表示' => [
    'type' => 'func',
    'josi' => [['を'], ['と']],
    'fn' => function ($s, $sys) {
      echo $s;
    },
    'return_none' => TRUE,
  ],
];


