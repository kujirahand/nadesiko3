{
// ------------------------------------------------
//   なでしこの文法をPEGで定義したもの
// -- https://pegjs.org/online を利用して編集すると良い感じ
// ------------------------------------------------
}

start = sentence+

sentence
  = blank_stmt
  / end / continue / break / return_stmt
  / def_func
  / kokomade { return {type:"EOS",memo:"---"}; }
  / embed_stmt
  / kokokara? flow_stmt:(if_stmt / while_stmt / repeat_times_stmt / for_stmt / foreach_stmt) { return flow_stmt; }
  / let_stmt
  / def_local_var
  / func_call_stmt

sentence2 = !block_end s:sentence { return s; }
block = s:sentence2* { return s; }
block_end =  kokomade / else
else = "違えば"
kokokara = ("ここから" / "→") whitespace*
kokomade = ("ここまで" /　"--" "-"+ / "←")
break = "抜ける" EOS { return {type:"break", loc:location()}; }
continue = "続ける" EOS { return {type:"continue", loc:location()}; }
end = ("終わる" / "終了") EOS { return {type:"end"}; }

embed_stmt = "JS" js:nami_string_pat { return {type:"embed_code", value:js}; }

def_func
  = "●" def:def_func_name "とは"? __ kokokara? EOS b:block kokomade {
   return {type:"def_func", "name":def.name, "args":def.args, block:b, loc:location() };
  }
  / "●" def:def_func_name "とは"? __ kokokara? EOS b:block "" {
    error("関数『"+def.name.value+"』の定義で『ここまで』がありません。", location());
  }

def_func_name
  = parenL args:def_func_arg* parenR SPC name:word SPC { return {"name": name, "args": args} }
  / name:word SPC parenL args:def_func_arg* parenR SPC { return {"name": name, "args": args} }
  / name:word SPC { return {"name": name, "args":[] } }

def_func_arg
  = w:word j:josi? ("|" / ",")? SPC
  { return {"word":w, "josi":j}; }

return_word = "戻る" / "戻す"

return_stmt
  = return_word EOS { return {type:"return",value:null,loc:location()}; }
  / v:calc ("で"/"を") return_word EOS { return {type:"return",value:v, loc:location()}; }

func_obj
  = "関数" SPC parenL args:def_func_arg* parenR kokokara? b:block block_end {
    return {type:"func_obj", "args":args, block:b, loc:location() };
  }
  / "関数" SPC parenL args:def_func_arg* parenR kokokara? b:block "" {
    error("無名関数の定義で『ここまで』がありません。", location());
  }

foreach_stmt
  = name:word "で" target:value "を" hanpuku kokokara? EOS b:block block_end {
    return {"type":"foreach", "target":target, "block":b, "name":name, loc:location()};
  }
  / target:value "を" name:word "で" hanpuku kokokara? EOS b:block block_end {
    return {"type":"foreach", "target":target, "block":b, "name":name, loc:location()};
  }
  / target:value "を" __ hanpuku kokokara? EOS b:block block_end {
    return {"type":"foreach", "target":target, "block":b, "name":null, loc:location()};
  }
  / hanpuku kokokara? EOS b:block block_end {
    return {"type":"foreach", "target":null, "block":b, "name":null, loc:location()};
  }
  / target:value "を" __ hanpuku EOS b:block "" {
    error("『反復』構文で『ここまで』がありません。", location());
  }
  / hanpuku EOS b:block "" {
    error("『反復』構文で『ここまで』がありません。", location());
  }

hanpuku = "反復" / "反復する"

for_stmt
  = i:word ("を" / "で") __ kara:calc "から" __ made:calc "まで" __ kurikaesu EOS b:block block_end {
    return {"type":"for", "from":kara, "to":made, "block":b, "word": i, loc:location()};
  }
  / kara:calc "から" __ made:calc "まで" __ kurikaesu EOS b:block block_end {
    return {"type":"for", "from":kara, "to":made, "block":b, "word": "", loc:location()};
  }
  / i:word ("を" / "で") __ kara:calc "から" __ made:calc "まで" __ kurikaesu EOS b:block "" {
    error("『繰り返す』構文で『ここまで』がありません。", location());
  }
  / kara:calc "から" __ made:calc "まで" __ kurikaesu EOS b:block "" {
    error("『繰り返す』構文で『ここまで』がありません。", location());
  }

