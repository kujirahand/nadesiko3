/**
 * 構文解析後の AST を走査して、非同期処理(asyncFn)の要否を判定するモジュール
 *
 * NakoParser から分離した (#2364)。
 * 構文解析が完了した後に AST 全体を走査する後処理パスであり、
 * トークンのカーソルにも計算用スタックにも一切触れない。
 * (実体は nako_parser3.mts の NakoParser._checkAsyncFn だった)
 *
 * 非同期の情報は「非同期関数を呼ぶ関数もまた非同期」という形で伝播していくため、
 * 1 回の走査では行き渡らないことがある。呼び出し側は変化が無くなるまで
 * `checkAsyncFn()` を繰り返し呼ぶこと。
 */
import { Ast, AstBlocks, AstDefFunc, AstCallFunc } from './nako_ast.mjs'
import { FuncList } from './nako_types.mjs'

/** 走査中に AST を書き換えたかどうかを持ち回るための入れ物 */
interface CheckContext {
  modified: boolean
}

/**
 * AST を走査して関数ごとに asyncFn が必要かどうかを確認し、必要なら書き換える。
 *
 * @param node 走査対象の AST
 * @param funclist 関数一覧(呼び出し先が非同期かどうかの判定に使う)
 * @returns AST を書き換えたら true。呼び出し側は false になるまで繰り返すこと
 */
export function checkAsyncFn (node: Ast, funclist: FuncList): boolean {
  const ctx: CheckContext = { modified: false }
  checkNode(node, funclist, ctx)
  return ctx.modified
}

/**
 * ノードが非同期処理を含むかどうかを返す(必要に応じて AST を書き換える)
 * @returns 非同期処理を含むなら true
 */
function checkNode (node: Ast, funclist: FuncList, ctx: CheckContext): boolean {
  if (!node) { return false }
  // 関数定義があれば関数
  if (node.type === 'def_func' || node.type === 'def_test' || node.type === 'func_obj') {
    // 関数定義でasyncFnが指定されているならtrueを返す
    const def: AstDefFunc = node as AstDefFunc
    if (def.asyncFn) {
      // 後から判明した非同期情報を、呼び出し側の判定に使う関数一覧にも反映する
      const func = funclist.get(def.name)
      if (func && !func.asyncFn) {
        func.asyncFn = true
        ctx.modified = true
      }
      return true
    }
    // 関数定義の中身を調べてasyncFnであるならtrueに変更する
    let isAsyncFn = false
    for (const n of def.blocks) {
      if (checkNode(n, funclist, ctx)) {
        isAsyncFn = true
        def.asyncFn = isAsyncFn
        def.meta.asyncFn = isAsyncFn
        const func = funclist.get(def.name)
        if (func) { func.asyncFn = true }
        ctx.modified = true
        return true
      }
    }
  }
  // 関数呼び出しを調べて非同期処理が必要ならtrueを返す
  if (node.type === 'func') {
    // 関数呼び出し自体が非同期処理ならtrueを返す
    const callNode: AstCallFunc = node as AstCallFunc
    if (callNode.asyncFn) {
      return true
    }
    // 続けて、以下の関数呼び出しの引数などに非同期処理があるかどうか調べる
    // 関数の引数は、node.blocksに格納されている
    if (callNode.blocks) {
      for (const n of callNode.blocks) {
        if (checkNode(n, funclist, ctx)) {
          callNode.asyncFn = true
          ctx.modified = true
          return true
        }
      }
    }
    // さらに、関数のリンクを調べる
    const func = funclist.get(callNode.name)
    if (func && func.asyncFn) {
      callNode.asyncFn = true
      ctx.modified = true
      return true
    }
    return false
  }
  // 連文 ... 現在、効率は悪いが非同期で実行することになっている
  if (node.type === 'renbun') {
    return true
  }
  // その他
  if ((node as AstBlocks).blocks) {
    let containsAsync = false
    for (const n of (node as AstBlocks).blocks) {
      if (checkNode(n, funclist, ctx)) {
        containsAsync = true
      }
    }
    return containsAsync
  }
  return false
}
