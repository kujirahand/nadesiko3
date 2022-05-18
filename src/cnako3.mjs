#!/usr/bin/env node
/**
 * コマンドライン版のなでしこ3
 */
import { CNako3 } from './cnako3mod.mjs';
// メイン
(async () => {
    const cnako3 = new CNako3();
    await cnako3.execCommand();
})();
