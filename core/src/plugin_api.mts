/**
 * @fileOverview プラグインAPIの型定義
 */

export type NakoVariables = Map<string, any>;
export type NakoCallbackEvent = (e: any)=>any;
export type NakoCallback = string | NakoCallbackEvent;

// NakoSystem
export interface NakoSystem {
  version: string;
  coreVersion: string;
  isDebug: boolean;
  tags: any; // 何を設定しても良い自由なタグ領域
  __interval: any[]; // setIntervalのIDを保持する配列
  __timeout: any[]; // setTimeoutのIDを保持する配列
  __reisetu: number; // 礼節レベル(ジョーク機能)
  __printPool: string; // 『継続表示』のための一時変数(『表示』実行で初期化)
  __getSysVar (name: string, defaultValue?: any): any; // システム変数の参照
  __setSysVar (name: string, value: any): void; // システム変数の設定
  __findVar (name: NakoCallback, defaultValue?: any): any;
  __findFunc (nameStr: any, parentFunc: string): any;
  __exec (func: string, params: any[]): any;
  __setSore(v: any): void;
  __getSore(): any;
  __loadScript(url: string): Promise<void>; // JSのスクリプトを読み込む (ex) グラフ描画(plguin_browser_chart.mts)
  logger: any; // Logger
  // 便利なメソッド
  __zero (s: string, keta: number): string; // 桁を指定してゼロ埋めする
  __zero2 (s: string | number): string; // 2桁のゼロ埋め
  __formatDateTime (t: Date, fmt: string): string;
  __formatDate (t: Date): string;
  __formatTime (t: Date): string;
  __str2date(s: string): Date;
  __parseFloatOrBigint(v: any): number | bigint;
  __evalJS (code: string): any;
  josiList: string[];
  reservedWords: string[];
  // 実際には存在するが利用が非推奨なメソッドやプロパティ
  // __module: string[];
  // __namespaceList: string[];
  // __varslist: NakoVariables[]; // [0]はシステム変数 / [1]はグローバル変数 [2] 以降はローカル変数
  // pluginfiles: string[];
}
