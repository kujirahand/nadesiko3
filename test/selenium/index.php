<?php
function main() {
  $dir = __DIR__;
  $release = dirname(dirname($dir)).'/release';
  $m = empty($_GET['m']) ? '' : $_GET['m'];
  if ($m == 'kill') {
    echo "kill";
    system(__DIR__.'/server-stop.sh');
    return;
  }
  if ($m == 'hello') { echo "hello\n"; return; }
  if ($m == '301') {
    $url = 'http://'.$_SERVER['HTTP_HOST'].'/index.php?m=hello';
    header('Location: ' . $url, true, 301);
    return;
  }
  if ($m == 'echo') { echo empty($_GET['p']) ? '' : $_GET['p']; return; }
  if ($m == 'echopost') { echo empty($_POST['p']) ? '' : $_POST['p']; return; }
  if ($m == 'upload') {
    if (empty($_FILES['file'])) { echo 'ng'; return; } 
    $tmp = $_FILES['file']['tmp_name'];
    echo file_get_contents($tmp); return;
  }
  if ($m == 'upload-b64') {
    if (empty($_FILES['file'])) { echo 'ng'; return; } 
    $tmp = $_FILES['file']['tmp_name'];
    echo base64_encode(file_get_contents($tmp)); return;
  }
  if ($m == 'json') {
    header('content-type: text/json; charset=utf-8;');
    echo json_encode($_POST);
    return;
  }
  if ($m == 'file') {
    $f = empty($_GET['f']) ? '' : $_GET['f'];
    $path = __DIR__."/test_target/$f";
    if (file_exists($path)) {
      $code = file_get_contents($path);
      testcode($code);
      return;
    } else {
      echo 'failed to load file'; return;
    }
  }
  if ($m == 'release') {
    $f = empty($_GET['f']) ? '' : $_GET['f'];
    header('content-type: text/javascript; charset=utf-8;');
    $path = "$release/$f";
    if (file_exists($path)) {
      echo file_get_contents($path);
    } else {
      echo '// not found';
    }
    return;
  }
  if ($m == 'code') {
    $code = empty($_GET['code']) ? '' : $_GET['code'];
    testcode($code);
    return;
  }
  defaultPage();
}
main();

function testcode($code) {
  echo <<< EOS
<!DOCTYPE><html><head><meta charset="UTF-8">
<script src="index.php?m=release&f=wnako3.js&run=1"></script>
<script type="なでしこ">{$code}</script>
</head><body>
<div><textarea id="result" rows="10" cols="60"></textarea></div>
<div><canvas id="main_cv" width="8" height="8"></div>
<script>
  const result = document.getElementById('result')
  function print(arg, sys) {
    result.value += '' + arg + '\\n'
  }
  function printClear(arg, sys) {
    result.value = ''
  }
  navigator.nako3.setFunc("表示", [['と', 'を', 'の']], print)
  navigator.nako3.setFunc("表示クリア", [['と', 'を', 'の']], printClear)
</script>
</body></html>
EOS;
}
function defaultPage() {
  echo <<< EOS
<!DOCTYPE><html><head><meta charset="UTF-8">
</head><body>
<h1>GET hello</h1><div>
<a href="index.php?m=hello">m=hello</a>
</div>
<h1>POST</h1><div>
  <form action="./index.php?m=json" method="POST">
      <input type="text" name="name" value="taro">
      <input type="text" name="value" value="18">
      <input type="submit" value="送信">
  </form>
</div>
<h1>UPLOAD</h1><div>
  <form action="./index.php?m=upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file">
      <input type="submit" value="送信">
  </form>
</div>
</body></html>
EOS;
}
