<?php
define("DIR_CORE", dirname(__DIR__));

replace_mjs2mts(DIR_CORE."/src/*.mts");

function replace_mjs2mts($dir) {
  $files = glob($dir);
  foreach ($files as $file) {
    echo "=== $file ===\n";
    $content = file_get_contents($file);
    $content = str_replace("mjs", "mts", $content);
    $lines = explode("\n", $content);
    foreach ($lines as $i => $line) {
      if (preg_match('#^import\s#', $line)) {
        $line = preg_replace("#\.mjs'$#", ".mts'", $line);
        echo "- $line\n";
      }
      $lines[$i] = $line;
    }
    $content = implode("\n", $lines);
    file_put_contents($file, $content);
    echo "\n";
  }
}
