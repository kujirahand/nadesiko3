<?php
// 関数を定義した後に php2json.php を実行
// 関数の定義は $exports という名前の変数に代入する

global $nako3;
$exports = [
  // @ システム定数
  'ナデシコバージョン' => ['type'=>'const', 'value' => $nako3['version']], // @なでしこばーじょん
  'ナデシコエンジン'=>['type'=>'const', 'value'=>'nadesi.com/v3'], // @なでしこえんじん
  'ナデシコ種類'=>['type'=>'const', 'value'=>'phpnako'], // @なでしこしゅるい
  'はい'=>['type'=>'const', 'value'=>1], // @はい
  'いいえ'=>['type'=>'const', 'value'=>0], // @いいえ
  '真'=>['type'=>'const', 'value'=>1], // @しん
  '偽'=>['type'=>'const', 'value'=>0], // @ぎ
  '永遠'=>['type'=>'const', 'value'=>1], // @えいえん
  'オン'=>['type'=>'const', 'value'=>1], // @おん
  'オフ'=>['type'=>'const', 'value'=>0], // @おふ
  '改行'=>['type'=>'const', 'value'=>'\n'], // @かいぎょう
  'タブ'=>['type'=>'const', 'value'=>'\t'], // @たぶ
  'カッコ'=>['type'=>'const', 'value'=>'「'], // @かっこ
  'カッコ閉'=>['type'=>'const', 'value'=>'」'], // @かっことじ
  '波カッコ'=>['type'=>'const', 'value'=>'{'], // @なみかっこ
  '波カッコ閉'=>['type'=>'const', 'value'=>'}'], // @なみかっことじ
  'OK'=>['type'=>'const', 'value'=>true], // @OK
  'NG'=>['type'=>'const', 'value'=>false], // @NG
  'キャンセル'=>['type'=>'const', 'value'=>0], // @きゃんせる
  'PI'=>['type'=>'const', 'value'=>pi()], // @PI
  '空'=>['type'=>'const', 'value'=>''], // @から
  'NULL'=>['type'=>'const', 'value'=>null], // @NULL
  'undefined'=>['type'=>'const', 'value'=>null], // @undefined
  '未定義'=>['type'=>'const', 'value'=>null], // @みていぎ
  'エラーメッセージ'=>['type'=>'const', 'value'=>''], // @えらーめっせーじ
  '対象'=>['type'=>'const', 'value'=>''], // @たいしょう
  '対象キー'=>['type'=>'const', 'value'=>''], // @たいしょうきー
  '回数'=>['type'=>'const', 'value'=>''], // @かいすう
  'CR'=>['type'=>'const', 'value'=>'\r'], // @CR
  'LF'=>['type'=>'const', 'value'=>'\n'], // @LF
  '非数'=>['type'=>'const', 'value'=>null], // @ひすう
  '無限大'=>['type'=>'const', 'value'=>null], // @むげんだい
  '空配列'=> [ // @空の配列を返す。『[]』と同義。 // @からはいれつ
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      return [];
    },
  ],
  '空辞書'=> [ // @空の辞書型を返す。『{}』と同義。 // @からじしょ
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      return [];
    },
  ],
  '空ハッシュ'=> [ // @空のハッシュを返す(v3.2以降非推奨) // @からはっしゅ
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      return [];
    },
  ],
  '空オブジェクト'=> [ // @空のオブジェクトを返す(v3.2以降非推奨) // @からおぶじぇくと
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      return [];
    },
  ],
  // @ 標準出力
  '表示'=> [ // @Sを表示(末尾に改行を入れる) // @ひょうじ
    'type' => 'func',
    'josi' => [['を', 'と']],
    'fn' => function($s, $sys) {
      echo $s."\n";
    },
    'return_none' => true,
  ],
  '継続表示'=> [ // @Sを改行せずに表示 // @ひょうじ
    'type' => 'func',
    'josi' => [['を', 'と']],
    'fn' => function($s, $sys) {
      echo $s;
    },
    'return_none' => true,
  ],
  '表示ログ'=>['type'=>'const', 'value'=>''], // @ひょうじろぐ
  '表示ログクリア'=> [ // @表示ログを空にする // @ひょうじろぐくりあ
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      $__v0['表示ログ'] = '';
    },
    'return_none' => true,
  ],
  '言'=> [ // @Sを表示 // @いう
    'type' => 'func',
    'josi' => [['を', 'と']],
    'fn' => function($s, $sys) {
      echo $s."\n";
    },
    'return_none' => true,
  ],
  'コンソール表示'=> [ // @Sをコンソール表示する(console.log) // @こんそーるひょうじ
    'type' => 'func',
    'josi' => [['を', 'と']],
    'fn' => function($s, $sys) {
      echo $s."\n";
    },
    'return_none' => true,
  ],
  // @ 四則演算
  '足'=> [ // @AとBを足す // @たす
    'type' => 'func',
    'josi' => [['に', 'と'], ['を']],
    'fn' => function($a, $b) {
      if (is_string($b)) {
        return $a . $b;
      } else {
        return $a + $b;
      }
    },
  ],
  '引'=> [ // @AからBを引く // @ひく
    'type' => 'func',
    'josi' => [['から'], ['を']],
    'fn' => function($a, $b) {
      return $a + $b;
    },
  ],
  '掛'=> [ // @AにBを掛ける // @かける
    'type' => 'func',
    'josi' => [['に', 'と'], ['を']],
    'fn' => function($a, $b) {
      return $a * $b;
    },
  ],
  '倍'=> [ // @AのB倍を求める // @ばい
    'type' => 'func',
    'josi' => [['の'], ['']],
    'fn' => function($a, $b) {
      return $a * $b;
    },
  ],
  '割'=> [ // @AをBで割る // @わる
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($a, $b) {
      return $a / $b;
    },
  ],
  '割余'=> [ // @AをBで割った余りを求める // @わったあまり
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($a, $b) {
      return $a % $b;
    },
  ],
  '以上'=> [ // @AがB以上か // @いじょう
    'type' => 'func',
    'josi' => [['が'], ['']],
    'fn' => function($a, $b) {
      return $a >= $b;
    },
  ],
  '以下'=> [ // @AがB以下か // @いか
    'type' => 'func',
    'josi' => [['が'], ['']],
    'fn' => function($a, $b) {
      return $a <= $b;
    },
  ],
  '未満'=> [ // @AがB未満か // @みまん
    'type' => 'func',
    'josi' => [['が'], ['']],
    'fn' => function($a, $b) {
      return $a < $b;
    },
  ],
  '超'=> [ // @AがB超か // @ちょう
    'type' => 'func',
    'josi' => [['が'], ['']],
    'fn' => function($a, $b) {
      return $a > $b;
    },
  ],
  '等'=> [ // @AがBと等しいか // @ひとしい
    'type' => 'func',
    'josi' => [['が'], ['と']],
    'fn' => function($a, $b) {
      return $a === $b;
    },
  ],
  '等無'=> [ // @AがBと等しくないか // @ひとしくない
    'type' => 'func',
    'josi' => [['が'], ['と']],
    'fn' => function($a, $b) {
      return $a !== $b;
    },
  ],
  '一致'=> [ // @AがBと一致するか(配列や辞書も比較可能) // @いっち
    'type' => 'func',
    'josi' => [['が'], ['と']],
    'fn' => function($a, $b) {
      return json_encode($a) === json_encode($b);
    },
  ],
  '不一致'=> [ // @AがBと不一致か(配列や辞書も比較可能) // @ふいっち
    'type' => 'func',
    'josi' => [['が'], ['と']],
    'fn' => function($a, $b) {
      return json_encode($a) !== json_encode($b);
    },
  ],
  '範囲内'=> [ // @VがAからBの範囲内か // @はんいない
    'type' => 'func',
    'josi' => [['が'], ['から'], ['の']],
    'fn' => function($v, $a, $b) {
      return ($a <= $v) && ( $v <= $b);
    },
  ],
  '連続加算'=> [ // @A1+A2+A3...にBを足す // @れんぞくかさん
    'type' => 'func',
    'josi' => [['を'], ['に', 'と']],
    'fn' => function() {
      $cnt = func_num_args() - 1;
      $t = 0;
      for ($i = 0; $i < $cnt; $i++) {
        $t += func_get_args($i);
      }
      return $t;
    },
  ],
  // @ 敬語
  'ください'=> [ // @敬語対応のため // @ください
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      $sys['礼節レベル'] = isset($sys['礼節レベル']) ? $sys['礼節レベル']+1 : 1;
    },
    'return_none' => true,
  ],
  'お願'=> [ // @ソースコードを読む人を気持ちよくする // @おねがいします
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      $sys['礼節レベル'] = isset($sys['礼節レベル']) ? $sys['礼節レベル']+1 : 1;
    },
    'return_none' => true,
  ],
  'です'=> [ // @ソースコードを読む人を気持ちよくする // @です
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      $sys['礼節レベル'] = isset($sys['礼節レベル']) ? $sys['礼節レベル']+1 : 1;
    },
    'return_none' => true,
  ],
  '拝啓'=> [ // @ソースコードを読む人を気持ちよくする // @はいけい
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      $sys['礼節レベル'] = isset($sys['礼節レベル']) ? $sys['礼節レベル']+1 : 1;
    },
    'return_none' => true,
  ],
  '礼節レベル取得'=> [ // @(お遊び)敬語を何度使ったか返す // @おねがいします
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      return isset($sys['礼節レベル']) ? $sys['礼節レベル'] : 0;
    },
  ],
  // @ 特殊命令
  'JS実行'=> [ // @PHPのコードSRCを実行する(変数sysでなでしこシステムを参照できる) // @JSじっこう
    'type' => 'func',
    'josi' => [['を', 'で']],
    'fn' => function($src, $sys) {
      return eval($src);
    },
  ],
  'JSオブジェクト取得'=> [ // @なでしこで定義した関数や変数nameのPHPオブジェクトを取得する // @JSおぶじぇくとしゅとく
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($name, $sys) {
      foreach ($sys['__varslist'] as $vars) {
        if (isset($vars[$name])) return $vars[$name];
      }
      return null;
    },
  ],
  'JS関数実行'=> [ // @PHPの関数NAMEを引数ARGS(配列)で実行する // @JSかんすうしゅとく
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($name, $args, $sys) {
      if (function_exists($name)) {
        return call_user_func($name, $args);
      }
      return null;
    },
  ],
  'JSメソッド実行'=> [ // @JavaScriptのオブジェクトOBJのメソッドMを引数ARGS(配列)で実行する // @JSめそっどじっこう
    'type' => 'func',
    'josi' => [['の'], ['を'], ['で']],
    'fn' => function($obj, $m, $args, $sys) {
      if (method_exists($obj, $m)) {
        return $obj[$m]($args);
      }
      throw new Exception('メソッドを実行できません。');
    },
  ],
  'ナデシコ'=> [ // @なでしこのコードCODEを実行する // @なでしこする
    'type' => 'func',
    'josi' => [['を', 'で']],
    'fn' => function($code, $sys) {
      //todo: phpnako コマンドを実行する？
      throw new Exception('phpnakoの実行環境が必要です。');
    },
  ],
  'ナデシコ続'=> [ // @なでしこのコードCODEを実行する // @なでしこつづける
    'type' => 'func',
    'josi' => [['を', 'で']],
    'fn' => function($code, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '実行'=> [ // @ 無名関数（あるいは、文字列で関数名を指定）Fを実行する(Fが関数でなければ無視する) // @じっこう
    'type' => 'func',
    'josi' => [['を', 'に', 'で']],
    'fn' => function($f, $sys) {
      if (is_callable($f)) {
        return $f($sys);
      }
      return null;
    },
  ],
  '実行時間計測'=> [ // @ 関数Fを実行して要した時間をミリ秒で返す // @じっこうじかんけいそく
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($f, $sys) {
      $t = microtime(true);
      if (is_callable($f)) {
        $f($sys);
      }
      $iv = microtime(true) - $t;
      return $iv;
    },
  ],
  // @ 型変換
  '変数型確認'=> [ // @変数Vの型を返す // @へんすうかたかくにん
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return gettype($v);
    },
  ],
  'TYPEOF'=> [ // @変数Vの型を返す // @TYPEOF
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return gettype($v);
    },
  ],
  '文字列変換'=> [ // @値Vを文字列に変換 // @もじれつへんかん
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return ''.$v;
    },
  ],
  'TOSTR'=> [ // @値Vを文字列に変換 // @TOSTR
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return ''.$v;
    },
  ],
  '整数変換'=> [ // @値Vを整数に変換 // @せいすうへんかん
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return intval($v);
    },
  ],
  'TOINT'=> [ // @値Vを整数に変換 // @TOINT
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return intval($v);
    },
  ],
  '実数変換'=> [ // @値Vを実数に変換 // @じっすうへんかん
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return floatval($v);
    },
  ],
  'TOFLOAT'=> [ // @値Vを実数に変換 // @TOFLOAT
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return floatval($v);
    },
  ],
  'INT'=> [ // @値Vを整数に変換 // @INT
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return intval($v);
    },
  ],
  'FLOAT'=> [ // @値Vを実数に変換 // @FLOAT
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return floatval($v);
    },
  ],
  'NAN判定'=> [ // @値VがNaNかどうかを判定 // @NANはんてい
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($v) {
      return is_nan($v);
    },
  ],
  'HEX'=> [ // @値Vを16進数に変換 // @HEX
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      return sprintf('%x', $a);
    },
  ],
  'RGB'=> [ // @HTML用のカラーコードを返すRGB(R,G,B)で各値は0-255 // @RGB
    'type' => 'func',
    'josi' => [['と'], ['の'], ['で']],
    'fn' => function($r, $g, $b) {
      return sprintf('#%02X%02X%02X', $r & 0xFF, $g & 0xFF, $b & 0xFF);
    },
  ],
  // @ 論理演算
  '論理OR'=> [ // @(ビット演算で)AとBの論理和を返す(v1非互換)。 // @ろんりOR
    'type' => 'func',
    'josi' => [['と'], ['の']],
    'fn' => function($a, $b) {
      return $a || $b;
    },
  ],
  '論理AND'=> [ // @(ビット演算で)AとBの論理積を返す(v1非互換)。日本語の「AかつB」に相当する // @ろんりAND
    'type' => 'func',
    'josi' => [['と'], ['の']],
    'fn' => function($a, $b) {
      return $a && $b;
    },
  ],
  '論理NOT'=> [ // @値Vが0ならば1、それ以外ならば0を返す(v1非互換) // @ろんりNOT
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return ($v) ? 0 : 1;
    },
  ],
  // @ ビット演算
  'OR'=> [ // @(ビット演算で)AとBの論理和を返す。 // @OR
    'type' => 'func',
    'josi' => [['と'], ['の']],
    'fn' => function($a, $b) {
      return $a | $b;
    },
  ],
  'AND'=> [ // @(ビット演算で)AとBの論理積を返す。日本語の「AかつB」に相当する // @AND
    'type' => 'func',
    'josi' => [['と'], ['の']],
    'fn' => function($a, $b) {
      return $a & $b;
    },
  ],
  'XOR'=> [ // @(ビット演算で)AとBの排他的論理和を返す。// @XOR
    'type' => 'func',
    'josi' => [['と'], ['の']],
    'fn' => function($a, $b) {
      return $a ^ $b;
    },
  ],
  'NOT'=> [ // @(ビット演算で)vの各ビットを反転して返す。// @NOT
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return ~$v;
    },
  ],
  'SHIFT_L'=> [ // @VをAビット左へシフトして返す // @SHIFT_L
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($a, $b) {
      return $a << $b;
    },
  ],
  'SHIFT_R'=> [ // @VをAビット右へシフトして返す(符号を維持する) // @SHIFT_R
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($a, $b) {
      return $a >> $b;
    },
  ],
  'SHIFT_UR'=> [ // @VをAビット右へシフトして返す(符号を維持しない、0で埋める) // @SHIFT_UR
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($a, $b) {
      return $a >> $b;
    },
  ],
  // @ 文字列処理
  '文字数'=> [ // @文字列Vの文字数を返す // @もじすう
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return mb_strlen($v);
    },
  ],
  '何文字目'=> [ // @文字列SでAが何文字目にあるか調べて返す // @なんもじめ
    'type' => 'func',
    'josi' => [['で', 'の'], ['が']],
    'fn' => function($s, $a) {
      $r = mb_strpos($s, $a);
      if ($r === FALSE) { return 0; }
      return ($r + 1);
    },
  ],
  'CHR'=> [ // @文字コードから文字を返す // @CHR
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return mb_chr($v);
    },
  ],
  'ASC'=> [ // @文字列Vの最初の文字の文字コードを返す // @ASC
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($v) {
      return mb_ord($v);
    },
  ],
  '文字挿入'=> [ // @文字列SのI文字目に文字列Aを挿入する // @もじそうにゅう
    'type' => 'func',
    'josi' => [['で', 'の'], ['に', 'へ'], ['を']],
    'fn' => function($s, $i, $a) {
      return mb_substr($s, 0, $i-1).$a.mb_substr($s, $i);
    },
  ],
  '文字検索'=> [ // @文字列Sで文字列A文字目からBを検索。見つからなければ0を返す。(類似命令に『何文字目』がある)(v1非互換) // @もじけんさく
    'type' => 'func',
    'josi' => [['で', 'の'], ['から'], ['を']],
    'fn' => function($s, $a, $b) {
      $sub = mb_substr($s, $a-1);
      $r = mb_strpos($s, $b, $a-1);
      if ($r === FALSE) { return 0; }
      return $r + 1;
    },
  ],
  '追加'=> [ // @文字列SにAを追加して返す(v1非互換) // @ついか
    'type' => 'func',
    'josi' => [['で', 'に', 'へ'], ['を']],
    'fn' => function($s, $a) {
      return $s . $a;
    },
  ],
  '一行追加'=> [ // @文字列SにAと改行を追加して返す(v1非互換) // @いちぎょうついか
    'type' => 'func',
    'josi' => [['で', 'に', 'へ'], ['を']],
    'fn' => function($s, $a) {
      return $s . $a . "\n";
    },
  ],
  '文字列分解'=> [ // @文字列Vを一文字ずつに分解して返す // @もじれつぶんかい
    'type' => 'func',
    'josi' => [['を', 'の', 'で']],
    'fn' => function($v) {
      return preg_split("//u", $v);
    },
  ],
  'リフレイン'=> [ // @文字列VをCNT回繰り返す(v1非互換) // @りふれいん
    'type' => 'func',
    'josi' => [['を', 'の'], ['で']],
    'fn' => function($v, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '出現回数'=> [ // @文字列SにAが何回出現するか数える // @しゅつげんかいすう
    'type' => 'func',
    'josi' => [['で'], ['の']],
    'fn' => function($s, $a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'MID'=> [ // @文字列SのA文字目からCNT文字を抽出する // @MID
    'type' => 'func',
    'josi' => [['で', 'の'], ['から'], ['を']],
    'fn' => function($s, $a, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '文字抜出'=> [ // @文字列SのA文字目からCNT文字を抽出する // @もじぬきだす
    'type' => 'func',
    'josi' => [['で', 'の'], ['から'], ['を', '']],
    'fn' => function($s, $a, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'LEFT'=> [ // @文字列Sの左端からCNT文字を抽出する // @LEFT
    'type' => 'func',
    'josi' => [['の', 'で'], ['だけ']],
    'fn' => function($s, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '文字左部分'=> [ // @文字列Sの左端からCNT文字を抽出する // @もじひだりぶぶん
    'type' => 'func',
    'josi' => [['の', 'で'], ['だけ', '']],
    'fn' => function($s, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'RIGHT'=> [ // @文字列Sの右端からCNT文字を抽出する // @RIGHT
    'type' => 'func',
    'josi' => [['の', 'で'], ['だけ']],
    'fn' => function($s, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '文字右部分'=> [ // @文字列Sの右端からCNT文字を抽出する // @もじみぎぶぶん
    'type' => 'func',
    'josi' => [['の', 'で'], ['だけ', '']],
    'fn' => function($s, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '区切'=> [ // @文字列Sを区切り文字Aで区切って配列で返す // @くぎる
    'type' => 'func',
    'josi' => [['の', 'を'], ['で']],
    'fn' => function($s, $a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '切取'=> [ // @文字列Sから文字列Aまでの部分を抽出する(v1非互換) // @きりとる
    'type' => 'func',
    'josi' => [['から', 'の'], ['まで', 'を']],
    'fn' => function($s, $a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '文字削除'=> [ // @文字列SのA文字目からB文字分を削除して返す // @もじさくじょ
    'type' => 'func',
    'josi' => [['の'], ['から'], ['だけ', 'を', '']],
    'fn' => function($s, $a, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 置換・トリム
  '置換'=> [ // @文字列Sのうち文字列AをBに全部置換して返す // @ちかん
    'type' => 'func',
    'josi' => [['の', 'で'], ['を', 'から'], ['に', 'へ']],
    'fn' => function($s, $a, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '単置換'=> [ // @文字列Sのうち、最初に出現するAだけをBに置換して返す // @たんちかん
    'type' => 'func',
    'josi' => [['の', 'で'], ['を'], ['に', 'へ']],
    'fn' => function($s, $a, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'トリム'=> [ // @文字列Sの前後にある空白を削除する // @とりむ
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '空白除去'=> [ // @文字列Sの前後にある空白を削除する // @くうはくじょきょ
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 文字変換
  '大文字変換'=> [ // @アルファベットの文字列Sを大文字に変換 // @おおもじへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '小文字変換'=> [ // @アルファベットの文字列Sを小文字に変換 // @こもじへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '平仮名変換'=> [ // @文字列Sのカタカナをひらがなに変換 // @ひらがなへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'カタカナ変換'=> [ // @文字列Sのひらがなをカタカナに変換 // @かたかなへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '英数全角変換'=> [ // @文字列Sの半角英数文字を全角に変換 // @えいすうぜんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '英数半角変換'=> [ // @文字列Sの全角英数文字を半角に変換 // @えいすうはんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '英数記号全角変換'=> [ // @文字列Sの半角英数記号文字を全角に変換 // @えいすうきごうぜんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '英数記号半角変換'=> [ // @文字列Sの記号文字を半角に変換 // @えいすうきごうはんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'カタカナ全角変換'=> [ // @文字列Sの半角カタカナを全角に変換 // @かたかなぜんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'カタカナ半角変換'=> [ // @文字列Sの全角カタカナを半角に変換 // @かたかなはんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '全角変換'=> [ // @文字列Sの半角文字を全角に変換 // @ぜんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '半角変換'=> [ // @文字列Sの全角文字を半角に変換 // @はんかくへんかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($s, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '全角カナ一覧'=>['type'=>'const', 'value'=>'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンァィゥェォャュョッ、。ー「」'], // @ぜんかくかないちらん
  '全角カナ濁音一覧'=>['type'=>'const', 'value'=>'ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ'], // @ぜんかくかなだくおんいちらん
  '半角カナ一覧'=>['type'=>'const', 'value'=>'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝｧｨｩｪｫｬｭｮｯ､｡ｰ｢｣ﾞﾟ'], // @はんかくかないちらん
  '半角カナ濁音一覧'=>['type'=>'const', 'value'=>'ｶﾞｷﾞｸﾞｹﾞｺﾞｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ'], // @はんかくかなだくおんいちらん
  // @ JSON
  'JSONエンコード'=> [ // @オブジェクトVをJSON形式にエンコードして返す // @JSONえんこーど
    'type' => 'func',
    'josi' => [['を', 'の']],
    'fn' => function($v) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'JSONエンコード整形'=> [ // @オブジェクトVをJSON形式にエンコードして整形して返す // @JSONえんこーどせいけい
    'type' => 'func',
    'josi' => [['を', 'の']],
    'fn' => function($v) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'JSONデコード'=> [ // @JSON文字列Sをオブジェクトにデコードして返す // @JSONでこーど
    'type' => 'func',
    'josi' => [['を', 'の', 'から']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 正規表現
  '正規表現マッチ'=> [ // @文字列Aを正規表現パターンBでマッチして結果を返す(パターンBは「/pat/opt」の形式で指定。optにgの指定がなければ部分マッチが『抽出文字列』に入る) // @せいきひょうげんまっち
    'type' => 'func',
    'josi' => [['を', 'が'], ['で', 'に']],
    'fn' => function($a, $b, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '抽出文字列'=>['type'=>'const', 'value'=>[]], // @ちゅうしゅつもじれつ
  '正規表現置換'=> [ // @文字列Sの正規表現パターンAをBに置換して結果を返す(パターンAは/pat/optで指定) // @せいきひょうげんちかん
    'type' => 'func',
    'josi' => [['の'], ['を', 'から'], ['で', 'に', 'へ']],
    'fn' => function($s, $a, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '正規表現区切'=> [ // @文字列Sを正規表現パターンAで区切って配列で返す(パターンAは/pat/optで指定) // @せいきひょうげんくぎる
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($s, $a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 指定形式
  '通貨形式'=> [ // @数値Vを三桁ごとにカンマで区切る // @つうかけいしき
    'type' => 'func',
    'josi' => [['を', 'の']],
    'fn' => function($v) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'ゼロ埋'=> [ // @数値VをA桁の0で埋める // @ぜろうめ
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($v, $a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '空白埋'=> [ // @文字列VをA桁の空白で埋める // @くうはくうめ
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($v, $a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 文字種類
  'かなか判定'=> [ // @文字列Sの1文字目がひらがなか判定 // @かなかはんてい
    'type' => 'func',
    'josi' => [['を', 'の', 'が']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'カタカナ判定'=> [ // @文字列Sの1文字目がカタカナか判定 // @かたかなかはんてい
    'type' => 'func',
    'josi' => [['を', 'の', 'が']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '数字判定'=> [ // @文字列Sの1文字目が数字か判定 // @すうじかはんてい
    'type' => 'func',
    'josi' => [['を', 'が']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '数列判定'=> [ // @文字列S全部が数字か判定 // @すうれつかはんてい
    'type' => 'func',
    'josi' => [['を', 'が']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 配列操作
  '配列結合'=> [ // @配列Aを文字列Sでつなげて文字列で返す // @はいれつけつごう
    'type' => 'func',
    'josi' => [['を'], ['で']],
    'fn' => function($a, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列検索'=> [ // @配列Aから文字列Sを探してインデックス番号(0起点)を返す。見つからなければ-1を返す。 // @はいれつけんさく
    'type' => 'func',
    'josi' => [['の', 'から'], ['を']],
    'fn' => function($a, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列要素数'=> [ // @配列Aの要素数を返す // @はいれつようそすう
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '要素数'=> [ // @配列Aの要素数を返す // @ようそすう
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列挿入'=> [ // @配列AのI番目(0起点)に要素Sを追加して返す(v1非互換) // @はいれつそうにゅう
    'type' => 'func',
    'josi' => [['の'], ['に', 'へ'], ['を']],
    'fn' => function($a, $i, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列一括挿入'=> [ // @配列AのI番目(0起点)に配列bを追加して返す(v1非互換) // @はいれついっかつそうにゅう
    'type' => 'func',
    'josi' => [['の'], ['に', 'へ'], ['を']],
    'fn' => function($a, $i, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列ソート'=> [ // @配列Aをソートして返す(A自体を変更) // @はいれつそーと
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列数値ソート'=> [ // @配列Aをソートして返す(A自体を変更) // @はいれつすうちそーと
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列カスタムソート'=> [ // @関数Fで配列Aをソートして返す(引数A自体を変更) // @はいれつかすたむそーと
    'type' => 'func',
    'josi' => [['で'], ['の', 'を']],
    'fn' => function($f, $a, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列逆順'=> [ // @配列Aを逆にして返す。Aを書き換える(A自体を変更)。 // @はいれつぎゃくじゅん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列シャッフル'=> [ // @配列Aをシャッフルして返す。Aを書き換える // @はいれつしゃっふる
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列削除'=> [ // @配列AのI番目(0起点)の要素を削除して返す。Aの内容を書き換える。辞書型変数ならキーIを削除する。 // @はいれつさくじょ
    'type' => 'func',
    'josi' => [['の', 'から'], ['を']],
    'fn' => function($a, $i, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列切取'=> [ // @配列AのI番目(0起点)の要素を切り取って返す。Aの内容を書き換える。辞書型変数ならキーIを削除する。 // @はいれつきりとる
    'type' => 'func',
    'josi' => [['の', 'から'], ['を']],
    'fn' => function($a, $i) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列取出'=> [ // @配列AのI番目(0起点)からCNT個の要素を取り出して返す。Aの内容を書き換える // @はいれつとりだし
    'type' => 'func',
    'josi' => [['の'], ['から'], ['を']],
    'fn' => function($a, $i, $cnt) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列ポップ'=> [ // @配列Aの末尾を取り出して返す。Aの内容を書き換える。 // @はいれつぽっぷ
    'type' => 'func',
    'josi' => [['の', 'から']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列追加'=> [ // @配列Aの末尾にBを追加して返す。Aの内容を書き換える。 // @はいれつついか
    'type' => 'func',
    'josi' => [['に', 'へ'], ['を']],
    'fn' => function($a, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列複製'=> [ // @配列Aを複製して返す。 // @はいれつふくせい
    'type' => 'func',
    'josi' => [['を']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列足'=> [ // @配列Aに配列Bを足し合わせて返す。 // @はいれつたす
    'type' => 'func',
    'josi' => [['に', 'へ', 'と'],['を']],
    'fn' => function($a, $b) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列最大値'=> [ // @配列Aの値の最大値を調べて返す。 // @はいれつさいだいち
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列最小値'=> [ // @配列Aの値の最小値を調べて返す。 // @はいれつさいしょうち
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '配列合計'=> [ // @配列Aの値を全て足して返す。配列の各要素を数値に変換して計算する。数値に変換できない文字列は0になる。 // @はいれつごうけい
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 二次元配列処理
  '表ソート'=> [ // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに文字列順にソートする。Aの内容を書き換える。 // @ひょうそーと
    'type' => 'func',
    'josi' => [['の'], ['を']],
    'fn' => function($a, $no) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 二次元配列処理
  '表数値ソート'=> [ // @二次元配列AでB列目(0起点)(あるいはキー名)をキーに数値順にソートする。Aの内容を書き換える。 // @ひょうすうちそーと
    'type' => 'func',
    'josi' => [['の'], ['を']],
    'fn' => function($a, $no) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表ピックアップ'=> [ // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sを含む行を返す // @ひょうぴっくあっぷ
    'type' => 'func',
    'josi' => [['の'],['から'],['を','で']],
    'fn' => function($a, $no, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表完全一致ピックアップ'=> [ // @配列Aの列番号B(0起点)(あるいはキー名)で検索文字列Sと一致する行を返す // @ひょうぴっくあっぷ
    'type' => 'func',
    'josi' => [['の'],['から'],['を','で']],
    'fn' => function($a, $no, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表検索'=> [ // @二次元配列AでCOL列目(0起点)からキーSを含む行をROW行目から検索して何行目にあるか返す。見つからなければ-1を返す。 // @ひょうけんさく
    'type' => 'func',
    'josi' => [['の'],['で','に'],['から'],['を']],
    'fn' => function($a, $col, $row, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表列数'=> [ // @二次元配列Aの列数を調べて返す。 // @ひょうれつすう
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表行数'=> [ // @二次元配列Aの行数を調べて返す。 // @ひょうぎょうすう
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表行列交換'=> [ // @二次元配列Aの行と列を交換して返す。 // @ひょうぎょうれつこうかん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($a, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表右回転'=> [ // @二次元配列Aを90度回転して返す。 // @ひょうみぎかいてん
    'type' => 'func',
    'josi' => [['の', 'を']],
    'fn' => function($a, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表重複削除'=> [ // @二次元配列AのI列目にある重複項目を削除して返す。 // @ひょうじゅうふくさくじょ
    'type' => 'func',
    'josi' => [['の'],['を','で']],
    'fn' => function($a, $i, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表列取得'=> [ // @二次元配列AのI列目を返す。 // @ひょうれつしゅとく
    'type' => 'func',
    'josi' => [['の'],['を']],
    'fn' => function($a, $i, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表列挿入'=> [ // @二次元配列Aの(0から数えて)I列目に配列Sを挿入して返す // @ひょうれつそうにゅう
    'type' => 'func',
    'josi' => [['の'],['に','へ'],['を']],
    'fn' => function($a, $i, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表列削除'=> [ // @二次元配列Aの(0から数えて)I列目削除して返す // @ひょうれつそうにゅう
    'type' => 'func',
    'josi' => [['の'],['を']],
    'fn' => function($a, $i) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表列合計'=> [ // @二次元配列Aの(0から数えて)I列目を合計して返す。 // @ひょうれつごうけい
    'type' => 'func',
    'josi' => [['の'],['を','で']],
    'fn' => function($a, $i) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表曖昧検索'=> [ // @二次元配列AのROW行目からCOL列目(0起点)で正規表現Sにマッチする行を検索して何行目にあるか返す。見つからなければ-1を返す。(v1非互換) // @ひょうれつあいまいけんさく
    'type' => 'func',
    'josi' => [['の'],['から'],['で'],['を']],
    'fn' => function($a, $row, $col, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '表正規表現ピックアップ'=> [ // @二次元配列AでI列目(0起点)から正規表現パターンSにマッチする行をピックアップして返す。 // @ひょうせいきひょうげんぴっくあっぷ
    'type' => 'func',
    'josi' => [['の','で'],['から'],['を']],
    'fn' => function($a, $col, $s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ 辞書型変数の操作
  '辞書キー列挙'=> [ // @辞書型変数Aのキーの一覧を配列で返す。 // @じしょきーれっきょ
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '辞書キー削除'=> [ // @辞書型変数AからキーKEYを削除して返す（A自体を変更する）。 // @じしょきーさくじょ
    'type' => 'func',
    'josi' => [['から', 'の'], ['を']],
    'fn' => function($a, $key) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '辞書キー存在'=> [ // @辞書型変数AのキーKEYが存在するか確認 // @じしょきーそんざい
    'type' => 'func',
    'josi' => [['の','に'],['が']],
    'fn' => function($a, $key) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ ハッシュ
  'ハッシュキー列挙'=> [ // @ハッシュAのキー一覧を配列で返す。 // @はっしゅきーれっきょ
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'ハッシュ内容列挙'=> [ // @ハッシュAの内容一覧を配列で返す。 // @はっしゅないようれっきょ
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($a) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'ハッシュキー削除'=> [ // @ハッシュAからキーKEYを削除して返す。 // @はっしゅきーさくじょ
    'type' => 'func',
    'josi' => [['から', 'の'], ['を']],
    'fn' => function($a, $key, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'ハッシュキー存在'=> [ // @ハッシュAのキーKEYが存在するか確認 // @はっしゅきーそんざい
    'type' => 'func',
    'josi' => [['の','に'],['が']],
    'fn' => function($a, $key) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ タイマー
  '秒待機'=> [ // @ 「!非同期モード」または「逐次実行構文」にて、N秒の間待機する // @びょうたいき
    'type' => 'func',
    'josi' => [['']],
    'fn' => function($n, $sys) {
      throw new Exception('未実装のメソッドです');
    },
    'return_none' => true,
  ],
  '秒逐次待機'=> [ // @ 逐次実行構文にて、N秒の間待機する // @びょうちくじたいき
    'type' => 'func',
    'josi' => [['']],
    'fn' => function($n, $sys) {
      throw new Exception('未実装のメソッドです');
    },
    'return_none' => true,
  ],
  '秒後'=> [ // @無名関数（あるいは、文字列で関数名を指定）FをN秒後に実行する。変数『対象』にタイマーIDを代入する。 // @びょうご
    'type' => 'func',
    'josi' => [['を'], ['']],
    'fn' => function($f, $n, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '秒毎'=> [ // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『タイマー停止』で停止できる)。変数『対象』にタイマーIDを代入する。 // @びょうごと
    'type' => 'func',
    'josi' => [['を'], ['']],
    'fn' => function($f, $n, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '秒タイマー開始時'=> [ // @無名関数（あるいは、文字列で関数名を指定）FをN秒ごとに実行する(『秒毎』と同じ) // @びょうたいまーかいししたとき
    'type' => 'func',
    'josi' => [['を'], ['']],
    'fn' => function($f, $n, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'タイマー停止'=> [ // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを停止する // @たいまーていし
    'type' => 'func',
    'josi' => [['の', 'で']],
    'fn' => function($timerId, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '全タイマー停止'=> [ // @『秒毎』『秒後』や『秒タイマー開始』で開始したタイマーを全部停止する // @ぜんたいまーていし
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      throw new Exception('未実装のメソッドです');
    },
    'return_none' => true,
  ],
  // @ 日時処理(簡易)
  '今'=> [ // @現在時刻を「HH:mm:ss」の形式で返す // @いま
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'システム時間'=> [ // @現在のUNIX時間 (UTC(1970/1/1)からの経過秒数) を返す // @しすてむじかん
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '今日'=> [ // @今日の日付を「YYYY/MM/DD」の形式で返す // @きょう
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '曜日番号取得'=> [ // @Sに指定した日付の曜日番号をで返す。不正な日付の場合は今日の曜日番号を返す。(0=日/1=月/2=火/3=水/4=木/5=金/6=土) // @ようびばんごうしゅとく
    'type' => 'func',
    'josi' => [['の']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '時間ミリ秒取得'=> [ // @ミリ秒単位の時間を数値で返す。結果は実装に依存する。 // @じかんみりびょうしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ デバッグ支援
  'エラー発生'=> [ // @故意にエラーSを発生させる // @えらーはっせい
    'type' => 'func',
    'josi' => [['の', 'で']],
    'fn' => function($s) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'システム関数一覧取得'=> [ // @システム関数の一覧を取得 // @しすてむかんすういちらんしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'システム関数存在'=> [ // @文字列で関数名を指定してシステム関数が存在するかを調べる // @しすてむかんすうそんざい
    'type' => 'func',
    'josi' => [['が', 'の']],
    'fn' => function($fname, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'プラグイン一覧取得'=> [ // @利用中のプラグイン一覧を得る // @ぷらぐいんいちらんしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'モジュール一覧取得'=> [ // @取り込んだモジュール一覧を得る // @もじゅーるいちらんしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function($sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '助詞一覧取得'=> [ // @文法として定義されている助詞の一覧を取得する // @じょしいちらんしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      throw new Exception('未実装のメソッドです');
    },
  ],
  '予約語一覧取得'=> [ // @文法として定義されている予約語の一覧を取得する // @よやくごいちらんしゅとく
    'type' => 'func',
    'josi' => [],
    'fn' => function() {
      throw new Exception('未実装のメソッドです');
    },
  ],
  // @ プラグイン管理
  'プラグイン名'=>['type'=>'const', 'value'=>'メイン'], // @ぷらぐいんめい
  'プラグイン名設定'=> [ // @プラグイン名をSに変更する // @プラグインめいせってい
    'type' => 'func',
    'josi' => [['に','へ']],
    'fn' => function($s, $sys) {
      throw new Exception('未実装のメソッドです');
    },
    'return_none' => true,
  ],
  // @ URLエンコードとパラメータ
  'URLエンコード'=> [ // @URLエンコードして返す // @URLえんこーど
    'type' => 'func',
    'josi' => [['を', 'から']],
    'fn' => function($text) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'URLデコード'=> [ // @URLデコードして返す // @URLでこーど
    'type' => 'func',
    'josi' => [['を', 'へ', 'に']],
    'fn' => function($text) {
      throw new Exception('未実装のメソッドです');
    },
  ],
  'URLパラメータ解析'=> [ // @URLパラメータを解析してハッシュで返す // @URLぱらめーたかいせき
    'type' => 'func',
    'josi' => [['を', 'の', 'から']],
    'fn' => function($url, $sys) {
      throw new Exception('未実装のメソッドです');
    },
  ],
];
