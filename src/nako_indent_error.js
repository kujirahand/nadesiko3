const nakoVersion = require("./nako_version")

class NakoIndentError extends Error {
    /**
     * @param {string} msg
     * @param {number} line
     * @param {string} fname
     */
    constructor(msg, line, fname) {
        const fname2 = fname === undefined ? '' : fname
        super(`[インデントエラー]${fname2}(${line + 1}行目): ${msg}\n` +
              `[バージョン] ${nakoVersion.version}`)
    }
}

module.exports = NakoIndentError
