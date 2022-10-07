#!/usr/bin/env node
/**
 * コマンドライン版のなでしこ3
 */
import { CNako3 } from './cnako3mod.mjs';
// メイン
(async () => {
    const cnako3 = new CNako3();
    try {
        await cnako3.execCommand();
    }
    catch (err) {
        // 何かしらのエラーがあればコンソールに返す
        // ここで出るエラーは致命的なエラー
        console.error('[cnako3のエラー]', err);
    }
})();
