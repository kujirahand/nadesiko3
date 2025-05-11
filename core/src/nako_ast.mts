/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 抽象構文木( Abstract Syntax Tree )を定義したもの
 */

import { Token, FuncListItem } from './nako_types.mjs'

/** ASTのノードの種類を定義 */
export type NodeType = 'nop'
  | 'eol'
  | 'comment'
  | 'number'
  | 'bigint'
  | 'bool'
  | 'null'
  | 'word'
  | 'string'
  | 'block'
  | 'end'
  | 'if'
  | 'while'
  | 'atohantei'
  | 'for'
  | 'foreach' // 反復
  | 'repeat_times' // n回
  | 'switch'
  | 'try_except'
  | 'def_func'
  | 'return'
  | 'continue'
  | 'break'
  | 'def_test'
  | 'let'
  | 'let_prop' // #1793
  | 'let_array'
  | 'json_array'
  | 'json_obj'
  | 'op' // operator
  | 'calc'
  | 'variable'
  | 'not'
  | 'and'
  | 'or'
  | 'eq'
  | 'inc'
  | 'func'
  | 'calc_func'
  | 'func_pointer'
  | 'func_obj'
  | 'renbun'
  | 'def_local_var'
  | 'def_local_varlist'
  | 'ref_array' // 配列参照
  | 'ref_prop' // #1793 (プロパティ参照)
  | 'require'
  | 'performance_monitor'
  | 'speed_mode'
  | 'run_mode'

/** 基本的なASTの構造 */
export interface Ast {
  type: NodeType;
  name?: Token | Ast | null | string;
  index?: Ast[]; // 配列へのアクセスに利用
  josi?: string;
  line: number;
  column?: number;
  file?: string;
  startOffset?: number | undefined;
  endOffset?: number | undefined;
  rawJosi?: string;
  end?: {
    startOffset: number | undefined;
    endOffset: number | undefined;
    line?: number;
    column?: number;
  }
  options?: { [key: string]: boolean };
}

/** 複数ブロックを持つAST */
export interface AstBlocks extends Ast {
  blocks: Ast[];
}

/** 改行やコメントなど */
export interface AstEol extends Ast {
  comment: string;
}

/** 文字型のvalueを持つ要素 */
export interface AstStrValue extends Ast {
  value: string;
}

/** 変数か定数を選択するタイプ */
type VarOrConstType = '変数' | '定数'
/** 変数や定数の宣言 */
export interface AstDefVar extends AstBlocks {
  name: string;
  vartype: VarOrConstType
  // blocks[0] ... value
}

/** 複数変数の宣言 */
export interface AstDefVarList extends AstBlocks {
  names: Ast[];
  vartype: VarOrConstType
  // blocks[0] ... value0
  // blocks[1] ... value1
  // ...
}

/** 変数の代入 */
export interface AstLet extends AstBlocks {
  name: string;
  // blocks[0] ... value
}

export interface AstLetArray extends AstBlocks {
  name: string;
  checkInit: boolean; // DNCLモードの場合
  // blocks[0] ... value
  // blocks[1] ... index0
  // blocks[2] ... index1
  // blocks[3] ... index2
}

export interface AstConst extends Ast {
  value: number | string | boolean
}

export interface AstOperator extends AstBlocks {
  operator: string;
  // blocks[0] ... left expr
  // blocks[1] ... right expr
}

export type AstIf = AstBlocks
// blocks[0] ... expr
// blocks[1] ... TRUE block
// blocks[2] ... FALSE black

export type AstWhile = AstBlocks
// blocks[0] ... expr
// blocks[1] ... loop block

export type AstAtohantei = AstBlocks
// blocks[0] ... expr
// blocks[1] ... loop block

export interface AstFor extends AstBlocks {
  word: string; // 変数名(変数を使わないときは'')
  // blocks[0] ... valueFrom
  // blocks[1] ... valueTo
  // blocks[2] ... valueInc
  // blocks[3] ... loop block
  flagDown: boolean; //
  flagUp: boolean; //
  loopDirection: null | 'up' | 'down'; // ループの方向
}

export interface AstForeach extends AstBlocks {
  word: string; // 変数名(使わない時は'')
  // blocks[0] ... 繰り返し対象 (nopなら「それ」の値を使う)
  // blocks[1] ... loop block
}

export type AstRepeatTimes = AstBlocks
// blocks[0] ... expr
// blocks[1] ... loop block

export interface AstSwitch extends AstBlocks {
  case_count: number; // caseの数
  // blocks[0] ... expr
  // blocks[1] ... default
  // blocks[2] ... case[0] expr
  // blocks[3] ... case[0] block
  // blocks[4] ... case[1] expr
  // blocks[5] ... case[1] block
  // ...
}

export interface AstDefFunc extends AstBlocks {
  name: string;
  args: Ast[];
  meta: FuncListItem
  isExport: boolean; // 公開するかどうか
  asyncFn: boolean; // 非同期関数かどうか
}

export interface AstCallFunc extends AstBlocks {
  name: string;
  meta: FuncListItem
  asyncFn: boolean; // 非同期関数かどうか
  setter?: boolean; // 関数の定義
  // blocks[0] ... args[0]
  // blocks[1] ... args[1]
  // blocks[2] ... args[2]
  // ...
}
