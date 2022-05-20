// wnako3 - nadesiko for web browser
import { WebNakoCompiler } from './wnako3mod.mjs'

// ブラウザから取り込まれる時 navigator.nako3 になでしこを登録
if ((typeof navigator) === 'object' && !(navigator as any).exportWNako3) {
  const wnako3 = (navigator as any).nako3 = new WebNakoCompiler()
  window.addEventListener('DOMContentLoaded', (e) => {
    const isAutoRun = wnako3.checkScriptTagParam()
    if (isAutoRun) { wnako3.runNakoScript() }
  }, false)
}
