{
// ------------------------------------------------
//   なでしこの文法をPEGで定義したもの
// -- https://pegjs.org/online を利用して編集すると良い感じ
// ------------------------------------------------
function convToHalfS(s) {
  return s.replace(/[Ａ-Ｚａ-ｚ０-９＿]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 65248);
  });
}
// ------------------------------------------------
}

start = sentence+

sentence 
  =  comment
  / indent { return {"type":"EOS","memo":"indent"}; }
  / EOS+ { return {"type":"EOS"}; }
  / if_stmt / whie_stmt / repeat_times_stmt / for_stmt
  / func_call / let_stmt

sentence2 = !block_end s:sentence { return s; }
block = s:sentence2* { return s; }
block_end = "ここまで" /　"ーーー" / else
else = "違えば"

for_stmt
  = i:word "を" __ kara:calc "から" __ made:calc "まで" __ ("繰り返す" / "繰り返し") LF b:block block_end {
    return {"type":"for", "from":kara, "to":made, "block":b, "word": i};
  }

repeat_times_stmt
  = cnt:(int / intz) "回" __ b:sentence EOS {
    return {"type":"repeat_times", "value":cnt, "block": b};
  }
  / cnt:(int / intz) "回" __ LF b:block block_end {
    return {"type":"repeat_times", "value":cnt, "block": b};
  }
  / parenL cnt:calc parenR  "回" __ LF b:block block_end {
    return {"type":"repeat_times", "value":cnt, "block": b};
  }

whie_stmt
  = parenL expr:calc parenR  "の間" LF b:block block_end {
    return {"type":"while", "cond":expr, "block":b};
  }

if_stmt
  = "もし" __ expr:calc __ josi_naraba __ LF __ tb:block
      __ else __ LF __ fb:block block_end {
    return {"type":"if", "expr":expr, "block":tb, "false_block":fb };
  }
  / "もし" __ expr:calc __ josi_naraba __ LF __ tb:block block_end {
    return {"type":"if", "expr":expr, "block":tb, "false_block":[] };
  }
  // ブロックなしの「もし」文の時
  / "もし" __ expr:calc __ josi_naraba true_node:sentence EOS else false_node:sentence EOS  {
    return {"type":"if", "expr":expr, "block":true_node, "false_block":false_node };
  }
  / "もし" __ expr:calc __ josi_naraba true_node:sentence EOS {
    return {"type":"if", "expr":expr, "block":true_node, false_block:[] };
  }

func_arg = v:calc j:josi { return {"type":"arg", "value":v, "josi":j} }
func_call
  = args:func_arg* name:word EOS {
    return {type:"func", "args":args, "name":name};
  }

let_stmt
  = name:word ("=" / "＝") value:calc EOS { return {"type":"let", "name":name, "value":value}; }
  / word josi_eq calc EOS { return {"type":"let", "name":name, "value":value}; }

// コメント関連
__ = (whitespace / range_comment)*
LF = "\n" { return {type:"EOS"}; }
EOS = __ n:(";" / LF / "。" / josi_continue) { return {type:"EOS"}; }
whitespace = [ \t\r、　]
indent = [ 　\t・]+
range_comment = "/*" s:$(!"*/" .)* "*/" { return s; }
line_comment = "//" s:$[^\n]* "\n" { return s; }
sharp_comment = "#" s:$[^\n]* "\n" { return s; }
comment
  = n:(range_comment / line_comment / sharp_comment) { 
    return {type:"comment",value:n};
  }

