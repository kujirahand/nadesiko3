import assert from 'assert'
import { NakoImportError } from '../../src/nako_errors'

navigator.exportWNako3 = true
const WebNakoCompiler = require('../../src/wnako3')
navigator.exportWNako3 = false

/**
 * @param {'nako3' | 'js'} ext
 * @param {number} delayMs
 * @param {string} content
 */
const buildURL = (ext, delayMs, content) => `http://localhost:9876/custom/echo.${ext}?delay_ms=${delayMs}&content=${encodeURIComponent(content)}`

describe('require_test', () => {
    it('なでしこ言語ファイルの取り込み', async () => {
        const nako = new WebNakoCompiler()
        const code = `!「${buildURL('nako3', 0, 'A=100')}」を取り込む。\nAを表示`
        await nako.loadDependencies(code, 'main.nako3')
        assert.strictEqual(nako.runReset(code, 'main.nako3').log, '100')
    })
    it('循環インポート', async () => {
        const nako = new WebNakoCompiler()
        const code = `!「http://localhost:9876/custom/cyclic_import_1.nako3」を取り込む。\nAを表示\nBを表示`
        await nako.loadDependencies(code, 'main.nako3')
        assert.strictEqual(nako.runReset(code, 'main.nako3').log, '100\n200')
    })
    it('並列ダウンロード', async () => {
        // 遅延が100msのファイルを2つ取り込んで、取り込みにかかる時間が200ms未満であることを確認する。
        const nako = new WebNakoCompiler()
        const fileA = buildURL('nako3', 100, 'A=100')
        const fileB = buildURL('nako3', 100, 'B=200')
        const startTime = Date.now()
        const code = `!「${fileA}」を取り込む。!「${fileB}」を取り込む。\nAを表示\nBを表示`
        await nako.loadDependencies(code, 'main.nako3')
        assert(Date.now() - startTime < 200)
        assert.strictEqual(nako.runReset(code, 'main.nako3').log, '100\n200')
    })
    it('プラグインの取り込み', async () => {
        const nako = new WebNakoCompiler()
        navigator.nako3 = nako
        const code =
            `!「${buildURL('js', 0, `navigator.nako3.addPluginObject('PluginRequireTest', { requiretest: { type: 'var', value: 100 } })`)}」を取り込む。\n` +
            'requiretestを表示\n'
        await nako.loadDependencies(code, 'main.nako3')
        assert.strictEqual(nako.runReset(code, 'main.nako3').log, '100')
    })
    it('存在しないファイルの指定', async () => {
        const nako = new WebNakoCompiler()
        const code = `!「${buildURL('nako3', 50, 'A=100')}」を取り込む。\n!「http://localhost:9876/custom/non_existent_file.nako3」を取り込む。`
        let ok = false
        try {
            await nako.loadDependencies(code, 'main.nako3')
        } catch (e) {
            assert(e instanceof NakoImportError)
            assert.strictEqual(e.line, 1)
            ok = true
        }
        assert(ok)
    })
})
