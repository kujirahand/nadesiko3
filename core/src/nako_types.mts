/**
 * なでしこ3 の TypeScript のための型定義
 */

import { NakoGlobal } from './nako_global.mjs'

// 関数に関する定義
export type FuncArgs = string[][]

export type FuncListItemType = 'func' | 'var' | 'const' | 'test_func'
// FuncListの定義
export interface FuncListItem {
  type: FuncListItemType;
  value?: any;
  josi?: FuncArgs;
  isVariableJosi?: boolean;
  fn?: null | ((...args: any[]) => any) | string;
  varnames?: string[];
  funcPointers?: any[];
  asyncFn?: boolean;
  isExport?: null|boolean;
  // eslint-disable-next-line camelcase
  return_none?: boolean;
  pure?: boolean;
  name?: string;
}

// 変数の型
export type NakoVars = Map<string, any>;

// 関数の一覧
export type FuncList = Map<string, FuncListItem>;
export type ExportMap = Map<string, boolean>;

// トークンのメタ情報
export interface TokenMeta {
    josi: FuncArgs | undefined;
    varnames: string[] | undefined;
    funcPointers: any[] | undefined;
}

// トークン
export interface Token {
    type: string;
    value: any;
    line: number;
    column: number;
    file: string;
    josi: string;
    indent: number;
    meta?: FuncListItem;
    rawJosi?: string;
    startOffset?: number | undefined;
    endOffset?: number | undefined;
    isDefinition?: boolean;
    funcPointer?: boolean;
    tag?: string;
    preprocessedCodeOffset?: number | undefined;
    preprocessedCodeLength?: number | undefined;
    // eslint-disable-next-line no-use-before-define
    name?: Token | Ast; // NakoPaserBase.nodeToStrの問題を回避するため
    start?: number;
    end?: number;
    firstToken?: Token;
    lastToken?: Token;
}

export function NewEmptyToken (type = '?', value: any = '', indent = -1, line = 0, file = 'main.nako3'): Token {
  return {
    type,
    value,
    indent,
    line,
    column: 0,
    file,
    josi: ''
  }
}

export interface Ast {
    type: string;
    cond?: Ast[] | Ast;
    expr?: Ast[] | Ast; // todo: cond と共通化できそう
    block?: Ast[] | Ast;
    target?: Ast[] | Ast | null; // 反復
    errBlock?: Ast[] | Ast; // todo: エラー監視の中でのみ使われる
    cases?: any[]; // 条件分岐
    operator?: string; // 演算子の場合
    left?: Ast | Ast[]; // 演算子の場合
    right?: Ast | Ast[]; // 演算子の場合
    // eslint-disable-next-line camelcase
    false_block?: Ast[] | Ast; // if
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

export interface SourceMap {
    startOffset: number | undefined;
    endOffset: number | undefined;
    file: string | undefined;
    line: number;
    column: number;
}

/**
 * コンパイルオプション
 */
export interface CompilerOptions {
  resetEnv: boolean; // 現在の環境をリセット
  testOnly: boolean; // テストだけを実行する
  resetAll: boolean; // 全ての環境をリセット
  preCode: string; // 環境を構築するためのコード
  nakoGlobal: NakoGlobal | null; // 実行に使う環境
}

export type NakoComEventName = 'finish' | 'beforeRun' | 'beforeGenerate' | 'afterGenerate' | 'beforeParse'

export interface NakoEvent {
  eventName: NakoComEventName
  callback: (event: any) => void
}

/// 範囲オブジェクト (#1704)
export interface RangeObject {
  先頭: number,
  末尾: number,
}

/**
 * デバッグに関する型
 */
export type NakoDebugEventName = 'line'

export interface NakoDebugEvent {
  eventName: NakoDebugEventName
  forceStop: boolean
}

export interface NakoDebugOption {
  useDebug: boolean
  waitTime: number // sec
  messageAction?: string
}
