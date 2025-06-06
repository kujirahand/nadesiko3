/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileOverview プラグインAPIの型定義
 */

export type NakoVariables = Map<string, unknown>;
export type NakoCallbackEvent = ((e: object) => boolean) | ((e: object, sys: any) => boolean);
export type NakoCallback = string | NakoCallbackEvent;
export type NakoValue = string | number | boolean | bigint | object | null | undefined;

// NakoSystem
export interface NakoSystem {
  version: string;
  coreVersion: string;
  isDebug: boolean;
  tags: any; // 何を設定しても良い自由なタグ領域
  __interval: string|number[]; // setIntervalのIDを保持する配列
  __timeout: string|number[]; // setTimeoutのIDを保持する配列
  __reisetu: number; // 礼節レベル(ジョーク機能)
  __printPool: string; // 『継続表示』のための一時変数(『表示』実行で初期化)
  __getSysVar(name: string, defaultValue?: NakoValue): any; // システム変数の参照
  __setSysVar(name: string, value: NakoValue): void; // システム変数の設定
  __findVar(name: NakoCallback, defaultValue?: NakoValue): any; // 変数を探す
  __findFunc(nameStr: string, parentFunc: string): NakoCallback | any;
  __exec(func: string, params: NakoValue[]): any;
  __setSore(v: any): void;
  __getSore(): any;
  __loadScript(url: string): Promise<void>; // JSのスクリプトを読み込む (ex) グラフ描画(plugin_browser_chart.mts)
  __hatena: (s: string, sys: NakoSystem) => void; // 「？？」記法の関数キャッシュ #1852
  logger: any; // Logger
  // 便利なメソッド
  __zero (s: string, keta: number): string; // 桁を指定してゼロ埋めする
  __zero2 (s: string | number): string; // 2桁のゼロ埋め
  __formatDateTime (t: Date, fmt: string): string;
  __formatDate (t: Date): string;
  __formatTime (t: Date): string;
  __str2date(s: string): Date;
  __parseFloatOrBigint(v: NakoValue): number | bigint;
  __evalJS(code: string, sys?: NakoSystem): NakoValue;
  __evalSafe(code: string): NakoValue;
  // eslint-disable-next-line
  __registPropAccessor(f: Function, getProp: (prop: string|string[], sys: NakoSystem) => any, setProp: (prop: string|string[], value: object, sys: NakoSystem) => any):void;
  __checkPropAccessor(mode: 'get'|'set', obj: any):void;
  josiList: string[];
  reservedWords: string[];
  // 実際には存在するが利用が非推奨なメソッドやプロパティ
  // __module: string[];
  // __namespaceList: string[];
  // __varslist: NakoVariables[]; // [0]はシステム変数 / [1]はグローバル変数 [2] 以降はローカル変数
  // pluginfiles: string[];
}
