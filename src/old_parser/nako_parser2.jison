/* nako3 parser for jison (https://github.com/zaach/jison) */

%left 'GT' 'GTEQ' 'LT' 'LTEQ' 'EQ' 'NOTEQ'
%left '+' '-'
%left '*' '/' '%'

%nonassoc EOL
%nonassoc THEN_EOL

%nonassoc IF_WITHOUT_ELSE
%nonassoc ELSE

%right FUNC
%right 'NEG'
%right '('

%start program

%% /* grammer */

program
  : sentences EOF { return $1 }
  ;

sentences
  : sentences sentence
  {
    $$.push($2)
  }
  | sentence
  {
    if (!($$ instanceof Array)) $$ = []
    $$.push($1)
  }
  ;

sentence
  : EOL { $$ = {type: 'eol', line: $1.line} }
  | def_function
  | let_stmt
  | callfunc_stmt
  | if_stmt
  | for_stmt
  | repeat_stmt
  ;

if_stmt
  : IF if_cond THEN_EOL sentences ELSE sentences KOKOMADE
  { $$ = {type: 'if', cond: $2, trueBlock: $4, falseBlock: $6} }
  | IF if_cond THEN_EOL sentences KOKOMADE
  { $$ = {type: 'if', cond: $2, trueBlock: $4} }
  | IF if_cond THEN sentence %prec IF_WITHOUT_ELSE
  { $$ = {type: 'if', cond: $2, trueBlock: $4} }
  | IF if_cond THEN sentence ELSE sentence EOL
  { $$ = {type: 'if', cond: $2, trueBlock: $4} }
  | IF if_cond EOL sentences KOKOMADE
  { $$ = {type: 'if', cond: $2, trueBlock: $4} }
  | IF if_cond EOL sentences ELSE sentences KOKOMADE
  { $$ = {type: 'if', cond: $2, trueBlock: $4, falseBlock: $6} }
  ;

repeat_stmt
  : 回MARK calc 回 block
  ;

for_stmt
  : FOR_MARK WORD calc calc FOR block
  ;

if_cond
  : calc
  ;

block
  : KOKOKARA sentences KOKOMADE { $$ = $2 }
  | sentences KOKOMADE { $$ = $1 }
  ;

def_function
  : DEF_FUNC FUNC '(' def_args ')' EOL block
  { $$ = {type: 'def_func', name: $2, args: $4, block: $7} }
  ;

def_args
  : def_arg
  {
    if (!($$ instanceof Array)) $$ = []
    $$.push($1)
  }
  | def_args def_arg { $$.push($2) }
  ;

def_arg
  : WORD_JOSI
  ;

let_stmt
  : WORD '=' calc
  {
    $$ = {type: 'let', varname: $1, value: $3, line: $1.line}
  }
  ;

callfunc_stmt
  : CALL_FUNC_DUMMY
  ;
  /*
  : FUNC
  { $$ = {type: 'callfunc', name: $1, josi: $2.josi } }
  | args FUNC
  { $$ = {type: 'callfunc', name: $2, args: $1, josi: $2.josi} }
  ;
  */

args
  : arg
  {
    if (!($$ instanceof Array)) $$ = []
    $$.push($1)
  }
  | args arg { $$.push($2) }
  ;

arg
  : calc
  ;

calc
  : calc '+' calc { $$ = {type: 'calc', operator: '+', left: $1, right: $3} }
  | calc '-' calc { $$ = {type: 'calc', operator: '-', left: $1, right: $3} }
  | calc '*' calc { $$ = {type: 'calc', operator: '*', left: $1, right: $3} }
  | calc '/' calc { $$ = {type: 'calc', operator: '/', left: $1, right: $3} }
  | calc '%' calc { $$ = {type: 'calc', operator: '%', left: $1, right: $3} }
  | calc EQ calc { $$ = {type: 'calc', operator: '=', left: $1, right: $3} }
  | calc NOTEQ calc { $$ = {type: 'calc', operator: '!=', left: $1, right: $3} }
  | calc GTEQ calc { $$ = {type: 'calc', operator: '>=', left: $1, right: $3} }
  | calc LTEQ calc { $$ = {type: 'calc', operator: '<=', left: $1, right: $3} }
  | calc GT calc { $$ = {type: 'calc', operator: '>', left: $1, right: $3} }
  | calc LT calc { $$ = {type: 'calc', operator: '<', left: $1, right: $3} }
  | value
  ;

value
  : NUMBER
  | WORD
  | '(' calc ')' { $$ = $2; $$.josi = $3.josi }
  | FUNC_C '(' args ')' { $$ = {type: 'callfunc', name: $1, args: $3 } }
  | FUNC_MARKER args FUNC
  ;
