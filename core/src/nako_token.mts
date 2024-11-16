/* eslint-disable @typescript-eslint/no-explicit-any */

import { FuncListItem, Ast } from './nako_types.mjs'

export type TokenType = '?'
  | 'eol'
  | '_eol'
  | 'eof'
  | 'dec_lineno'
  | 'require'
  | 'line_comment' | 'range_comment'
  | 'とは' // ?
  | 'string'
  | 'string_ex' // nako_lexerの中で展開されるため、nako_parser3には現れない
  | 'number'
  | 'word'
  | 'ならば'
  | '増繰返' | '減繰返'
  | '違えば'
  | '定数'
  | 'ここまで' | 'ここから'
  | 'comma'
  | 'func'
  | 'func_pointer'
  | 'not'
  | 'code' // string_exで文字列の展開に使う
  | 'space'
  | 'def_test'
  | 'def_func'
  | 'bigint'
  | '&'
  | '('
  | ')'
  | 'eq'
  | 'noteq'
  | 'gt'
  | 'gteq'
  | 'lt'
  | 'lteq'
  | '==='
  | '!=='
  | '←'
  | 'and'
  | 'or'
  | '@'
  | '+'
  | '-'
  | '*'
  | '**'
  | '÷'
  | '÷÷'
  | '^'
  | '%'
  | '['
  | ']'
  | '{'
  | '}'
  | '|'
  | 'shift_r0'
  | 'shift_r'
  | 'shift_l'
  | ':'
  | '…'
  | 'もし'
  | '回' // 回
  | '回' // 回繰返 // (#924)
  | '間' // 間
  | '間' // 間繰返 // (#927)
  | '繰返' // 繰返
  | '増繰返' // 増繰返 // (#1140)
  | '減繰返' // 減繰返
  | '後判定' // 後判定 // (#1147)
  | '反復' // 反復
  | '抜ける' // 抜
  | '続ける' // 続
  | '戻る' // 戻
  | '先に' // 先
  | '次に' // 次
  | '代入' // 代入
  | '実行速度優先' // 実行速度優先
  | 'パフォーマンスモニタ適用' // パフォーマンスモニタ適用 // (#986)
  | '定める' // 定
  | '逐次実行' // 逐次実行 // 廃止 #1611 ただし念のため残しておく
  | '条件分岐' // 条件分岐
  | '増' // 増
  | '減' // 減
  | '変数' // 変数
  | '定数' // 定数
  | 'エラー監視' // エラー監視 // 例外処理:エラーならばと対
  | 'エラー' // エラー
  | 'word' // それ
  | 'word' // そう // 「それ」のエイリアス
  | 'def_func' // 関数 // 無名関数の定義用
  | 'インデント構文' // インデント構文 // https://nadesi.com/v3/doc/go.php?949
  | '非同期モード' // 非同期モード // (#637)
  | 'DNCLモード' // DNCLモード // (#1140)
  | 'DNCL2モード'
  | 'モード設定' // モード設定 // (#1020)
  | '取込' // 取込
  | 'モジュール公開既定値' // モジュール公開既定値
  | '厳チェック' // 厳しくチェック (#1698)
  | '」' // error - エラーチェックのため
  | '』' // error - エラーチェックのため
  | '??' // 「表示」のエイリアス
  | '$' // プロパティアクセス

// トークン
export interface Token {
  type: TokenType;
  value: any;
  line: number;
  column: number;
  file: string;
  josi: string;
  indent: number;
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

export interface TokenStrValue {
  value: string;
}

export interface TokenDefFunc extends Token {
  meta: FuncListItem;
}

export interface TokenCallFunc extends Token {
  meta: FuncListItem;
}
