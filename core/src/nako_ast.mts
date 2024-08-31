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
  block?: Ast;
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

export interface AstBlock extends Ast {
  blocks: Ast[];
}

export interface AstConst extends Ast {
  value: number | string
}

// 必ずブロックリストを取得
export function getBlocksFromAst(node: Ast): Ast[] {
  if (node.type === 'block') {
    return (node as AstBlock).blocks;
  }
  if (node.block) {
    return [node];
  }
  return []
}

export interface AstOperator extends Ast {
  operator: string;
  left: Ast;
  right: Ast;
}

export interface AstIf extends Ast {
  expr: Ast;
  trueBlock: Ast;
  falseBlock: Ast;
}

export interface AstWhile extends Ast {
  expr: Ast;
  block: Ast;
}

export interface AstAtohantei extends Ast {
  expr: Ast;
  block: Ast;
}

export interface AstFor extends Ast {
  word: string; // 変数名(変数を使わないときは'')
  valueFrom: Ast | null; // 値から (nullの場合、valueToに範囲が入っている)
  valueTo: Ast; // 値まで
  valueInc: Ast | null; // 増分
  flagDown: boolean; // 
  loopDirection: null | 'up' | 'down'; // ループの方向
  block: Ast;
}

export interface AstForeach extends Ast {
  word: string; // 変数名(使わない時は'')
  expr: Ast | null; // 繰り返し対象 (nullなら「それ」の値を使う)
  block: Ast;
}

export interface AstRepeatTimes extends Ast {
  expr: Ast;
  block: Ast;
}


export type AstSwitchCase = [Ast, Ast];

export interface AstSwitch extends Ast {
  expr: Ast | null;
  cases: AstSwitchCase[];
  defaultBlock: Ast;
}
