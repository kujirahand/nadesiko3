// deno-lint-ignore-file no-explicit-any
/**
 * なでしこ3のコンパイラが発火するイベントの管理
 *
 * NakoCompiler に散らばっていたイベント発火処理をまとめたモジュール (#2360)
 */
import { NakoComEventName, NakoEvent } from './nako_types.mjs'

/**
 * コンパイル・実行の前後で呼ばれるイベントを管理するクラス
 */
export class NakoEventEmitter {
  private eventList: NakoEvent[]

  constructor () {
    this.eventList = []
  }

  /**
   * イベントを登録する
   * @param eventName イベント名
   * @param callback コールバック関数
   */
  on (eventName: NakoComEventName, callback: (event: any) => void): void {
    this.eventList.push({ eventName, callback })
  }

  /**
   * 指定したイベントに登録されたコールバックをすべて呼び出す
   * @param eventName イベント名
   * @param event コールバックに渡す値
   */
  fire (eventName: NakoComEventName, event: any): void {
    for (const e of this.eventList) {
      if (e.eventName === eventName) { e.callback(event) }
    }
  }

  /** 登録されているイベントの一覧を返す */
  getEventList (): NakoEvent[] {
    return this.eventList
  }

  /** 登録されているイベントをすべて削除する */
  clear (): void {
    this.eventList = []
  }
}
