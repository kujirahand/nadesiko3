{
// ------------------------------------------------
//   なでしこの文法をPEGで定義したもの
// ------------------------------------------------
}

start = sentence+

sentence 
  =  comment
  / indent { return {"type":"EOS","memo":"indent"}; }
  / EOS+ { return {"type":"EOS"}; }
  / func_call / let / if_stmt

sentence2 = !block_end s:sentence { return s; }
block = s:sentence2* { return s; }
block_end = "ここまで" /　"ーーー" / else
else = "違えば"

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

let 
  = name:word "=" value:calc EOS { return {"type":"let", "name":name, "value":value}; }
  / word josi_eq calc EOS { return {"type":"let", "name":name, "value":value}; }

// コメント関連
__ = (whitespace / range_comment)*
LF = "\n" { return {type:"EOS"}; }
EOS = __ n:(";" / LF / "。" / josi_continue) { return {type:"EOS"}; }
whitespace = [ \t\r、　]
indent = [ 　\t]+
range_comment = "/*" s:$(!"*/" .)* "*/" { return s; }
line_comment = "//" s:$[^\n]* "\n" { return s; }
sharp_comment = "#" s:$[^\n]* "\n" { return s; }
comment
  = n:(range_comment / line_comment / sharp_comment) { 
    return {type:"comment",value:n};
  }

// 数字関連
number = v:(hex / float / int) { return {"type":"number","value":v }; }
hex = "0x" x:$([0-9a-z]i+) { return parseInt("0x" + x, 16); }
float = d1:$([0-9]+) "." d2:$([0-9]+) { return parseFloat( d1 + "." + d2 ); }
int = n:$([0-9]+) { return parseInt(n, 10); }
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
wordchar = w:(kanji / hiragana / katakana / alphabet) { return w; }
word "WORD" = chars:$((!josi_word_split wordchar)*) { return { type:"variable", value:chars }; }

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
  = left:addsub __ "<" __ right:addsub {
     return { type:"calc", operator: "<", "left": left,  "right": right };
  }
  / left:addsub __ "<=" __ right:addsub {
     return { type:"calc", operator: "<=", "left": left,  "right": right };
  }
  / left:addsub __ ">" __ right:addsub {
     return { type:"calc", operator: ">", "left": left,  "right": right };
  }
  / left:addsub __ ">=" __ right:addsub {
     return { type:"calc", operator: ">=", "left": left,  "right": right };
  }
  / left:addsub __ "==" __ right:addsub {
     return { type:"calc", operator: "==", "left": left,  "right": right };
  }
  / left:addsub __ "!=" __ right:addsub {
     return { type:"calc", operator: "!=", "left": left,  "right": right };
  }
  / addsub
addsub
   = left:muldiv __ "+" __ right:addsub {
     return { type:"calc", operator: "+", "left": left,  "right": right };
   }
   / left:muldiv __ "-" __ right: addsub {
     return { type:"calc", operator: "-", "left": left,  "right": right };
   }
   / muldiv
muldiv
  = left:primary __ "*" __ right:muldiv {
     return { type:"calc", operator: "*", "left": left,  "right": right };
   }
  / left:primary __ "/" __ right:muldiv {
     return { type:"calc", operator: "/", "left": left,  "right": right };
   }
  / left:primary __ "%" __ right:muldiv {
     return { type:"calc", operator: "/", "left": left,  "right": right };
   }
   / primary
 primary
   = "(" calc:calc ")" { return calc; } 
   / v:value { return v; }