kurikaesu = ("繰り返す" / "繰り返し" / "繰返す" / "繰返し") __ kokokara?

repeat_times_stmt
  = cnt:times_cond "回" __ b:sentence EOS {
    return {"type":"repeat_times", "value":cnt, "block": b, loc:location()};
  }
  / cnt:times_cond "回" __ kokokara? __ EOS b:block block_end {
    return {"type":"repeat_times", "value":cnt, "block": b, loc:location()};
  }
  / cnt:times_cond "回" __ EOS b:block "" {
    error("『(N)回』構文で『ここまで』がありません。", location());
  }

times_cond
  = int
  / parenL c:calc parenR { return c; }

while_stmt
  = parenL expr:calc parenR  "の間" __ kokokara? EOS b:block block_end {
    return {"type":"while", "cond":expr, "block":b, loc:location()};
  }
  / parenL expr:calc parenR  "の間" EOS b:block "" {
    error("『(条件)の間』構文で『ここまで』がありません。", location());
  }

if_stmt
  = "もし" __ expr:if_expr __ josi_naraba __ EOS __ tb:block __
    else __ EOS __ fb:block block_end {
    return {"type":"if", "expr":expr, "block":tb, "false_block":fb, loc:location()};
  }
  / "もし" __ expr:if_expr __ josi_naraba __ EOS __ tb:block __
    else __ EOS __ fb:block "" {
    error("『もし』構文で『ここまで』がありません。", location());
  }
  / "もし" __ expr:if_expr __ josi_naraba __ EOS __ tb:block block_end {
    return {"type":"if", "expr":expr, "block":tb, "false_block":[], loc:location()};
  }
  / "もし" __ expr:if_expr __ josi_naraba __ EOS __ tb:block "" {
    error("『もし』構文で『ここまで』がありません。", location());
  }
  // ブロックなしの「もし」文の時
  / "もし" __ expr:if_expr __ josi_naraba __ t:sentence EOS? else f:sentence EOS {
    return {"type":"if", "expr":expr, "block":t, "false_block":f, loc:location()};
  }
  / "もし" __ expr:if_expr __ josi_naraba __ t:sentence EOS {
    return {"type":"if", "expr":expr, "block":t, false_block:[], loc:location()};
  }

if_expr
  = "そう" &josi_naraba {
    return {type:"variable", value:"それ"};
  }
  / a:if_value "が" b:if_value &josi_naraba {
    return {type:"calc", left:a, right:b, operator:"=="};
  }
  / a:if_value josi __ b:if_value (josi __)? op:if_jop {
    return {type:"calc", left:a, right:b, operator:op};
  }
  / calc

if_jop
  = "等しい" { return "=="; }
  / "超"    { return ">"; }
  / "未満" { return "<"; }
  / "以上" { return ">="; }
  / "以下" { return "<="; }
  / "異なる" { return "!="; }

if_value
  = v: (number / string / word) { return v; }
  / parenL v:calc parenR { return v; }

func_arg
  = v:calc j:josi wordbreak { return {"type":"arg", "value":v, "josi":j} }

func_call_stmt
  = name:word EOS {
    return {type:"func", "args":[], "name":name, loc:location()};
  }
  / args:func_arg+ name:word EOS {
    return {type:"func", "args":args, "name":name, loc:location()};
  }

let_stmt
  = name:word wordbreak ("=" / josi_eq) __ value:calc EOS { return {"type":"let", "name":name, "value":value, }; loc:location()}
  / name:word i:("[" calc "]")+ wordbreak ("=" / josi_eq) __ value:calc EOS { return {"type":"let_array", "name":name, "index": i.map(e=>{return e[1];}), "value":value, loc:location()}; }
  / name:word i:("@" value)+ wordbreak ("=" / josi_eq) __ value:calc EOS { return {"type":"let_array", "name":name, "index": i.map(e=>{return e[1];}), "value":value, loc:location()}; }  / name:word ("に"/"へ") value:(calc "を")? "代入" EOS  {
    const v = value ? value[0] : {type:"variable", value:"それ", loc:location()};
    return {"type":"let", "name":name, "value":v};
  }
  / value:(calc "を")? name:word ("に"/"へ") "代入" EOS  {
    const v = value ? value[0] : {type:"variable", value:"それ", loc:location()};
    return {"type":"let", "name":name, "value":v};
  }

