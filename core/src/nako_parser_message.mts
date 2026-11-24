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
 * 参照系ノードの土台や添字・プロパティ名を、ソース表記に戻す (#2692)
 * 値そのものを表す単純なノードだけを対象とし、それ以外は nodeToStr の説明文を使う
 * @param node 土台・添字・プロパティ名のノード (文字列の場合もある)
 */
function refPartToStr (node: Ast | Token | string | null | undefined): string {
  if (node === null || node === undefined) { return '' }
  if (typeof node === 'string') { return node }
  switch (node.type) {
  case 'word':
    // 変数名のモジュール接頭辞 (main__ 等) は表示では省く。
    // 『』の直後でない位置では NakoError 側の置換が効かないため、ここで落とす (#2692)
    return String((node as AstConst).value ?? '').replace(/^main__/, '')
  case 'string':
  case 'number':
  case 'bigint':
    return String((node as AstConst).value ?? '')
  case 'ref_prop':
  case 'ref_array':
  case 'ref_array_value':
    return refNodeToSource(node as Ast)
  case 'op': {
    // 添字が式のときは、演算子記号でつないだソース表記にする (#2692)
    const nodeOp = node as AstOperator
    const table: {[key: string]: string} = { eq: '＝', not: '!', gt: '>', lt: '<', and: 'かつ', or: 'または' }
    const opStr = table[nodeOp.operator] || nodeOp.operator || ''
    if (nodeOp.blocks.length === 1) { return `${opStr}${refPartToStr(nodeOp.blocks[0])}` }
    if (nodeOp.blocks.length === 2) { return `${refPartToStr(nodeOp.blocks[0])}${opStr}${refPartToStr(nodeOp.blocks[1])}` }
    return nodeToStr(node as Ast, { depth: 0 }, false)
  }
  default:
    return nodeToStr(node as Ast, { depth: 0 }, false)
  }
}

/**
 * ref_array / ref_array_value の添字1要素をソース表記にする (#2692)
 * 『A@0$b』の『$b』は、プロパティ名を文字列ノードに変換して添字と同じ
 * index 配列に入れる実装 (#2396) なので、文字列ノードは『$名前』に戻す。
 * 『A@"名前"』のような文字列キーも辞書キーとして等価なので同じ表示になる
 * @param node 添字1要素
 */
function refIndexToStr (node: Ast): string {
  if (node.type === 'string') { return '$' + String((node as AstConst).value ?? '') }
  return '@' + refPartToStr(node)
}

/**
 * 参照系ノード (ref_prop / ref_array / ref_array_value) をソース表記に戻す (#2692)
 * 例: ref_prop → 『ホゲ$hoge』、ref_array → 『A@0』
 * @param node 参照系ノード
 */
function refNodeToSource (node: Ast): string {
  if (node.type === 'ref_prop') {
    const base = refPartToStr(node.name as Ast)
    const props = (node.index || []).map((p) => '$' + refPartToStr(p)).join('')
    return `${base}${props}`
  }
  if (node.type === 'ref_array') {
    const base = refPartToStr(node.name as Ast)
    const indexes = (node.index || []).map((i) => refIndexToStr(i)).join('')
    return `${base}${indexes}`
  }
  // ref_array_value: index[0] が土台、残りが添字 (name が '@'/'[') かプロパティ (name が '$')
  const isProp = node.name === '$'
  const [base, ...rest] = node.index || []
  return refPartToStr(base) + rest.map((i) => isProp ? '$' + refPartToStr(i) : refIndexToStr(i)).join('')
}

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
      // 単項演算子(例: -A)はオペランドを1つしか持たない (#2488)
      if (node2.blocks.length === 1) {
        const operand: string = nodeToStr(node2.blocks[0], { depth }, debugMode)
        return `${typeName('')}『${operand}に演算子『${operator}』を適用した式${debug}』`
      }
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
  case 'ref_prop':
    // 内部型名『ref_prop』ではなく、ソース表記で表示する (#2692)
    return `${typeName('プロパティ参照')}『${refNodeToSource(node as Ast)}${debug}』`
  case 'ref_array':
    return `${typeName('配列参照')}『${refNodeToSource(node as Ast)}${debug}』`
  case 'ref_array_value':
    return `${typeName((node as Ast).name === '$' ? 'プロパティ参照' : '配列参照')}『${refNodeToSource(node as Ast)}${debug}』`
  case 'eol':
    return '行の末尾'
  case 'eof':
    return 'ファイルの末尾'
  default: {
    let name: any = (node as any).name
    if (name && typeof name !== 'string') { name = (node as any).value }
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
