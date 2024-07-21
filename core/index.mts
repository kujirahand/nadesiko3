import coreVersion from './src/nako_core_version.mjs'
import { NakoCompiler, newCompilerOptions } from './src/nako3.mjs'
import { NakoLogger } from './src/nako_logger.mjs'
import { NakoError, NakoRuntimeError, NakoImportError } from './src/nako_errors.mjs'
import { NakoParser } from './src/nako_parser3.mjs'
import { NakoPrepare } from './src/nako_prepare.mjs'
import { NakoGen, NakoGenOptions } from './src/nako_gen.mjs'
import { NakoGlobal } from './src/nako_global.mjs'

export default {
  // version
  version: coreVersion,
  // compiler
  NakoCompiler,
  newCompilerOptions,
  // loggger
  NakoLogger,
  // error
  NakoError,
  NakoRuntimeError,
  NakoImportError,
  // tools etc..
  NakoParser,
  NakoPrepare,
  NakoGen,
  NakoGenOptions,
  NakoGlobal
}