def_local_var
  = name:word "とは" wordbreak vtype:var_type "="  v:calc EOS {
    return {"type":"def_local_var", name:name, vartype:vtype, value:v, loc:location()};
  }
  / name:word "とは" wordbreak vtype:var_type EOS {
    return {"type":"def_local_var", name:name, vartype:vtype, value:null, loc:location()};
  }
  / vtype:var_type "の" wordbreak name:word ("は"/"=") wordbreak v:calc EOS {
    return {"type":"def_local_var", name:name, vartype:vtype, value:v, loc:location()};
  }

var_type = ("変数"/"定数")


// コメント関連
wordbreak = " "* ","? " "*
whitespace = [ ,]
SPCLF = [ \n]*
SPC   = " "*
LF    = "\n" { return {type:"EOS", loc:location()}; }
__    = (whitespace / range_comment / "_" whitespace* LF)*
EOS   = __ (EOS2 / line_comment)
EOS2  = n:(";" / LF / josi_continue whitespace*) { return {type:"EOS", loc:location()}; }
range_comment = "/*" s:$(!"*/" .)* "*/" { return s; }
line_comment = ("//" / "#") s:$[^\n]* LF { return s; }
comment
  = n:(range_comment / line_comment) {
    return {type:"comment",value:n,loc:location()};
  }
INDENT = [ ・]+
blank_stmt
  = INDENT { return {type:"nop"} }
  / comment
  / c:LF+  { return c[0]; }
  / c:EOS+ { return c[0]; }

// 数字関連
number = f:"-"? v:(hex / float / int) josuusi? { if (f==="-") { v *= -1; } return {"type":"number","value":v }; }
hex = "0x" x:$([0-9a-z]i+) { return parseInt("0x" + x, 16); }
float = d1:$([0-9]+) "." d2:$([0-9]+) d3:$("e" ("+" / "-") [0-9]+)? { return parseFloat( d1 + "." + d2 + d3 ); }
int = n:$([0-9]+) { return parseInt(n, 10); }
josuusi
  = "円" / "個" / "人" / "冊" / "匹"
  / "本" / "枚" / "台" / "位" / "才"
  / "件" / "羽" / "頭" / "部" / "巻"

