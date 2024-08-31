/**
 * 抽象構文木( Abstract Syntax Tree )を定義したもの
 */

import { Token } from './nako_types.mjs'

export interface Ast {
  type: string;
  expr?: Ast[] | Ast; // todo: cond と共通化できそう
  cond?: Ast;
  block?: Ast[] | Ast;
  target?: Ast[] | Ast | null; // 反復
  errBlock?: Ast[] | Ast; // todo: エラー監視の中でのみ使われる
  cases?: any[]; // 条件分岐
  operator?: string; // 演算子の場合
  left?: Ast | Ast[]; // 演算子の場合
  right?: Ast | Ast[]; // 演算子の場合
  from?: Ast | null; // for
  to?: Ast; // for
  inc?: Ast[] | Ast | null | string; // for
  word?: Ast | Token | null; // for
  flagDown?: boolean; // for
  loopDirection?: null | 'up' | 'down'; // for
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
  mode?: string; // 文字列の展開などで利用
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

export interface AstIf extends Ast {
  expr: Ast;
  trueBlock: Ast;
  falseBlock: Ast;
}
