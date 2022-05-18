/**
 * なでしこ3 の TypeScript のための型定義
 */

// 関数に関する定義
export type FuncArgs = string[][]

// FuncListの定義
export interface FuncListItem {
  type: 'func' | 'var' | 'const' | 'test_func';
  value?: any;
  josi?: FuncArgs;
  isVariableJosi?: boolean;
  fn?: null | ((...args: any[]) => any) | string;
  varnames?: string[];
  funcPointers?: any[];
  asyncFn?: boolean;
  // eslint-disable-next-line camelcase
  return_none?: boolean;
  pure?: boolean;
  name?: string;
}

export type FuncList = {[key: string]: FuncListItem};

export interface TokenMeta {
    josi: FuncArgs | undefined;
    varnames: string[] | undefined;
    funcPointers: any[] | undefined;
}

export interface Token {
    type: string;
    value: any;
    line: number;
    column: number;
    file: string;
    josi: string;
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

export function NewEmptyToken (type = '?', value: any = {}, line = 0, file = 'main.nako3'): Token {
  return {
    type,
    value,
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
    blocks?: Ast[]; // todo: 逐次実行でのみ使われるので、今後削除可能
    errorBlock?: Ast[] | Ast; // todo: 逐次実行でのみ使われるので、今後削除可能
    errBlock?: Ast[] | Ast; // todo: エラー監視の中でのみ使われる
    cases?: any[]; // 条件分岐
    operator?: string; // 演算子の場合
    left?: Ast | Ast[]; // 演算子の場合
    right?: Ast | Ast[]; // 演算子の場合
    // eslint-disable-next-line camelcase
    false_block?: Ast[] | Ast; // if
    from?: Ast[] | Ast; // for
    to?: Ast[] | Ast; // for
    inc?: Ast[] | Ast | null; // for
    word?: Ast | null; // for
    name?: Token | Ast | null | string;
    names?: Ast[];
    args?: Ast[]; // 関数の引数
    asyncFn?: boolean; // 関数の定義
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
