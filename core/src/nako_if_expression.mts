/** もし式の分岐に関する共通の検証。 (#2591) */
import { Ast, AstBlocks, AstCallFunc, NodeType } from './nako_ast.mjs'
import { NakoSyntaxError } from './nako_errors.mjs'

const expressionTypes = new Set<NodeType>([
  'number', 'bigint', 'bool', 'null', 'string', 'word', 'variable',
  'op', 'calc', 'not', 'and', 'or', 'eq', 'func', 'calc_func',
  'call_value', 'func_pointer', 'func_obj', 'json_array', 'json_obj',
  'ref_array', 'ref_prop', 'ref_array_value', 'renbun', 'if_expr'
])
const statementTypes = new Set<NodeType>([
  'let', 'let_array', 'let_prop', 'def_local_var', 'def_local_varlist', 'inc'
])

export function validateIfExpressionStatement(node: Ast): void {
  if (!expressionTypes.has(node.type) && !statementTypes.has(node.type)) {
    throw NakoSyntaxError.fromNode('「もし」式の分岐には代入・関数呼び出し・値の式を書いてください。', node)
  }
}

/** 構文の種類と、関数が戻り値を持つかを同じ場所で検証する。 */
export function validateIfExpressionBranch(block: AstBlocks,
  findFunc: (name: string) => { return_none?: boolean } | undefined): void {
  for (const node of block.blocks) { validateIfExpressionStatement(node) }
  const last = block.blocks[block.blocks.length - 1]
  if (!last || !expressionTypes.has(last.type) ||
    ((last.type === 'func' || last.type === 'calc_func') && findFunc((last as AstCallFunc).name)?.return_none)) {
    throw NakoSyntaxError.fromNode('「もし」式の分岐の末尾には値を返す式が必要です。', last || block)
  }
}