// 文字列関連
rawstring_pat
  = '"' s:$[^"]*  '"' { return s; }
  / "'" s:$[^']*   "'" { return s; }
  / "『" s:$[^』]* "』" { return s; }
  / "R" s:nami_string_pat { return s; }

rawstring
  = s:rawstring_pat { return {type:"string", value:s, mode:"raw"}; }

exstring_pat
  = "「" s:$[^」]* "」" { return s; }
  / "S" s:nami_string_pat { return s; }
  / "文字列" s:nami_string_pat { return s; }

nami_string_pat
  = nami_begin5 s:$(!nami_end5 .)* nami_end5 { return s; }
  / nami_begin4 s:$(!nami_end4 .)* nami_end4 { return s; }
  / nami_begin3 s:$(!nami_end3 .)* nami_end3 { return s; }

nami_begin5 = "{{{{{"
nami_end5 = "}}}}}"
nami_begin4 = "{{{{"
nami_end4 = "}}}}"
nami_begin3 = "{{{" / "｛｛｛"
nami_end3 = "}}}" / "｝｝｝"

exstring
  = s:exstring_pat { return {type:"string", value:s, mode:"ex"}; }

string = rawstring / exstring


// その他の型
null = ("null" / "空") { return {type:"null"}; }
bool = b:(TRUE / FALSE) { return {type:"bool", value: b}; }
TRUE = "はい" / "真" { return true; }
FALSE = "いいえ" / "偽" { return false; }

// 助詞関連
josi = josi_arg / josi_eq
josi_eq = "は"
josi_continue
  = "いて" / "えて" / "きて" / "けて" / "して" / "って"
  / "にて" / "みて" / "めて" / "ねて"

josi_arg =
  josi_name:("について" / "ならば" / "なら" / "くらい" / "なのか" /
    "とは" / "から" / "までを" / "までの" / "まで" / "だけ" / "より" /
    "ほど" / "など" / "では" /
    "を" / "に" / "へ" / "で" / "と" / "が" / "の") {
    return josi_name;
  }
josi_naraba = "ならば"
josi_word_split = josi_eq / josi_arg / josi_continue / josi_naraba

// word
kanji    = [\u4E00-\u9FCF]
hiragana = [ぁ-ん]
katakana = [ァ-ヶー]
alphabet = [_a-zA-Z]
numchars = [0-9]
wordchar = w:(kanji / hiragana / katakana / alphabet) { return w; }
wordchar2 = w:(kanji / hiragana / katakana / alphabet / numchars) { return w; }
word = !numchars chars:$((!josi_word_split wordchar2)+) { return { type:"variable", value:chars, loc:location()}; }

// for value
value
  = number
  / string
  / func_obj
  / embed_stmt
  / w:word i:("[" calc "]")+ { return {type:"ref_array", name:w, index:i.map(e=>{ return e[1]; })}; }
  / w:word i:("@" calc)+ { return {type:"ref_array", name:w, index:i.map(e=>{ return e[1]; })}; }
  / w:word parenL ar:calc_func_args parenR { return {type:"calc_func", args:ar, name:w}; }
  / json_stmt
  / word

calc_func_args
  = SPCLF v1:calc SPCLF v2:("," SPCLF calc)* {
    const a = [v1];
    if (v2) v2.forEach(e=>{a.push(e[2]);});
    return a;
  }

// calc
calc
  = and_or

and_or
  = left:comp __ ("||" / "または") __ right:comp {
    return { type:"calc", operator:"||", "left":left, "right":right };
  }
  / left:comp __ ("&&" / "かつ") __ right:comp {
    return { type:"calc", operator:"&&", "left":left, "right":right };
  }
  / comp

comp
  = left:addsub __ "<" __ right:addsub {
     return { type:"calc", operator: "<", "left": left,  "right": right };
  }
  / left:addsub __ ("<=" / "≦") __ right:addsub {
     return { type:"calc", operator: "<=", "left": left,  "right": right };
  }
  / left:addsub __ ">" __ right:addsub {
     return { type:"calc", operator: ">", "left": left,  "right": right };
  }
  / left:addsub __ (">=" / "≧") __ right:addsub {
     return { type:"calc", operator: ">=", "left": left,  "right": right };
  }
  / left:addsub __ ("==" / "=") __ right:addsub {
     return { type:"calc", operator: "==", "left": left,  "right": right };
  }
  / left:addsub __ ("!=" / "<>" / "≠") __ right:addsub {
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
   / left:muldiv __ "&" __ right: addsub {
     return { type:"calc", operator: "&", "left": left,  "right": right };
   }
   / muldiv

muldiv
  = left:primary2 __ ("*" / "×") __ right:muldiv {
     return { type:"calc", operator: "*", "left": left,  "right": right };
   }
  / left:primary2 __ ("/" / "÷") __ right:muldiv {
     return { type:"calc", operator: "/", "left": left,  "right": right };
   }
  / left:primary2 __ "%" __ right:muldiv {
     return { type:"calc", operator: "%", "left": left,  "right": right };
   }
   / primary2

primary2
  = left:primary __ "^" __ right:primary2 {
    return { type:"calc", operator: "^", "left": left,  "right": right };
  }
  / primary

primary
   = parenL v:calc parenR { return v; }
   / "!" v:value { return { type:"not", value:v }; }
   / value

parenL = "("
parenR = ")"

json_stmt
  = "[" SPCLF a:json_array SPCLF "]"  { return {type:"json_array", value:a, loc:location()}; }
  / "{" SPCLF a:json_obj SPCLF "}" { return {type:"json_obj", value:a, loc:location()}; }
  / ("[" SPCLF "]" / "空配列") { return {type:"json_array", value:[], loc:location()}; }
  / "{" SPCLF "}" { return {type:"json_obj", value:[], loc:location()}; }

json_array
  = a1:json_value SPCLF a2:("," SPCLF json_value SPCLF)+ {
    const a = [a1];
    a2.forEach(e=>{a.push(e[2]);});
    return a;
  }
  / v:json_value { return v; }

json_value
  = calc / number / string / null / bool / word / json_stmt

 json_obj
  = a1:json_key_value SPCLF a2:("," SPCLF json_key_value)+ {
    const a = a2.map(e=>{ return e[2]; });
    a.unshift(a1);
    return a;
  }
  / a:json_key_value { return [a] }

json_key_value
  = key:string SPCLF ":" SPCLF value:json_value { return {"key": key, "value": value }; }
