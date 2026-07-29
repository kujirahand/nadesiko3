/**
 * 構文解析器のエラーメッセージを組み立てるモジュール
 *
 * NakoParser / NakoParserBase から分離した (#2364)。
 * 構文木やトークンを日本語の説明文に変換するだけで、
 * トークンのカーソルにも計算用スタックにも一切触れない。
 * (実体は nako_parser_base.mts の nodeToStr と
 *  nako_parser3.mts の makeStackBalanceReport だった)
 */
import { Ast, AstBlocks, AstOperator, AstConst, AstStrValue } from './nako_ast.mjs'
import { Token } from './nako_token.mjs'
import { FuncArgs, FuncListItem } from './nako_types.mjs'

/**
 * 構文木やトークンを日本語の説明文にする
 * @param node 説明したいノード
 * @param opts depth: 展開する深さ / typeName: 先頭の型名を上書きする場合に指定
 * @param debugMode true ならノードの JSON も埋め込む
 */
export function nodeToStr (node: Ast|Token|null, opts: {depth: number, typeName?: string}, debugMode: boolean): string {
  const depth = opts.depth - 1
  const typeName = (name: string) => (opts.typeName !== undefined) ? opts.typeName : name
  const debug = debugMode ? (' debug: ' + JSON.stringify(node, null, 2)) : ''
  if (!node) { return '(NULL)' }
  switch (node.type) {
  case 'not':
    if (depth >= 0) {
      const subNode: Ast = (node as AstBlocks).blocks[0]
      return `${typeName('')}『${nodeToStr(subNode, { depth }, debugMode)}に演算子『not』を適用した式${debug}』`
    } else {
      return `${typeName('演算子')}『not』`
    }
  case 'op': {
    const node2: AstOperator = node as AstOperator
    let operator: string = node2.operator || ''
    const table:{[key: string]: string} = { eq: '＝', not: '!', gt: '>', lt: '<', and: 'かつ', or: 'または' }
    if (operator in table) {
      operator = table[operator]
    }
    if (depth >= 0) {
      const left: string = nodeToStr(node2.blocks[0], { depth }, debugMode)
      const right: string = nodeToStr(node2.blocks[1], { depth }, debugMode)
      if (node2.operator === 'eq') {
        return `${typeName('')}『${left}と${right}が等しいかどうかの比較${debug}』`
      }
      return `${typeName('')}『${left}と${right}に演算子『${operator}』を適用した式${debug}』`
    } else {
      return `${typeName('演算子')}『${operator}${debug}』`
    }
  }
  case 'number':
    return `${typeName('数値')}${(node as AstConst).value}`
  case 'bigint':
    return `${typeName('巨大整数')}${(node as AstConst).value}`
  case 'string':
    return `${typeName('文字列')}『${(node as AstConst).value}${debug}』`
  case 'word':
    return `${typeName('単語')}『${(node as AstStrValue).value}${debug}』`
  case 'func':
    return `${typeName('関数')}『${node.name || (node as AstStrValue).value}${debug}』`
  case 'eol':
    return '行の末尾'
  case 'eof':
    return 'ファイルの末尾'
  default: {
    let name:any = node.name
    if (name) { name = (node as AstStrValue).value }
    if (typeof name !== 'string') { name = node.type }
    return `${typeName('')}『${name}${debug}』`
  }
  }
}

/**
 * 計算用スタックに余りが出たときのレポートを作る
 * @param stack 余ってしまった計算用スタックの中身
 * @param recentlyCalledFunc 最近呼び出した関数(使い方の候補を示すのに使う #1093)
 */
export function makeStackBalanceReport (stack: Ast[], recentlyCalledFunc: FuncListItem[]): string {
  const words: string[] = []
  stack.forEach((t) => {
    let w = nodeToStr(t, { depth: 1 }, false)
    if (t.josi) { w += t.josi }
    words.push(w)
  })
  const desc = words.join(',')
  // 最近使った関数の使い方レポートを作る #1093
  let descFunc = ''
  const chA = 'A'.charCodeAt(0)
  for (const f of recentlyCalledFunc) {
    descFunc += ' - '
    let no = 0
    const josiA: FuncArgs | undefined = (f).josi
    if (josiA) {
      for (const arg of josiA) {
        const ch = String.fromCharCode(chA + no)
        descFunc += ch
        if (arg.length === 1) { descFunc += arg[0] } else { descFunc += `(${arg.join('|')})` }
        no++
      }
    }
    descFunc += String(f.name) + '\n'
  }
  return `未解決の単語があります: [${desc}]\n次の命令の可能性があります:\n${descFunc}`
}
