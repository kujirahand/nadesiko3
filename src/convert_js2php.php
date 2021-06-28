<?php
if (count($argv) < 2) {
  echo "convert_js2php (jsfile)\n";
  exit;
}
conv($argv[1]);

function conv($infile) {
  $body = file_get_contents($infile);
  $aaa = explode("\n", $body);
  echo "<?php // phpnako のプラグイン\n";
  echo '$'."export = [\n";
  foreach ($aaa as $row) {
    // コメントの出力
    if (preg_match('#^\s*//\s+@\s*(.+)#', $row, $m)) {
      echo "  // @ $m[1]\n";
      continue;
    }
    // 定数の変換
    if (preg_match("#'(.*?)':\s*\{\s*type:\s*'const',\s*value:\s*(\S+)\s*\},\s*\/\/\s*(.*)#", 
      $row, $m)) {
      echo "  '$m[1]'=>['type'=>'const', 'value'=>$m[2]], // $m[3]\n";
      continue;
    }
    // 関数定義
    if (preg_match("#'(.*?)'\:\s*\{\s*\/\/\s*(.*)#", $row, $m)) {
      echo "  '$m[1]'=> [ // $m[2]\n";
      continue;
    }
    if (preg_match('#type\:\s*\'func\'#', $row, $m)) {
      echo "    'type' => 'func',\n";
      continue;
    }
    if (preg_match('#josi\s*\:\s*(.+)#', $row, $m)) {
      echo "    'josi' => $m[1]\n";
      continue;
    }
    if (preg_match('#fn\:\s*function\s\((.*?)\) {#', $row, $m)) {
      $s = trim($m[1]);
      if ($s != '') {
        $args = explode(',',$s);
        foreach ($args as $i => $a) { $args[$i] = "$".trim($a); }
        $arg = implode(', ', $args);
      } else { $arg = ''; }
      echo "    'fn' => function($arg) {\n".
           "      throw new Exception('未実装のメソッドです');\n".
           "    },\n";
      continue;
    }
    if (preg_match('#return_none\s*:\s*true#', $row, $m)) {
      echo "    'return_none' => true,\n";
      continue;
    }
    if ($row === '  },' || $row === '  }') {
      echo "  ],\n";
    }
    if (preg_match('#pure:#', $row, $m)) { continue; }
    if (strpos($row, 'value:')) {
      echo "[NG]$row\n";
    }
    #echo $row."\n";
  }
  echo "];\n";
}