// 数字関連
number = f:"-"? v:(hex / float / int / intz) { if (f==="-") { v *= -1; } return {"type":"number","value":v }; }
hex = "0x" x:$([0-9a-z]i+) { return parseInt("0x" + x, 16); }
float = d1:$([0-9]+) "." d2:$([0-9]+) { return parseFloat( d1 + "." + d2 ); }
int = n:$([0-9]+) { return parseInt(n, 10); }
intz = n:$([０-９]+) { return parseInt(convToHalfS(n), 10); }
// 文字列関連
qqchar = c:$([^"]) { return c; }
qchar  = c:$([^']) { return c; }
qz1char = c:$([^」]) { return c; }
qz2char = c:$([^』]) { return c; }
rawstring = '"' chars:qqchar*  '"' { return chars.join(""); }
       / "'" chars:qchar*   "'" { return chars.join(""); }
       / "「" chars:qz1char* "」" { return chars.join(""); }
       / "『" chars:qz2char* "』" { return chars.join(""); }
string = s:rawstring { return {type:"string", value:s}; }

// 助詞関連
josi = josi_arg / josi_eq
josi_eq = "は"
josi_continue =  "して"
josi_arg = 
  josi_name:("について" / "ならば" / "なら" /
  "とは" / "から" / "まで" /
  "を" / "に" / "へ" / "で" / "と" / "が") {
    return josi_name;
  }
josi_naraba = "ならば"
josi_word_split = josi_eq / josi_arg / josi_continue / josi_naraba

// word
kanji    = [\u4E00-\u9FCF]
hiragana = [ぁ-ん]
katakana = [ァ-ヶ]
alphabet = [_a-zA-Z]
alphaz = [ａ-ｚＡ-Ｚ＿]
wordchar = w:(kanji / hiragana / katakana / alphabet / alphaz) { return w; }
word "単語" = chars:$((!josi_word_split wordchar)+) { return { type:"variable", value:convToHalfS(chars) }; }

// memo
alphachars = a:$(alphabet / alphaz)+ b:$([0-9a-zA-Z_０-９ａ-ｚＡ-Ｚ＿])* { return convToHalfS(a + b ? b : ""); }

// for value
value
  = number 
  / s:string
  / w:word

// calc
calc = and_or

and_or
  = left:comp __ "||" __ right:comp {
    return { type:"calc", operator:"||", "left":left, "right":right };
  }
  / left:comp __ "&&" __ right:comp {
    return { type:"calc", operator:"&&", "left":left, "right":right };
  }
  / comp

comp
  = left:addsub __ ("<" / "＜") __ right:addsub {
     return { type:"calc", operator: "<", "left": left,  "right": right };
  }
  / left:addsub __ ("<=" / "＜＝" / "≦") __ right:addsub {
     return { type:"calc", operator: "<=", "left": left,  "right": right };
  }
  / left:addsub __ (">" / "＞") __ right:addsub {
     return { type:"calc", operator: ">", "left": left,  "right": right };
  }
  / left:addsub __ (">=" / "＞＝" / "≧") __ right:addsub {
     return { type:"calc", operator: ">=", "left": left,  "right": right };
  }
  / left:addsub __ ("==" / "=" / "＝") __ right:addsub {
     return { type:"calc", operator: "==", "left": left,  "right": right };
  }
  / left:addsub __ ("!=" / "！＝" / "<>" / "＜＞" / "≠") __ right:addsub {
     return { type:"calc", operator: "!=", "left": left,  "right": right };
  }
  / addsub
addsub
   = left:muldiv __ ("+" / "＋") __ right:addsub {
     return { type:"calc", operator: "+", "left": left,  "right": right };
   }
   / left:muldiv __ ("-" / "−") __ right: addsub {
     return { type:"calc", operator: "-", "left": left,  "right": right };
   }
   / left:muldiv __ ("&" / "＆") __ right: addsub {
     return { type:"calc", operator: "&", "left": left,  "right": right };
   }
   / muldiv
muldiv
  = left:primary __ ("*" / "＊" / "×") __ right:muldiv {
     return { type:"calc", operator: "*", "left": left,  "right": right };
   }
  / left:primary __ ("/" / "／" / "÷") __ right:muldiv {
     return { type:"calc", operator: "/", "left": left,  "right": right };
   }
  / left:primary __ ("%" / "％") __ right:muldiv {
     return { type:"calc", operator: "/", "left": left,  "right": right };
   }
   / primary
 primary
   = parenL calc:calc parenR { return calc; } 
   / v:value { return v; }

parenL = "(" / "（"
parenR = ")" / "）"
