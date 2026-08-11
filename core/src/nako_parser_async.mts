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
import { Ast, AstBlocks, AstDefFunc, AstCallFunc, AstLet } from './nako_ast.mjs'
import { FuncList } from './nako_types.mjs'

/** 走査中に AST を書き換えたかどうかを持ち回るための入れ物 */
interface CheckContext {
  modified: boolean
  /**
   * 無名関数を保持している変数名 → その無名関数が非同期かどうか
   *
   * `F=●()...ここまで` のように変数へ代入された無名関数は funclist に載らないため、
   * 代入を覚えておかないと `F()` の呼び出しに asyncFn を付けられない。
   * 変数のシャドーイングを考慮して、関数定義ごとにスコープを積む。
   *
   * 同期な無名関数の代入も記録する。記録しないと、内側のスコープで同名の変数へ
   * 同期な無名関数を代入しても外側の非同期な代入が見えてしまう。
   */
  funcObjVarScopes: Map<string, boolean>[]
}

/**
 * AST を走査して関数ごとに asyncFn が必要かどうかを確認し、必要なら書き換える。
 *
 * @param node 走査対象の AST
 * @param funclist 関数一覧(呼び出し先が非同期かどうかの判定に使う)
 * @returns AST を書き換えたら true。呼び出し側は false になるまで繰り返すこと
 */
export function checkAsyncFn (node: Ast, funclist: FuncList): boolean {
  const ctx: CheckContext = { modified: false, funcObjVarScopes: [new Map()] }
  checkNode(node, funclist, ctx)
  return ctx.modified
}

/**
 * 変数名が非同期の無名関数を指しているかどうかを、内側のスコープから順に調べる。
 * 見つかった時点で打ち切るので、内側の代入が外側の代入をシャドーイングする。
 */
function isAsyncVar (ctx: CheckContext, name: string): boolean {
  for (let i = ctx.funcObjVarScopes.length - 1; i >= 0; i--) {
    const asyncFn = ctx.funcObjVarScopes[i].get(name)
    if (asyncFn !== undefined) { return asyncFn }
  }
  return false
}

/**
 * 変数へ無名関数を代入していたら、現在のスコープに覚えておく
 * (`let` と `def_local_var` はどちらも blocks[0] が代入する値)
 *
 * 無名関数以外の代入は記録しない。`F=Gの参照` のような代入まで同期扱いにすると、
 * 逆に await の付け漏れという、より悪い誤りになるため。
 */
function checkFuncObjVarAssign (node: Ast, ctx: CheckContext): void {
  const letNode = node as AstLet
  if (!letNode.name) { return }
  const value = (letNode.blocks || [])[0]
  if (!value || value.type !== 'func_obj') { return }
  const scope = ctx.funcObjVarScopes[ctx.funcObjVarScopes.length - 1]
  scope.set(letNode.name, !!(value as AstDefFunc).asyncFn)
}

/**
 * ノードが非同期処理を含むかどうかを返す(必要に応じて AST を書き換える)
 * @returns 非同期処理を含むなら true
 */
function checkNode (node: Ast, funclist: FuncList, ctx: CheckContext): boolean {
  if (!node) { return false }
  // 関数定義があれば関数
  if (node.type === 'def_func' || node.type === 'def_test' || node.type === 'func_obj') {
    const def: AstDefFunc = node as AstDefFunc
    // 既に非同期と分かっていても中身の走査は省略しない。
    // 途中で打ち切ると、それより後ろにある呼び出しに asyncFn が付かなくなる
    ctx.funcObjVarScopes.push(new Map())
    let isAsyncFn = false
    for (const n of def.blocks) {
      if (checkNode(n, funclist, ctx)) { isAsyncFn = true }
    }
    ctx.funcObjVarScopes.pop()
    // 関数定義の中身が非同期であるならasyncFnをtrueに変更する
    if (isAsyncFn && !def.asyncFn) {
      def.asyncFn = true
      def.meta.asyncFn = true
      ctx.modified = true
    }
    if (!def.asyncFn) { return false }
    // 後から判明した非同期情報を、呼び出し側の判定に使う関数一覧にも反映する
    const func = funclist.get(def.name)
    if (func && !func.asyncFn) {
      func.asyncFn = true
      ctx.modified = true
    }
    return true
  }
  // 変数へ代入された無名関数を覚えておく(呼び出し側の判定に使う)
  if (node.type === 'let' || node.type === 'def_local_var') {
    let containsAsync = false
    for (const n of (node as AstBlocks).blocks) {
      if (checkNode(n, funclist, ctx)) { containsAsync = true }
    }
    checkFuncObjVarAssign(node, ctx)
    return containsAsync
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
    // (2つ目以降の引数にも asyncFn が必要なので、最初の1つで打ち切らない)
    if (callNode.blocks) {
      let hasAsyncArg = false
      for (const n of callNode.blocks) {
        if (checkNode(n, funclist, ctx)) { hasAsyncArg = true }
      }
      if (hasAsyncArg) {
        callNode.asyncFn = true
        ctx.modified = true
        return true
      }
    }
    // さらに、関数のリンクを調べる
    const func = funclist.get(callNode.name)
    if (func && func.asyncFn) {
      callNode.asyncFn = true
      ctx.modified = true
      return true
    }
    // 非同期の無名関数を保持している変数の呼び出しかどうかを調べる
    if (isAsyncVar(ctx, callNode.name)) {
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
