import { NakoSystem, NakoCallback, NakoCallbackEvent } from '../core/src/plugin_api.mjs'

export interface IKeyEvent extends Event {
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  metaKey: boolean
}
export interface ITouchEvent extends Event {
  touches: object
}
export interface IBrowserLocation { // 暫定型 (window.location)
  href: string
}
export interface IBrowserWindow { // 暫定型 - 本来は Window (ブラウザ以外の環境でもなんとなく動かすために定義)
  location: IBrowserLocation
}
export interface IBrowserDocument { // 暫定型 - 本来は Document
  body: object
  querySelector: (selector: string) => HTMLElement|null
}
export interface NakoDomEvent {
  dom: HTMLElement
  event: string
  func: (e: Event) => void
  rawFunc: NakoCallback
}
export type NakoDom = HTMLElement|string

export interface NakoBrowsesrSystem extends NakoSystem {
  __query(dom: NakoDom, commandName: string, isGetFunc: boolean): object|null
  __addEvent(dom: NakoDom, event: string, func: NakoCallback, setHandler: NakoCallbackEvent|null): void
  __keyHandler(e: KeyboardEvent, sys: NakoBrowsesrSystem): void
  __mouseHandler(e: MouseEvent, sys: NakoBrowsesrSystem): void
  __touchHandler(e: TouchEvent, sys: NakoBrowsesrSystem): void
  __removeEvent(dom: NakoDom, event: string, funcStr: NakoCallback): void
  __removeAllDomEvents(): void
  __tohtml(text: string): string
  __tohtmlQ(text: string): string
  __dom_events: NakoDomEvent[]
  __requestAnimationFrameLastId: number
  __addPropMethod(obj: any): void // プロパティ構文のために、__setProp / __getProp メソッドを追加する
  __chartjs: object
}
