/**
 * なでしこの計算式を演算子の優先順位に従って構文木へ変換するモジュール
 *
 * NakoParser から分離した (#2364)。
 * 中置記法のリスト(値と演算子が交互に並んだもの)を、逆ポーランド記法を経由して
 * `op` ノードの木に組み立てる。
 *
 * このモジュールはトークンのカーソルにも計算用スタックにも一切触れないため、
 * 構文解析器の相互再帰から完全に独立している。
 * (実体は nako_parser3.mts の NakoParser.infixToPolish / infixToAST だった)
 */
import { opPriority } from './nako_parser_const.mjs'
import { NakoSyntaxError } from './nako_errors.mjs'
import { NakoLogger } from './nako_logger.mjs'
import { Ast, AstOperator } from './nako_ast.mjs'

/**
 * 中置記法のリストを逆ポーランド記法に変換する
 * @param list 値と演算子が交互に並んだリスト(破壊的に消費される)
 * @param logger エラー報告用
 */
export function infixToPolish (list: Ast[], logger: NakoLogger): Ast[] {
  // 中間記法から逆ポーランドに変換
  const priority = (t: Ast) => {
    if (opPriority[t.type]) { return opPriority[t.type] }
    return 10
  }
  const stack: Ast[] = []
  const polish: Ast[] = []
  while (list.length > 0) {
    const t = list.shift()
    if (!t) { break }
    while (stack.length > 0) { // 優先順位を見て移動する
      const sTop = stack[stack.length - 1]
      if (priority(t) > priority(sTop)) { break }
      const tpop = stack.pop()
      if (!tpop) {
        logger.error('計算式に間違いがあります。', t)
        break
      }
      polish.push(tpop)
    }
    stack.push(t)
  }
  // 残った要素を積み替える
  while (stack.length > 0) {
    const t = stack.pop()
    if (t) { polish.push(t) }
  }
  return polish
}

/**
 * 中置記法のリストを構文木(op ノードの入れ子)に変換する
 * @param list 値と演算子が交互に並んだリスト
 * @param logger エラー報告用
 */
export function infixToAST (list: Ast[], logger: NakoLogger): Ast | null {
  if (list.length === 0) { return null }
  // 逆ポーランドを構文木に
  const josi = list[list.length - 1].josi
  const node = list[list.length - 1]
  const polish = infixToPolish(list, logger)
  /** @type {Ast[]} */
  const stack = []
  for (const t of polish) {
    if (!opPriority[t.type]) { // 演算子ではない
      stack.push(t)
      continue
    }
    const b:Ast|undefined = stack.pop()
    const a:Ast|undefined = stack.pop()
    if (a === undefined || b === undefined) {
      logger.debug('--- 計算式(逆ポーランド) ---\n' + JSON.stringify(polish))
      throw NakoSyntaxError.fromNode('計算式でエラー', node)
    }
    /** @type {AstOperator} */
    const op: AstOperator = {
      type: 'op',
      operator: t.type,
      blocks: [a, b],
      josi,
      startOffset: a.startOffset,
      endOffset: a.endOffset,
      line: a.line,
      column: a.column,
      file: a.file
    }
    stack.push(op)
  }
  const ans = stack.pop()
  if (!ans) { return null }
  return ans
}
