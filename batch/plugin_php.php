<?php
// PHPに関する機能を宣言したもの
global $nako3;
$exports = [
  // @PHP定数
  'PHPバージョン' => ['type'=>'const', 'value' => phpversion()], // @PHPばーじょん
  // @PHPシステム
  'PHP取込'=> [ // @PHPファイルを取り込む。 // @PHPとりこむ
    'type' => 'func',
    'josi' => [['を','の','から']],
    'fn' => function($file) {
      include $file;
    },
    'return_none' => TRUE,
  ],
  'セッション開始'=> [ // @PHPセッションを開始する。 // @せっしょんかいし
    'type' => 'func',
    'josi' => [['を','の','から']],
    'fn' => function($file) {
      @session_start();
    },
    'return_none' => TRUE,
  ],
  'クッキー取得'=> [ // @cookieパラメータのKEYを、省略値DEFで取得する // @くっきーしゅとく
    'type' => 'func',
    'josi' => [['を'],['で', 'にて']],
    'fn' => function($key, $def) {
      return empty($_COOKIE[$key]) ? $def : $_COOKIE[$key];
    },
  ],
  'クッキー設定'=> [ // @cookieのKEYをVに設定する // @くっきーせってい
    'type' => 'func',
    'josi' => [['を'],['へ','に']],
    'fn' => function($key, $v) {
      global $__v0;
      $opt = isset($__v0['クッキーオプション']) ? $__v0['クッキーオプション'] : [];
      setcookie($key, $v, $opt);
    },
    'return_none' => TRUE,
  ],
  'クッキーオプション' => ['type'=>'const', 'value'=>[]], // @くっきーおぷしょん  
  'クッキーオプション設定'=> [ // @cookieのオプションを辞書型で設定する // @くっきーおぷしょんせってい
    'type' => 'func',
    'josi' => [['を','へ','に']],
    'fn' => function($v) {
      global $__v0;
      $__v0['クッキーオプション'] = $v;
    },
    'return_none' => TRUE,
  ],
  'GET' => ['type'=>'const', 'value'=>[]], // @GET
  'POST' => ['type'=>'const', 'value'=>[]], // @POST 
  'FILES' => ['type'=>'const', 'value'=>[]], // @FILES 
  'SESSION' => ['type'=>'const', 'value'=>[]], // @SESSION
  'GET取得'=> [ // @GETパラメータのKEYを、省略値DEFで取得する // @GETしゅとく
    'type' => 'func',
    'josi' => [['を'],['で', 'にて']],
    'fn' => function($key, $def) {
      return empty($_GET[$key]) ? $def : $_GET[$key];
    },
  ],
  'POST取得'=> [ // @POSTパラメータのKEYを、省略値DEFで取得する // @POSTしゅとく
    'type' => 'func',
    'josi' => [['を'],['で', 'にて']],
    'fn' => function($key, $def) {
      return empty($_POST[$key]) ? $def : $_POST[$key];
    },
  ],
  'セッション取得'=> [ // @セッションパラメータのKEYを、省略値DEFで取得する // @せっしょんしゅとく
    'type' => 'func',
    'josi' => [['を'],['で', 'にて']],
    'fn' => function($key, $def) {
      return empty($_SESSION[$key]) ? $def : $_SESSION[$key];
    },
  ],
  'セッション設定'=> [ // @セッションパラメータのKEYをVで設定する // @せっしょんせってい
    'type' => 'func',
    'josi' => [['を'],['で', 'にて']],
    'fn' => function($key, $v) {
      $_SESSION[$key] = $v;
    },
    'return_none' => TRUE,
  ],
  'ヘッダ設定'=> [ // @HTTPヘッダをVに設定する // @へっだせってい
    'type' => 'func',
    'josi' => [['に', 'へ', 'の']],
    'fn' => function($v) {
      header($v);
    },
    'return_none' => TRUE,
  ],
  // @PDO
  'PDOオブジェクト' => ['type'=>'const', 'value' => null], // @PDOおぶじぇくと
  'PDO生成'=> [ // @DSNを指定してPDOを生成して返す // @PDOせいせい
    'type' => 'func',
    'josi' => [['で','の','を']],
    'fn' => function($dsn) {
      global $__v0;
      $__v0['PDOオブジェクト'] = $v = new PDO($dsn);
      $v->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      return $v;
    },
  ],
  'PDO設定'=> [ // @生成済みのPDOオブジェクトを切り替える。 // @PDOせいせい
    'type' => 'func',
    'josi' => [['に','へ']],
    'fn' => function($pdo) {
      global $__v0;
      $__v0['PDOオブジェクト'] = $pdo;
    },
    'return_none' => TRUE,
  ],
  'PDO実行'=> [ // @SQLコマンドをデータ配列Aで実行して結果を返す // @PDOじっこう
    'type' => 'func',
    'josi' => [['を'],['で','の']],
    'fn' => function($sql, $a) {
      global $__v0;
      $pdo = $__v0['PDOオブジェクト'];
      $st = $pdo->prepare($sql);
      return $st->execute($a);
    },
  ],
  'PDO全取得'=> [ // @SQLコマンドをデータ配列Aで実行して結果を全部取得して返す // @PDOぜんしゅとく
    'type' => 'func',
    'josi' => [['を'],['で','の']],
    'fn' => function($sql, $a) {
      global $__v0;
      $pdo = $__v0['PDOオブジェクト'];
      $st = $pdo->prepare($sql);
      $st->execute($a);
      return $st->fetchAll(PDO::FETCH_ASSOC);
    },
  ],
  'PDO一行取得'=> [ // @SQLコマンドをデータ配列Aで実行して結果を一行取得して返す // @PDOいちぎょうしゅとく
    'type' => 'func',
    'josi' => [['を'],['で','の']],
    'fn' => function($sql, $a) {
      global $__v0;
      $pdo = $__v0['PDOオブジェクト'];
      $st = $pdo->prepare($sql);
      $st->execute($a);
      return $st->fetch(PDO::FETCH_ASSOC);
    },
  ],
  'PDO挿入ID取得'=> [ // @PDO実行の結果、挿入したIDを得る。 // @PDOそうにゅうIDしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      global $__v0;
      $pdo = $__v0['PDOオブジェクト'];
      return $pdo->lastInsertId();
    },
  ],
  // @HTML
  'PDOオブジェクト' => ['type'=>'const', 'value' => null], // @PDOおぶじぇくと
  'HTML変換'=> [ // @文字列SをHTMLに変換して返す // @HTMLへんかん
    'type' => 'func',
    'josi' => [['を','から']],
    'fn' => function($s) {
      return htmlspecialchars($s, ENT_QUOTES);
    },
  ],
  'HTML埋込'=> [ // @文字列Sの中に辞書型データDICの値を埋め込んで返す。書式は「xxx[[変数名]]xx」のように書く。展開時に安全にHTML変換する。変換したくないものには[[変数名|raw]]と書く。または[[変数名|書式]]を記述(書式はsprintfかdate/time)。// @HTMLうめこむ
    'type' => 'func',
    'josi' => [['に','へ'],['を']],
    'fn' => function($s, $dic) {
      $subject = $s;
      return preg_replace_callback('#\[\[(.*?)\]\]#', function($m)use($dic) {
        $key = $m[1];
        $raw = FALSE;
        $fmt = '';
        if (strpos($key, '|') !== FALSE) {
          if (preg_match('#\s*(.+?)\s*\|\s*([%a-zA-Z0-9_]+)#', $key, $m)) {
            $key = $m[1];
            if ($m[2] == 'raw') {
              $raw = TRUE;
            } else {
              $fmt = $m[2];
            }
          }
        }
        $val = isset($dic[$key]) ? $dic[$key] : '';
        if (!$raw) {
          if ($fmt == 'date') {
            $val = date('Y/m/d', intval($val));
          } else if ($fmt == 'time') {
            $val = date('H:i:s', intval($val));
          } else if ($fmt != '') {
            $val = sprintf($fmt, $val);
          }
          $val = htmlspecialchars($val, ENT_QUOTES);
        }
        return $val;
      }, $subject);
    },
  ],
];

// システム変数に必要な値を代入しておく
global $__v0;
$__v0['GET'] = isset($_GET) ? $_GET : [];
$__v0['POST'] = isset($_POST) ? $_POST : [];
$__v0['FILES'] = isset($_POST) ? $_FILES : [];
$__v0['SERVER'] = isset($_SERVER) ? $_SERVER : [];
if (isset($_SESSION)) {
  $__v0['SESSION'] = &$_SESSION;
} else {
  $__v0['SESSION'] = [];
}

