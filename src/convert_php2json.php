#!/usr/bin/env php
<?php
$files = glob('plugin_*.php');
foreach ($files as $f) {
  conv($f);
}

function conv($file) {
  require_once($file);
  $json = json_encode($exports, 
    JSON_UNESCAPED_UNICODE |
    JSON_PRETTY_PRINT);
  $fname_out = $file.".json";
  echo "convert:$fname_out\n";
  file_put_contents($fname_out, $json);
}


