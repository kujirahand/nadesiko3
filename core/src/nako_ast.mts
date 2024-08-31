/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 抽象構文木( Abstract Syntax Tree )を定義したもの
 */

import { Token } from './nako_types.mjs'

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
  | '反復' // foreach
  | '回' // repeat_times
  | 'switch'
  | 'try_except'
  | 'def_func'
  | 'return'
  | 'continue'
  | 'break'
  | 'def_test'
  | 'let'
  | 'let_array'
  | 'json_array'
  | 'json_obj'
  | 'op'
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
  | '配列参照'
  | 'require'
  | 'performance_monitor'
  | 'speed_mode'
  | 'run_mode'


export interface Ast {
  type: NodeType;
  errBlock?: Ast[] | Ast; // todo: エラー監視の中でのみ使われる
  name?: Token | Ast | null | string;
  names?: Ast[];
  args?: Ast[]; // 関数の引数
  asyncFn?: boolean; // 関数の定義
  isExport?: boolean;
  meta?: any; // 関数の定義
  setter?: boolean; // 関数の定義
  index?: Ast[]; // 配列へのアクセスに利用
  josi?: string;
  value?: any;
  line: number;
  column?: number;
  file?: string;
  startOffset?: number | undefined;
  endOffset?: number | undefined;
  rawJosi?: string;
  vartype?: string;
  end?: {
    startOffset: number | undefined;
    endOffset: number | undefined;
    line?: number;
    column?: number;
  }
  tag?: string;
  genMode?: string;
  checkInit?: boolean;
  options?: { [key: string]: boolean };
}

export interface AstEol extends Ast {
  comment: string;
}

// 複数ブロックを持つAST
export interface AstBlocks extends Ast {
  blocks: Ast[];
}

export interface AstConst extends Ast {
  value: number | string
}

export interface AstOperator extends Ast {
  operator: string;
  left: Ast;
  right: Ast;
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
  loopDirection: null | 'up' | 'down'; // ループの方向
}

export interface AstForDesc extends Ast {
  word: string; // 変数名(変数を使わないときは'')
  valueFrom: Ast; // 値から (nopの場合、valueToに範囲が入っている)
  valueTo: Ast; // 値まで
  valueInc: Ast; // 増分
  flagDown: boolean; // 
  loopDirection: null | 'up' | 'down'; // ループの方向
  block: Ast;
}

export function AstForToDesc(node: AstFor): AstForDesc {
  return {
    ...node,
    word: node.word,
    valueFrom: node.blocks[0],
    valueTo: node.blocks[1],
    valueInc: node.blocks[2],
    block: node.blocks[3],
    flagDown: node.flagDown,
    loopDirection: node.loopDirection,
  }
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
