/** NakoLogger */
import { NakoError } from './nako_errors.mjs'
import { NakoColors } from './nako_colors.mjs'
import { Token, Ast } from './nako_types.mjs'

/** ログレベル - 数字が高いほど優先度が高い。 */

export class LogLevel {
  // level no
  public static trace = 1;
  public static debug = 3;
  public static info = 3;
  public static warn = 4;
  public static error = 5;
  public static stdout = 6;
  // string to level no
  public static fromS (levelStr: string): number {
    let level: number = LogLevel.trace
    switch (levelStr) {
      case 'trace': level = LogLevel.trace; break
      case 'debug': level = LogLevel.debug; break
      case 'info': level = LogLevel.info; break
      case 'warn': level = LogLevel.warn; break
      case 'error': level = LogLevel.error; break
      case 'stdout': level = LogLevel.stdout; break
    }
    return level
  }

  public static toString (level: number): string {
    const levels: string[] = ['___', 'trace', 'debug', 'info', 'warn', 'error', 'stdout']
    return levels[level]
  }
}

/** Source Code Position */
interface Position {
  startOffset: number;
  endOffset: number;
  line: number;
  file: string;
}
type PositionOrNull = Position | Token | Ast | null;

interface LogListenerData {
  position: PositionOrNull; // ログの送信時にposition引数で渡されたデータ
  level: string; // ログの重要度(内部的にはnumber、入出力時stringに変換)
  noColor: string; // 例: '[情報](2行目): foo'
  nodeConsole: string; // 例: '\x1B[1m\x1B[34m[情報]\x1B[0m(2行目): foo\x1B[0m'
  browserConsole: string[]; // 例: ['%c%c[情報]%c(2行目): foo', 'color: inherit; font-weight: bold;', ...]
  html: string; // 例: '<div style="">...</div>'
 }
type LogListener = (data: LogListenerData) => void;

/**
 * エラー位置を日本語で表示する。
 * たとえば `stringifyPosition({ file: "foo.txt", line: 5 })` は `"foo.txt(6行目):"` を出力する。
 */
function stringifyPosition (p: PositionOrNull): string {
  if (!p) { return '' }
  return `${p.file || ''}${p.line === undefined ? '' : `(${p.line + 1}行目): `}`
}

interface NakoLoggerListener {
  level: number;
  callback: LogListener;
}

/**
 * コンパイラのログ情報を出力するためのクラス。
 * trace(), debug(), info(), warn(), error() はそれぞれメッセージに `[警告]` などのタグとエラー位置の日本語表現を付けて表示する。
 * error() は引数にエラーオブジェクトを受け取ることもでき、その場合エラーオブジェクトからエラーメッセージとエラー位置が取り出される。
 */
export class NakoLogger {
  private listeners: NakoLoggerListener[];
  public constructor () {
    this.listeners = []
  }

  /**
   * sendメソッドで送られた情報を受け取るコールバックを設定する。
   * @param levelStr
   * @param callback
   */
  public addListener (levelStr: string, callback: LogListener): void {
    const level: number = LogLevel.fromS(levelStr)
    this.listeners.push({ level, callback })
  }

  /**
   * addListenerメソッドで設定したコールバックを取り外す。
   * @param {LogListener} callback
   */
  public removeListener (callback: LogListener): void {
    this.listeners = this.listeners.filter((l) => l.callback !== callback)
  }

  /** 本体開発時のデバッグ情報（debugより更に詳細な情報）
   * @param {string} message
   * @param {Position | null} position
   */
  public trace (message: string, position: PositionOrNull = null):void {
    this.sendI(LogLevel.trace, `${NakoColors.color.bold}[デバッグ情報（詳細）]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
  }

  /** 本体開発時のデバッグ情報
   * @param {string} message
   * @param {Position | null} position
   */
  public debug (message: string, position: PositionOrNull = null): void {
    this.sendI(LogLevel.debug, `${NakoColors.color.bold}[デバッグ情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
  }

  /** ユーザープログラムのデバッグ情報（あまり重要ではないもの）
   * @param {string} message
   * @param {Position | null} position
   */
  public info (message: string, position: PositionOrNull = null): void {
    this.sendI(LogLevel.info, `${NakoColors.color.bold}${NakoColors.color.blue}[情報]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
  }

  /** ユーザープログラムのデバッグ情報（重要なもの）
   * @param {string} message
   * @param {Position | null} position
   */
  public warn (message: string, position: PositionOrNull = null):void {
    this.sendI(LogLevel.warn, `${NakoColors.color.bold}${NakoColors.color.green}[警告]${NakoColors.color.reset}${stringifyPosition(position)}${message}`, position)
  }

  /** エラーメッセージ
   * @param {string | Error} message
   * @param {Position | null} position
   */
  public error (message: string | Error | NakoError, position: PositionOrNull = null):void {
    if (message instanceof NakoError) {
      // NakoErrorのサブクラスの場合は、そのプロパティからエラー位置などを取得できる。
      this.sendI(
        LogLevel.error,
        `${NakoColors.color.red}${message.tag}${NakoColors.color.reset}${message.positionJa}${message.msg}`,
        position)
      return
    } else if (message instanceof Error) {
      // 一般のエラーの場合は、messageのみ取得できる。
      message = message.message
    }
    this.sendI(
      LogLevel.error,
      `${NakoColors.color.bold}${NakoColors.color.red}[エラー]${NakoColors.color.reset}${stringifyPosition(position)}${message}`,
      position)
  }

  /** ユーザープログラムのデバッグ情報（重要なもの）
   * @param {string} message
   * @param {Position | null} position
   */
  public log (message: string, position: PositionOrNull = null):void {
    this.sendI(LogLevel.stdout, `${message}`, position)
  }

  /** 指定したlevelのlistenerにメッセージを送る。htmlやbrowserConsoleは無ければnodeConsoleから生成する。 */
  public send (levelStr: string, nodeConsole: string, position: PositionOrNull, html: string|null = null, browserConsole: [string, string] | null = null): void {
    const i = LogLevel.fromS(levelStr)
    this.sendI(i, nodeConsole, position, html, browserConsole)
  }

  /** 指定したlevelのlistenerにメッセージを送る。htmlやbrowserConsoleは無ければnodeConsoleから生成する。 */
  public sendI (level: number, nodeConsole: string, position: PositionOrNull, html: string|null = null, browserConsole: [string, string] | null = null): void {
    const makeData = () => {
      // nodeConsoleからnoColor, nodeCondoleなどの形式を生成する。
      const formats = NakoColors.convertColorTextFormat(nodeConsole)
      // ログが複数行から構成される場合は、htmlでの表現にborderを設定する。
      let style = ''
      if (nodeConsole.includes('\n')) {
        style += 'border-top: 1px solid #8080806b; border-bottom: 1px solid #8080806b;'
      }
      // 各イベントリスナーが受け取るデータ
      const data: LogListenerData = {
        noColor: formats.noColor,
        nodeConsole: formats.nodeConsole,
        browserConsole: browserConsole || formats.browserConsole,
        html: `<div style="${style}">` + (html || formats.html) + '</div>', // 各行を style: block で表示するために、<div>で囲む。
        level: LogLevel.toString(level),
        position: position
      }
      return data
    }
    // 登録したリスナーに通知する
    for (const l of this.listeners) {
      if (l.level <= level) {
        const data = makeData()
        l.callback(data)
      }
    }
  }
}
