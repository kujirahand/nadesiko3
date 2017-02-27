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
  / let_stmt
  / func_call
  / kokomade { return {type:"EOS",memo:"---"}; }

sentence2 = !block_end s:sentence { return s; }
block = s:sentence2* { return s; }
block_end =  kokomade / else
else = "違えば"
kokomade = "ここまで" /　"ーーー" "ー"* / "---" "-"*

for_stmt
  = i:word ("を" / "で") __ kara:calc "から" __ made:calc "まで" __ ("繰り返す" / "繰り返し") LF b:block block_end {
    return {"type":"for", "from":kara, "to":made, "block":b, "word": i};
  }

repeat_times_stmt
  = cnt:(int / intz) "回" __ b:sentence EOS {
    return {"type":"repeat_times", "value":cnt, "block": b};
  }
  / cnt:(int / intz) "回" __ LF b:block block_end {
    return {"type":"repeat_times", "value":cnt, "block": b};
  }
  / parenL cnt:calc parenR "回" __ b:sentence EOS {
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
  = name:word __ ("=" / "＝" / josi_eq) __ value:calc EOS { return {"type":"let", "name":name, "value":value}; }
  / name:word i:("[" calc "]")+ __ ("=" / "＝" / josi_eq) __ value:calc EOS { return {"type":"let_array", "name":name, "index": i.map(e=>{return e[1];}), "value":value}; }
  / name:word ("に"/"へ") value:(calc "を")? "代入" EOS  {
    const v = value ? value[0] : {type:"variable", value:"それ"};
    return {"type":"let", "name":name, "value":v};
  }

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
number = f:"-"? v:(hex / float / int / intz) josuusi? { if (f==="-") { v *= -1; } return {"type":"number","value":v }; }
hex = "0x" x:$([0-9a-z]i+) { return parseInt("0x" + x, 16); }
float = d1:$([0-9]+) "." d2:$([0-9]+) { return parseFloat( d1 + "." + d2 ); }
int = n:$([0-9]+) { return parseInt(n, 10); }
intz = n:$([０-９]+) { return parseInt(convToHalfS(n), 10); }
josuusi = "円" / "個" / "人" / "冊" / "匹" 
  / "本" / "枚" / "台" / "位"
  / "年" / "月" / "日" / "才" / "件" / "羽" 
  / "頭" / "部" / "巻" / "通"

// 文字列関連
rawstring_pat
  = '"' s:$[^"]*  '"' { return s; }
  / "'" s:$[^']*   "'" { return s; }
  / "『" s:$[^』]* "』" { return s; }
rawstring = s:rawstring_pat { return {type:"string", value:s, mode:"raw"}; }
exstring_pat = "「"    "」" { return chars.join(""); }
exstring = "「" s:$[^」]* "」" { return {type:"string", value:s, mode:"ex"}; }
string = rawstring / exstring


// その他の型
null = ("null" / "空") { return {type:"null"}; }
bool = b:(TRUE / FALSE) { return {type:"bool", value: b}; }
TRUE = "はい" / "真" { return true; }
FALSE = "いいえ" / "偽" { return false; }

// 助詞関連
josi = josi_arg / josi_eq
josi_eq = "は"
josi_continue =  "して" / "て"
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
katakana = [ァ-ヶー]
alphabet = [_a-zA-Z]
alphaz = [ａ-ｚＡ-Ｚ＿]
wordchar = w:(kanji / hiragana / katakana / alphabet / alphaz) { return w; }
word "単語" = chars:$((!josi_word_split wordchar)+) { return { type:"variable", value:convToHalfS(chars) }; }

// memo
alphachars = a:$(alphabet / alphaz)+ b:$([0-9a-zA-Z_０-９ａ-ｚＡ-Ｚ＿])* { return convToHalfS(a + b ? b : ""); }

// for value
value
  = number 
  / string
  / w:word i:("[" calc "]")+ { return {type:"ref_array", name:w, index:i.map(e=>{ return e[1]; })}; }
  / word
  / json_data

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

json_data
  = "[" a:json_array "]"  { return {type:"json_array", value:a}; }
  / "{" a:json_obj "}" { return {type:"json_obj", value:a}; }
  / "[" __ "]" { return {type:"json_array", value:[]}; }
  / "{" __ "}" { return {type:"json_obj", value:[]}; } 

json_array
  = __ a1:json_value __ a2:("," __ json_value __)+ {
    const a = [a1];
    a2.forEach(e=>{a.push(e[2]);});
    return a;
  }
  / __ v:json_value __ { return v; }

json_value
  = number / string / null / bool / json_data
   
 json_obj
  = a1:json_key_value __ a2:("," __ json_key_value)+ { 
    const a = a2.map(e=>{ return e[2]; });
    a.unshift(a1);
    return a;
  }
  / a:json_key_value { return [a] }
 
json_key_value
  = key:string __ ":" __ value:json_value { return {"key": key, "value": value }; }
