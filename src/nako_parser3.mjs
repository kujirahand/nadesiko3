/**
 * nadesiko v3 parser
 */
import { opPriority, keizokuJosi, operatorList } from './nako_parser_const.mjs';
import { NakoParserBase } from './nako_parser_base.mjs';
import { NakoSyntaxError } from './nako_errors.mjs';
import { NakoLexer } from './nako_lexer.mjs';
import { NewEmptyToken } from './nako_types.mjs';
/**
 * 構文解析を行うクラス
 */
export class NakoParser extends NakoParserBase {
    /**
     * 構文解析を実行する
     * @param {TokenWithSourceMap[]} tokens 字句解析済みのトークンの配列
     * @param {string} filename 解析対象のモジュール名
     * @return {Ast} AST(構文木)
     */
    parse(tokens, filename) {
        this.reset();
        this.tokens = tokens;
        this.modName = NakoLexer.filenameToModName(filename);
        this.modList.push(this.modName);
        // 解析開始
        return this.startParser();
    }
    /** パーサーの一番最初に呼び出す構文規則 */
    startParser() {
        const b = this.ySentenceList();
        const c = this.get();
        if (c && c.type !== 'eof') {
            this.logger.debug(`構文解析でエラー。${this.nodeToStr(c, { depth: 1 }, true)}の使い方が間違っています。`, c);
            throw NakoSyntaxError.fromNode(`構文解析でエラー。${this.nodeToStr(c, { depth: 1 }, false)}の使い方が間違っています。`, c);
        }
        return b;
    }
    /** 複数文を返す */
    ySentenceList() {
        const blocks = [];
        let line = -1;
        const map = this.peekSourceMap();
        while (!this.isEOF()) {
            const n = this.ySentence();
            if (!n) {
                break;
            }
            blocks.push(n);
            if (line < 0) {
                line = n.line;
            }
        }
        if (blocks.length === 0) {
            const token = this.peek() || this.tokens[0];
            this.logger.debug('構文解析に失敗:' + this.nodeToStr(this.peek(), { depth: 1 }, true), token);
            throw NakoSyntaxError.fromNode('構文解析に失敗:' + this.nodeToStr(this.peek(), { depth: 1 }, false), token);
        }
        return { type: 'block', block: blocks, ...map, end: this.peekSourceMap(), genMode: this.genMode };
    }
    yEOL() {
        // 行末のチェック #1009
        const eol = this.get();
        if (!eol) {
            return null;
        }
        // 余剰スタックの確認
        if (this.stack.length > 0) {
            /** 余剰スタックのレポートを作る */
            const words = [];
            this.stack.forEach((t) => {
                let w = this.nodeToStr(t, { depth: 1 }, false);
                if (t.josi) {
                    w += t.josi;
                }
                words.push(w);
            });
            const desc = words.join(',');
            // 最近使った関数の使い方レポートを作る #1093
            let descFunc = '';
            const chA = 'A'.charCodeAt(0);
            for (const f of this.recentlyCalledFunc) {
                descFunc += ' - ';
                let no = 0;
                const josiA = f.josi;
                if (josiA) {
                    for (const arg of josiA) {
                        const ch = String.fromCharCode(chA + no);
                        descFunc += ch;
                        if (arg.length === 1) {
                            descFunc += arg[0];
                        }
                        else {
                            descFunc += `(${arg.join('|')})`;
                        }
                        no++;
                    }
                }
                descFunc += f.name + '\n';
            }
            throw NakoSyntaxError.fromNode(`未解決の単語があります: [${desc}]\n次の命令の可能性があります:\n${descFunc}`, eol);
        }
        this.recentlyCalledFunc = [];
        return eol;
    }
    /** @returns {Ast | null} */
    ySentence() {
        const map = this.peekSourceMap();
        // 最初の語句が決まっている構文
        if (this.check('eol')) {
            return this.yEOL();
        }
        if (this.check('もし')) {
            return this.yIF();
        }
        if (this.check('後判定')) {
            return this.yAtohantei();
        }
        if (this.check('エラー監視')) {
            return this.yTryExcept();
        }
        if (this.check('逐次実行')) {
            return this.yTikuji();
        }
        if (this.accept(['抜ける'])) {
            return { type: 'break', josi: '', ...map, end: this.peekSourceMap() };
        }
        if (this.accept(['続ける'])) {
            return { type: 'continue', josi: '', ...map, end: this.peekSourceMap() };
        }
        if (this.accept(['require', 'string', '取込'])) {
            return this.yRequire();
        }
        if (this.accept(['not', '非同期モード'])) {
            return this.yASyncMode();
        }
        if (this.accept(['not', 'DNCLモード'])) {
            return this.yDNCLMode();
        }
        if (this.accept(['not', 'string', 'モード設定'])) {
            return this.ySetGenMode(this.y[1].value);
        }
        // 関数呼び出し演算子
        if (this.check2(['func', '←'])) {
            return this.yCallOp();
        }
        if (this.check2(['func', 'eq'])) {
            const word = this.get() || NewEmptyToken('?', '?', map.line, map.file || '');
            throw NakoSyntaxError.fromNode(`関数『${word.value}』に代入できません。『←』を使ってください。`, word);
        }
        // 先読みして初めて確定する構文
        if (this.accept([this.ySpeedMode])) {
            return this.y[0];
        }
        if (this.accept([this.yPerformanceMonitor])) {
            return this.y[0];
        }
        if (this.accept([this.yLet])) {
            return this.y[0];
        }
        if (this.accept([this.yDefTest])) {
            return this.y[0];
        }
        if (this.accept([this.yDefFunc])) {
            return this.y[0];
        }
        // 関数呼び出しの他、各種構文の実装
        if (this.accept([this.yCall])) {
            const c1 = this.y[0];
            if (c1.josi === 'して') { // 連文をblockとして接続する(もし構文、逐次実行構文などのため)
                const c2 = this.ySentence();
                if (c2 !== null) {
                    return {
                        type: 'block',
                        block: [c1, c2],
                        josi: c2.josi,
                        ...map,
                        end: this.peekSourceMap()
                    };
                }
            }
            return c1;
        }
        return null;
    }
    /** @returns {Ast} */
    yASyncMode() {
        const map = this.peekSourceMap();
        this.genMode = '非同期モード';
        return { type: 'eol', ...map, end: this.peekSourceMap() };
    }
    /** @returns {Ast} */
    yDNCLMode() {
        const map = this.peekSourceMap();
        // 配列インデックスは1から
        this.arrayIndexFrom = 1;
        // 配列アクセスをJSと逆順で指定する
        this.flagReverseArrayIndex = true;
        // 配列代入時自動で初期化チェックする
        this.flagCheckArrayInit = true;
        return { type: 'eol', ...map, end: this.peekSourceMap() };
    }
    /** @returns {Ast} */
    ySetGenMode(mode) {
        const map = this.peekSourceMap();
        this.genMode = mode;
        return { type: 'eol', ...map, end: this.peekSourceMap() };
    }
    /** @returns {Ast} */
    yRequire() {
        const nameToken = this.y[1];
        const filename = nameToken.value;
        const modName = NakoLexer.filenameToModName(filename);
        if (this.modList.indexOf(modName) < 0) {
            // 優先度が最も高いのは modList[0]
            // [memo] モジュールの検索優先度は、下に書くほど高くなる
            const modSelf = this.modList.shift();
            if (modSelf) {
                this.modList.unshift(modName);
                this.modList.unshift(modSelf);
            }
        }
        return {
            type: 'require',
            value: filename,
            josi: '',
            ...this.peekSourceMap(),
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast} */
    yBlock() {
        const map = this.peekSourceMap();
        const blocks = [];
        if (this.check('ここから')) {
            this.get();
        }
        while (!this.isEOF()) {
            if (this.checkTypes(['違えば', 'ここまで', 'エラー'])) {
                break;
            }
            if (!this.accept([this.ySentence])) {
                break;
            }
            blocks.push(this.y[0]);
        }
        return { type: 'block', block: blocks, ...map, end: this.peekSourceMap() };
    }
    yDefFuncReadArgs() {
        if (!this.check('(')) {
            return null;
        }
        const a = [];
        this.get(); // skip '('
        while (!this.isEOF()) {
            if (this.check(')')) {
                this.get(); // skip ''
                break;
            }
            const t = this.get();
            if (t) {
                a.push(t);
            }
            if (this.check('comma')) {
                this.get();
            }
        }
        return a;
    }
    /** @returns {Ast | null} */
    yDefTest() {
        return this.yDef('def_test');
    }
    /** @returns {Ast | null} */
    yDefFunc() {
        return this.yDef('def_func');
    }
    /**
     * @param {string} type
     * @returns {Ast | null}
     */
    yDef(type) {
        if (!this.check(type)) {
            return null;
        }
        const map = this.peekSourceMap();
        const def = this.get(); // ●
        if (!def) {
            return null;
        }
        let defArgs = [];
        if (this.check('(')) {
            defArgs = this.yDefFuncReadArgs() || [];
        } // // lexerでも解析しているが再度詳しく
        const funcName = this.get();
        if (!funcName || funcName.type !== 'func') {
            this.logger.debug(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, true) + 'の宣言でエラー。', funcName);
            throw NakoSyntaxError.fromNode(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, false) + 'の宣言でエラー。', def);
        }
        if (this.check('(')) {
            // 関数引数の二重定義
            if (defArgs.length > 0) {
                this.logger.debug(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, true) + 'の宣言で、引数定義は名前の前か後に一度だけ可能です。', funcName);
                throw NakoSyntaxError.fromNode(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, false) + 'の宣言で、引数定義は名前の前か後に一度だけ可能です。', funcName);
            }
            defArgs = this.yDefFuncReadArgs() || [];
        }
        if (this.check('とは')) {
            this.get();
        }
        let block = null;
        let multiline = false;
        let asyncFn = false;
        if (this.check('ここから')) {
            multiline = true;
        }
        if (this.check('eol')) {
            multiline = true;
        }
        try {
            this.funcLevel++;
            this.usedAsyncFn = false;
            // ローカル変数を生成
            const backupLocalvars = this.localvars;
            this.localvars = { 'それ': { type: 'var', value: '' } };
            if (multiline) {
                this.saveStack();
                // 関数の引数をローカル変数として登録する
                for (const arg of defArgs) {
                    const fnName = (arg.value) ? arg.value + '' : '';
                    this.localvars[fnName] = { 'type': 'var', 'value': '' };
                }
                block = this.yBlock();
                if (this.check('ここまで')) {
                    this.get();
                }
                else {
                    throw NakoSyntaxError.fromNode('『ここまで』がありません。関数定義の末尾に必要です。', def);
                }
                this.loadStack();
            }
            else {
                this.saveStack();
                block = this.ySentence();
                this.loadStack();
            }
            this.funcLevel--;
            asyncFn = this.usedAsyncFn;
            this.localvars = backupLocalvars;
        }
        catch (err) {
            this.logger.debug(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, true) +
                'の定義で以下のエラーがありました。\n' + err.message, def);
            throw NakoSyntaxError.fromNode(this.nodeToStr(funcName, { depth: 0, typeName: '関数' }, false) +
                'の定義で以下のエラーがありました。\n' + err.message, def);
        }
        return {
            type,
            name: funcName,
            args: defArgs,
            block: block || [],
            asyncFn,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yIFCond() {
        const map = this.peekSourceMap();
        let a = this.yGetArg();
        if (!a) {
            return null;
        }
        // console.log('yIFCond=', a, this.peek())
        // チェック : AがBならば
        if (a.josi === 'が') {
            const tmpI = this.index;
            const b = this.yGetArg();
            const naraba = this.get();
            if ((b && b.type !== 'func') && (naraba && naraba.type === 'ならば')) {
                return {
                    type: 'op',
                    operator: (naraba.value === 'でなければ') ? 'noteq' : 'eq',
                    left: a,
                    right: b,
                    josi: '',
                    ...map,
                    end: this.peekSourceMap()
                };
            }
            this.index = tmpI;
        }
        if (a.josi !== '') {
            // もし文で関数呼び出しがある場合
            this.stack.push(a);
            a = this.yCall();
        }
        // (ならば|でなければ)を確認
        if (!this.check('ならば')) {
            const smap = a || { type: '?', ...map };
            this.logger.debug('もし文で『ならば』がないか、条件が複雑過ぎます。' + this.nodeToStr(this.peek(), { depth: 1 }, false) + 'の直前に『ならば』を書いてください。', smap);
            throw NakoSyntaxError.fromNode('もし文で『ならば』がないか、条件が複雑過ぎます。' + this.nodeToStr(this.peek(), { depth: 1 }, false) + 'の直前に『ならば』を書いてください。', smap);
        }
        const naraba = this.get();
        if (naraba && naraba.value === 'でなければ') {
            a = {
                type: 'not',
                value: a,
                josi: '',
                ...map,
                end: this.peekSourceMap()
            };
        }
        return a;
    }
    /** @returns {Ast | null} */
    yIF() {
        const map = this.peekSourceMap();
        if (!this.check('もし')) {
            return null;
        }
        const mosi = this.get(); // skip もし
        if (mosi == null) {
            return null;
        }
        while (this.check('comma')) {
            this.get();
        } // skip comma
        let cond = null;
        try {
            cond = this.yIFCond();
        }
        catch (err) {
            throw NakoSyntaxError.fromNode('『もし』文の条件で次のエラーがあります。\n' + err.message, mosi);
        }
        if (cond === null) {
            throw NakoSyntaxError.fromNode('『もし』文で条件の指定が空です。', mosi);
        }
        let trueBlock = null;
        let falseBlock = null;
        let tanbun = false;
        // True Block
        if (this.check('eol')) {
            trueBlock = this.yBlock();
        }
        else {
            trueBlock = this.ySentence();
            tanbun = true;
        }
        // skip EOL
        while (this.check('eol')) {
            this.get();
        }
        // Flase Block
        if (this.check('違えば')) {
            this.get(); // skip 違えば
            while (this.check('comma')) {
                this.get();
            }
            if (this.check('eol')) {
                falseBlock = this.yBlock();
            }
            else {
                falseBlock = this.ySentence();
                tanbun = true;
            }
        }
        if (tanbun === false) {
            if (this.check('ここまで')) {
                this.get();
            }
            else {
                throw NakoSyntaxError.fromNode('『もし』文で『ここまで』がありません。', mosi);
            }
        }
        return {
            type: 'if',
            expr: cond || [],
            block: trueBlock || [],
            false_block: falseBlock || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    ySpeedMode() {
        const map = this.peekSourceMap();
        if (!this.check2(['string', '実行速度優先'])) {
            return null;
        }
        const optionNode = this.get();
        this.get();
        let val = '';
        if (optionNode && optionNode.value) {
            val = optionNode.value;
        }
        else {
            return null;
        }
        const options = { 行番号無し: false, 暗黙の型変換無し: false, 強制ピュア: false, それ無効: false };
        for (const name of val.split('/')) {
            // 全て有効化
            if (name === '全て') {
                for (const k of Object.keys(options)) {
                    options[k] = true;
                }
                break;
            }
            // 個別に有効化
            if (Object.keys(options).includes(name)) {
                options[name] = true;
            }
            else {
                // 互換性を考えて、警告に留める。
                this.logger.warn(`実行速度優先文のオプション『${name}』は存在しません。`, optionNode);
            }
        }
        let multiline = false;
        if (this.check('ここから')) {
            this.get();
            multiline = true;
        }
        else if (this.check('eol')) {
            multiline = true;
        }
        let block = null;
        if (multiline) {
            block = this.yBlock();
            if (this.check('ここまで')) {
                this.get();
            }
        }
        else {
            block = this.ySentence();
        }
        return {
            type: 'speed_mode',
            options,
            block: block || [],
            josi: '',
            ...map
        };
    }
    yPerformanceMonitor() {
        const map = this.peekSourceMap();
        if (!this.check2(['string', 'パフォーマンスモニタ適用'])) {
            return null;
        }
        const optionNode = this.get();
        if (!optionNode) {
            return null;
        }
        this.get();
        const options = { ユーザ関数: false, システム関数本体: false, システム関数: false };
        for (const name of optionNode.value.split('/')) {
            // 全て有効化
            if (name === '全て') {
                for (const k of Object.keys(options)) {
                    options[k] = true;
                }
                break;
            }
            // 個別に有効化
            if (Object.keys(options).includes(name)) {
                options[name] = true;
            }
            else {
                // 互換性を考えて、警告に留める。
                this.logger.warn(`パフォーマンスモニタ適用文のオプション『${name}』は存在しません。`, optionNode);
            }
        }
        let multiline = false;
        if (this.check('ここから')) {
            this.get();
            multiline = true;
        }
        else if (this.check('eol')) {
            multiline = true;
        }
        let block = null;
        if (multiline) {
            block = this.yBlock();
            if (this.check('ここまで')) {
                this.get();
            }
        }
        else {
            block = this.ySentence();
        }
        return {
            type: 'performance_monitor',
            options,
            block: block || [],
            josi: '',
            ...map
        };
    }
    /** (非推奨) 「逐次実行」構文 @returns {Ast | null} */
    yTikuji() {
        const map = this.peekSourceMap();
        if (!this.check('逐次実行')) {
            return null;
        }
        const tikuji = this.getCur(); // skip 逐次実行
        this.logger.warn('『逐次実行』構文の使用は非推奨になりました(https://nadesi.com/v3/doc/go.php?944)。', tikuji);
        const blocks = [];
        let errorBlock = null;
        if (!tikuji || !this.check('eol')) {
            throw NakoSyntaxError.fromNode('『逐次実行』の直後は改行が必要です。', tikuji);
        }
        // ブロックを読む
        for (;;) {
            if (this.check('ここまで')) {
                break;
            }
            if (this.check('eol')) {
                this.get(); // skip EOL
                continue;
            }
            if (this.check2(['エラー', 'ならば'])) {
                this.get(); // skip エラー
                this.get(); // skip ならば
                errorBlock = this.yBlock();
                break;
            }
            let block = null;
            // 「先に」「次に」句はブロック宣言 #717 (ただしブロック以外も可能)
            if (this.check('先に') || this.check('次に')) {
                const tugini = this.get(); // skip 先に | 次に
                if (this.check('comma')) {
                    this.get();
                }
                if (this.check('eol')) { // block
                    block = this.yBlock();
                    if (!this.check('ここまで')) {
                        let tuginiType = '次に';
                        if (tugini != null) {
                            tuginiType = tugini.type;
                        }
                        throw NakoSyntaxError.fromNode(`『${tuginiType}』...『ここまで』を対応させてください。`, map);
                    }
                    this.get(); // skip 'ここまで'
                }
                else { // line
                    block = this.ySentence();
                }
            }
            else {
                block = this.ySentence();
            }
            // add block
            if (block != null) {
                blocks.push(block);
            }
        }
        if (!this.check('ここまで')) {
            console.log(blocks, this.peek());
            throw NakoSyntaxError.fromNode('『逐次実行』...『ここまで』を対応させてください。', tikuji);
        }
        this.get(); // skip 'ここまで'
        return {
            type: 'tikuji',
            blocks: blocks || [],
            errorBlock: errorBlock || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /**
     * 1つ目の値を与え、その後に続く計算式を取得し、優先規則に沿って並び替えして戻す
     * @param {Ast} firstValue
     */
    yGetArgOperator(firstValue) {
        const args = [firstValue];
        while (!this.isEOF()) {
            // 演算子がある？
            let op = this.peek();
            if (op && opPriority[op.type]) {
                op = this.getCur();
                args.push(op);
                // 演算子後の値を取得
                const v = this.yValue();
                if (v === null) {
                    throw NakoSyntaxError.fromNode(`計算式で演算子『${op.value}』後に値がありません`, firstValue);
                }
                args.push(v);
                continue;
            }
            break;
        }
        if (args.length === 0) {
            return null;
        }
        if (args.length === 1) {
            return args[0];
        }
        return this.infixToAST(args);
    }
    yGetArg() {
        // 値を一つ読む
        const value1 = this.yValue();
        if (value1 === null) {
            return null;
        }
        // 計算式がある場合を考慮
        return this.yGetArgOperator(value1);
    }
    infixToPolish(list) {
        // 中間記法から逆ポーランドに変換
        const priority = (t) => {
            if (opPriority[t.type]) {
                return opPriority[t.type];
            }
            return 10;
        };
        const stack = [];
        const polish = [];
        while (list.length > 0) {
            const t = list.shift();
            if (!t) {
                break;
            }
            while (stack.length > 0) { // 優先順位を見て移動する
                const sTop = stack[stack.length - 1];
                if (priority(t) > priority(sTop)) {
                    break;
                }
                const tpop = stack.pop();
                if (!tpop) {
                    this.logger.error('計算式に間違いがあります。', t);
                    break;
                }
                polish.push(tpop);
            }
            stack.push(t);
        }
        // 残った要素を積み替える
        while (stack.length > 0) {
            const t = stack.pop();
            if (t) {
                polish.push(t);
            }
        }
        return polish;
    }
    /** @returns {Ast | null} */
    infixToAST(list) {
        if (list.length === 0) {
            return null;
        }
        // 逆ポーランドを構文木に
        const josi = list[list.length - 1].josi;
        const node = list[list.length - 1];
        const polish = this.infixToPolish(list);
        /** @type {Ast[]} */
        const stack = [];
        for (const t of polish) {
            if (!opPriority[t.type]) { // 演算子ではない
                stack.push(t);
                continue;
            }
            const b = stack.pop();
            const a = stack.pop();
            if (a === undefined || b === undefined) {
                this.logger.debug('--- 計算式(逆ポーランド) ---\n' + JSON.stringify(polish));
                throw NakoSyntaxError.fromNode('計算式でエラー', node);
            }
            /** @type {Ast} */
            const op = {
                type: 'op',
                operator: t.type,
                left: a,
                right: b,
                josi: josi,
                startOffset: a.startOffset,
                endOffset: a.endOffset,
                line: a.line,
                column: a.column,
                file: a.file
            };
            stack.push(op);
        }
        const ans = stack.pop();
        if (!ans) {
            return null;
        }
        return ans;
    }
    yGetArgParen(y) {
        let isClose = false;
        const si = this.stack.length;
        while (!this.isEOF()) {
            if (this.check(')')) {
                isClose = true;
                break;
            }
            const v = this.yGetArg();
            if (v) {
                this.pushStack(v);
                if (this.check('comma')) {
                    this.get();
                }
                continue;
            }
            break;
        }
        if (!isClose) {
            throw NakoSyntaxError.fromNode(`C風関数『${y[0].value}』でカッコが閉じていません`, y[0]);
        }
        const a = [];
        while (si < this.stack.length) {
            const v = this.popStack();
            if (v) {
                a.unshift(v);
            }
        }
        return a;
    }
    /** @returns {Ast | null} */
    yRepeatTime() {
        const map = this.peekSourceMap();
        if (!this.check('回')) {
            return null;
        }
        this.get(); // skip '回'
        if (this.check('comma')) {
            this.get();
        } // skip comma
        if (this.check('繰返')) {
            this.get();
        } // skip 'N回、繰り返す' (#924)
        let num = this.popStack([]);
        let multiline = false;
        let block = null;
        if (num === null) {
            num = { type: 'word', value: 'それ', josi: '', ...map, end: this.peekSourceMap() };
        }
        if (this.check('comma')) {
            this.get();
        }
        if (this.check('ここから')) {
            this.get();
            multiline = true;
        }
        else if (this.check('eol')) {
            multiline = true;
        }
        if (multiline) { // multiline
            block = this.yBlock();
            if (this.check('ここまで')) {
                this.get();
            }
            else {
                throw NakoSyntaxError.fromNode('『ここまで』がありません。『回』...『ここまで』を対応させてください。', map);
            }
        }
        else {
            // singleline
            block = this.ySentence();
        }
        return {
            type: 'repeat_times',
            value: num,
            block: block || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yWhile() {
        const map = this.peekSourceMap();
        if (!this.check('間')) {
            return null;
        }
        this.get(); // skip '間'
        while (this.check('comma')) {
            this.get();
        } // skip ','
        if (this.check('繰返')) {
            this.get();
        } // skip '繰り返す' #927
        const cond = this.popStack();
        if (cond === null) {
            throw NakoSyntaxError.fromNode('『間』で条件がありません。', map);
        }
        if (this.check('comma')) {
            this.get();
        }
        if (!this.checkTypes(['ここから', 'eol'])) {
            throw NakoSyntaxError.fromNode('『間』の直後は改行が必要です', map);
        }
        const block = this.yBlock();
        if (this.check('ここまで')) {
            this.get();
        }
        return {
            type: 'while',
            cond,
            block,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yAtohantei() {
        const map = this.peekSourceMap();
        if (this.check('後判定')) {
            this.get();
        } // skip 後判定
        if (this.check('繰返')) {
            this.get();
        } // skip 繰り返す
        if (this.check('ここから')) {
            this.get();
        }
        const block = this.yBlock();
        if (this.check('ここまで')) {
            this.get();
        }
        if (this.check('comma')) {
            this.get();
        }
        let cond = this.yGetArg(); // 条件
        let bUntil = false;
        const t = this.peek();
        if (t && t.value === 'なる' && (t.josi === 'まで' || t.josi === 'までの')) {
            this.get(); // skip なるまで
            bUntil = true;
        }
        if (this.check('間')) {
            this.get();
        } // skip 間
        if (bUntil) { // 条件を反転する
            cond = {
                type: 'not',
                value: cond,
                josi: '',
                ...map,
                end: this.peekSourceMap()
            };
        }
        return {
            type: 'atohantei',
            cond: cond || [],
            block,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yFor() {
        const map = this.peekSourceMap();
        if (this.check('繰返') || this.check('増繰返') || this.check('減繰返')) {
            // pass
        }
        else {
            return null;
        }
        const kurikaesu = this.getCur(); // skip 繰り返す
        // スタックに(増や|減ら)してがある？
        const incdec = this.stack.pop();
        if (incdec) {
            if (incdec.type === 'word' && (incdec.value === '増' || incdec.value === '減')) {
                kurikaesu.type = incdec.value + kurikaesu.type;
                // ↑ typeを増繰返 | 減繰返 に変換
            }
            else {
                // 普通の繰り返しの場合
                this.stack.push(incdec); // 違ったので改めて追加
            }
        }
        let vInc = null;
        if (kurikaesu.type === '増繰返' || kurikaesu.type === '減繰返') {
            vInc = this.popStack(['ずつ']);
        }
        const vTo = this.popStack(['まで']);
        const vFrom = this.popStack(['から']);
        const word = this.popStack(['を', 'で']);
        if (vFrom === null || vTo === null) {
            throw NakoSyntaxError.fromNode('『繰り返す』文でAからBまでの指定がありません。', kurikaesu);
        }
        if (this.check('comma')) {
            this.get();
        } // skip comma
        let multiline = false;
        if (this.check('ここから')) {
            multiline = true;
            this.get();
        }
        else if (this.check('eol')) {
            multiline = true;
            this.get();
        }
        let block = null;
        if (multiline) {
            block = this.yBlock();
            if (this.check('ここまで')) {
                this.get();
            }
            else {
                throw NakoSyntaxError.fromNode('『ここまで』がありません。『繰り返す』...『ここまで』を対応させてください。', map);
            }
        }
        else {
            block = this.ySentence();
        }
        return {
            type: 'for',
            from: vFrom,
            to: vTo,
            inc: vInc,
            word: word,
            block: block || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yReturn() {
        const map = this.peekSourceMap();
        if (!this.check('戻る')) {
            return null;
        }
        const modoru = this.get(); // skip '戻る'
        const v = this.popStack(['で', 'を']);
        if (this.stack.length > 0) {
            throw NakoSyntaxError.fromNode('『戻』文の直前に未解決の引数があります。『(式)を戻す』のように式をカッコで括ってください。', map);
        }
        return {
            type: 'return',
            value: v,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yForEach() {
        const map = this.peekSourceMap();
        if (!this.check('反復')) {
            return null;
        }
        this.get(); // skip '反復'
        while (this.check('comma')) {
            this.get();
        } // skip ','
        const target = this.popStack(['を']);
        const name = this.popStack(['で']);
        let block = null;
        let multiline = false;
        if (this.check('ここから')) {
            multiline = true;
            this.get();
        }
        else if (this.check('eol')) {
            multiline = true;
        }
        if (multiline) {
            block = this.yBlock();
            if (this.check('ここまで')) {
                this.get();
            }
        }
        else {
            block = this.ySentence();
        }
        return {
            type: 'foreach',
            name,
            target,
            block: block || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** 条件分岐構文 */
    ySwitch() {
        const map = this.peekSourceMap();
        if (!this.check('条件分岐')) {
            return null;
        }
        const joukenbunki = this.get(); // skip '条件分岐'
        if (!joukenbunki) {
            return null;
        }
        const eol = this.get(); // skip 'eol'
        if (!eol) {
            return null;
        }
        const value = this.popStack(['で']);
        if (!value) {
            throw NakoSyntaxError.fromNode('『(値)で条件分岐』のように記述してください。', joukenbunki);
        }
        if (eol.type !== 'eol') {
            throw NakoSyntaxError.fromNode('『条件分岐』の直後は改行してください。', joukenbunki);
        }
        let isDefaultClause = false; // 「違えば」内かどうか
        let skippedKokomade = false;
        const cases = [];
        while (!this.isEOF()) {
            if (this.check('ここまで')) {
                if (skippedKokomade) {
                    throw NakoSyntaxError.fromNode('『条件分岐』は『(条件)ならば〜ここまで』と記述してください。', joukenbunki);
                }
                this.get(); // skip ここまで
                break;
            }
            if (this.check('eol')) {
                this.get();
                continue;
            }
            if (isDefaultClause) {
                throw NakoSyntaxError.fromNode('『条件分岐』で『違えば〜ここまで』の後に処理を続けることは出来ません。', joukenbunki);
            }
            // 違えば？
            let cond = null;
            const condToken = this.peek();
            if (condToken && condToken.type === '違えば') {
                // 違えば
                skippedKokomade = false;
                isDefaultClause = true;
                cond = this.get(); // skip 違えば
                if (this.check('comma')) {
                    this.get();
                } // skip ','
            }
            else {
                // ＊＊＊ならば
                if (skippedKokomade) {
                    throw NakoSyntaxError.fromNode('『条件分岐』は『(条件)ならば〜ここまで』と記述してください。', joukenbunki);
                }
                // 「＊＊ならば」を得る
                cond = this.yValue();
                if (!cond) {
                    throw NakoSyntaxError.fromNode('『条件分岐』は『(条件)ならば〜ここまで』と記述してください。', joukenbunki);
                }
                const naraba = this.get(); // skip ならば
                if (!naraba || naraba.type !== 'ならば') {
                    throw NakoSyntaxError.fromNode('『条件分岐』で条件は＊＊ならばと記述してください。', joukenbunki);
                }
                if (this.check('comma')) {
                    this.get();
                } // skip ','
            }
            // 条件にあったときに実行すること
            const condBlock = this.yBlock();
            const kokomade = this.peek();
            if (kokomade && kokomade.type === 'ここまで') {
                this.get(); // skip ここまで
            }
            else {
                if (isDefaultClause) {
                    throw NakoSyntaxError.fromNode('『条件分岐』は『違えば〜ここまで』と記述してください。', joukenbunki);
                }
                // 次が「違えば」の場合に限り、「もし〜ここまで」の「ここまで」を省略できる
                skippedKokomade = true;
            }
            cases.push([cond, condBlock]);
        }
        return {
            type: 'switch',
            value,
            cases: cases || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** 無名関数 */
    yMumeiFunc() {
        const map = this.peekSourceMap();
        if (!this.check('def_func')) {
            return null;
        }
        const def = this.get();
        if (!def) {
            return null;
        }
        let args = [];
        // 「,」を飛ばす
        if (this.check('comma')) {
            this.get();
        }
        // 関数の引数定義は省略できる
        if (this.check('(')) {
            args = this.yDefFuncReadArgs() || [];
        }
        // 「,」を飛ばす
        if (this.check('comma')) {
            this.get();
        }
        // ブロックを読む
        this.funcLevel++;
        this.saveStack();
        const block = this.yBlock();
        // 末尾の「ここまで」をチェック - もしなければエラーにする #1045
        if (!this.check('ここまで')) {
            throw NakoSyntaxError.fromNode('『ここまで』がありません。『には』構文か無名関数の末尾に『ここまで』が必要です。', map);
        }
        this.get(); // skip ここまで
        this.loadStack();
        this.funcLevel--;
        return {
            type: 'func_obj',
            args,
            block,
            meta: def.meta,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** 代入構文 */
    yDainyu() {
        const map = this.peekSourceMap();
        const dainyu = this.get(); // 代入
        if (dainyu === null) {
            return null;
        }
        const value = this.popStack(['を']);
        const word = this.popStack(['へ', 'に']);
        if (!word || (word.type !== 'word' && word.type !== 'func' && word.type !== '配列参照')) {
            throw NakoSyntaxError.fromNode('代入文で代入先の変数が見当たりません。『(変数名)に(値)を代入』のように使います。', dainyu);
        }
        // 配列への代入
        if (word.type === '配列参照') {
            return {
                type: 'let_array',
                name: word.name,
                index: word.index,
                value: value,
                josi: '',
                checkInit: this.flagCheckArrayInit,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 一般的な変数への代入
        const word2 = this.getVarName(word);
        return {
            type: 'let',
            name: word2,
            value: value,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** 定める構文 */
    ySadameru() {
        const map = this.peekSourceMap();
        const sadameru = this.get(); // 定める
        if (sadameru === null) {
            return null;
        }
        const word = this.popStack(['を']);
        const value = this.popStack(['へ', 'に']);
        if (!word || (word.type !== 'word' && word.type !== 'func' && word.type !== '配列参照')) {
            throw NakoSyntaxError.fromNode('『定める』文で定数が見当たりません。『(定数名)を(値)に定める』のように使います。', sadameru);
        }
        // 変数を生成する
        const nameToken = this.getVarName(word);
        return {
            type: 'def_local_var',
            name: nameToken,
            vartype: '定数',
            value: value,
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
    yIncDec() {
        const map = this.peekSourceMap();
        const action = this.get(); // (増やす|減らす)
        if (action === null) {
            return null;
        }
        // 『Nずつ増やして繰り返す』文か？
        if (this.check('繰返')) {
            this.pushStack({ type: 'word', value: action.value, josi: action.josi, ...map, end: this.peekSourceMap() });
            return this.yFor();
        }
        // スタックから引数をポップ
        let value = this.popStack(['だけ', '']);
        if (!value) {
            value = { type: 'number', value: 1, josi: 'だけ', ...map, end: this.peekSourceMap() };
        }
        const word = this.popStack(['を']);
        if (!word || (word.type !== 'word' && word.type !== '配列参照')) {
            throw NakoSyntaxError.fromNode(`『${action.type}』文で定数が見当たりません。『(変数名)を(値)だけ${action.type}』のように使います。`, action);
        }
        // 減らすなら-1かける
        if (action.value === '減') {
            value = { type: 'op', operator: '*', left: value, right: { type: 'number', value: -1, line: action.line }, josi: '', ...map };
        }
        return {
            type: 'inc',
            name: word,
            value: value,
            josi: action.josi,
            ...map,
            end: this.peekSourceMap()
        };
    }
    yCall() {
        if (this.isEOF()) {
            return null;
        }
        // スタックに積んでいく
        while (!this.isEOF()) {
            if (this.check('ここから')) {
                this.get();
            }
            // 代入
            if (this.check('代入')) {
                return this.yDainyu();
            }
            if (this.check('定める')) {
                return this.ySadameru();
            }
            // 制御構文
            if (this.check('回')) {
                return this.yRepeatTime();
            }
            if (this.check('間')) {
                return this.yWhile();
            }
            if (this.check('繰返') || this.check('増繰返') || this.check('減繰返')) {
                return this.yFor();
            }
            if (this.check('反復')) {
                return this.yForEach();
            }
            if (this.check('条件分岐')) {
                return this.ySwitch();
            }
            if (this.check('戻る')) {
                return this.yReturn();
            }
            if (this.check('増') || this.check('減')) {
                return this.yIncDec();
            }
            // C言語風関数
            if (this.check2([['func', 'word'], '('])) { // C言語風
                const cur = this.peek();
                if (cur && cur.josi === '') {
                    const t = this.yValue();
                    if (t) {
                        const josi = t.josi || '';
                        if (t.type === 'func' && (t.josi === '' || keizokuJosi.indexOf(josi) >= 0)) {
                            t.josi = '';
                            return t; // 関数なら値とする
                        }
                        this.pushStack(t);
                    }
                    if (this.check('comma')) {
                        this.get();
                    }
                    continue;
                }
            }
            // なでしこ式関数
            if (this.check('func')) {
                const r = this.yCallFunc();
                if (r === null) {
                    continue;
                }
                // 「〜する間」の形ならスタックに積む。
                if (this.check('間')) {
                    this.pushStack(r);
                    continue;
                }
                // 関数呼び出しの直後に、四則演算があるか?
                if (!this.checkTypes(operatorList)) {
                    return r;
                } // なければ関数呼び出しを戻す
                // 四則演算があった場合、計算してスタックに載せる
                this.pushStack(this.yGetArgOperator(r));
                continue;
            }
            // 値のとき → スタックに載せる
            const t = this.yGetArg();
            if (t) {
                this.pushStack(t);
                continue;
            }
            break;
        } // end of while
        // 助詞が余ってしまった場合
        if (this.stack.length > 0) {
            this.logger.debug('--- stack dump ---\n' + JSON.stringify(this.stack, null, 2) + '\npeek: ' + JSON.stringify(this.peek(), null, 2));
            let msgDebug = `不完全な文です。${this.stack.map((n) => this.nodeToStr(n, { depth: 0 }, true)).join('、')}が解決していません。`;
            let msg = `不完全な文です。${this.stack.map((n) => this.nodeToStr(n, { depth: 0 }, false)).join('、')}が解決していません。`;
            // 各ノードについて、更に詳細な情報があるなら表示
            for (const n of this.stack) {
                const d0 = this.nodeToStr(n, { depth: 0 }, false);
                const d1 = this.nodeToStr(n, { depth: 1 }, false);
                if (d0 !== d1) {
                    msgDebug += `${this.nodeToStr(n, { depth: 0 }, true)}は${this.nodeToStr(n, { depth: 1 }, true)}として使われています。`;
                    msg += `${d0}は${d1}として使われています。`;
                }
            }
            const first = this.stack[0];
            const last = this.stack[this.stack.length - 1];
            this.logger.debug(msgDebug, first);
            throw NakoSyntaxError.fromNode(msg, first, last);
        }
        return this.popStack([]);
    }
    /** @returns {Ast | null} */
    yCallFunc() {
        const map = this.peekSourceMap();
        const t = this.get();
        if (!t) {
            return null;
        }
        const f = t.meta;
        const funcName = t.value;
        // (関数)には ... 構文 ... https://github.com/kujirahand/nadesiko3/issues/66
        let funcObj = null;
        if (t.josi === 'には') {
            try {
                funcObj = this.yMumeiFunc();
            }
            catch (err) {
                throw NakoSyntaxError.fromNode(`『${t.value}には...』で無名関数の定義で以下の間違いがあります。\n${err.message}`, t);
            }
            if (funcObj === null) {
                throw NakoSyntaxError.fromNode('『Fには』構文がありましたが、関数定義が見当たりません。', t);
            }
        }
        if (!f || typeof f.josi === 'undefined') {
            throw NakoSyntaxError.fromNode('関数の定義でエラー。', t);
        }
        // 最近使った関数を記録
        this.recentlyCalledFunc.push({ name: funcName, ...f });
        // 呼び出す関数が非同期呼び出しが必要(asyncFn)ならマーク
        if (f && f.asyncFn) {
            this.usedAsyncFn = true;
        }
        // 関数の引数を取り出す処理
        const args = [];
        let nullCount = 0;
        let valueCount = 0;
        for (let i = 0; i < f.josi.length; i++) {
            while (true) {
                // スタックから任意の助詞を持つ値を一つ取り出す、助詞がなければ末尾から得る
                let popArg = this.popStack(f.josi[i]);
                if (popArg !== null) {
                    valueCount++;
                }
                else if (i < f.josi.length - 1 || !f.isVariableJosi) {
                    nullCount++;
                    popArg = funcObj;
                }
                else {
                    break;
                }
                if (popArg !== null && f.funcPointers !== undefined && f.funcPointers[i] !== null) {
                    if (popArg.type === 'func') { // 引数が関数の参照渡しに該当する場合、typeを『func_pointer』に変更
                        popArg.type = 'func_pointer';
                    }
                    else {
                        const varname = (f.varnames) ? f.varnames[i] : `${i + 1}番目の引数`;
                        throw NakoSyntaxError.fromNode(`関数『${t.value}』の引数『${varname}』には関数オブジェクトが必要です。`, t);
                    }
                }
                args.push(popArg);
                if (i < f.josi.length - 1 || !f.isVariableJosi) {
                    break;
                }
            }
        }
        // 1つだけなら、変数「それ」で補完される
        if (nullCount >= 2 && (valueCount > 0 || t.josi === '' || keizokuJosi.indexOf(t.josi) >= 0)) {
            throw NakoSyntaxError.fromNode(`関数『${t.value}』の引数が不足しています。`, t);
        }
        // 関数呼び出しのAstを構築
        const funcNode = {
            type: 'func',
            name: t.value,
            args: args,
            josi: t.josi,
            ...map,
            end: this.peekSourceMap()
        };
        // 「プラグイン名設定」ならば、そこでスコープを変更することを意味する
        if (funcNode.name === 'プラグイン名設定') {
            if (args.length > 0 && args[0]) {
                let fname = '' + args[0].value;
                if (fname === 'メイン') {
                    fname = '' + args[0].file;
                }
                this.modName = NakoLexer.filenameToModName(fname);
            }
        }
        // 言い切りならそこで一度切る
        if (t.josi === '') {
            return funcNode;
        }
        // 「**して、**」の場合も一度切る
        if (keizokuJosi.indexOf(t.josi) >= 0) {
            funcNode.josi = 'して';
            return funcNode;
        }
        // 続き
        funcNode.meta = f;
        this.pushStack(funcNode);
        return null;
    }
    /** 関数呼び出し演算子 #891
     * @returns {Ast | null} */
    yCallOp() {
        if (!this.check2(['func', '←'])) {
            return null;
        }
        const map = this.peekSourceMap();
        // 関数名を得る
        const word = this.get();
        if (word == null) {
            throw new Error('関数が取得できません。');
        }
        try {
            const op = this.get();
            if (op == null) {
                throw new Error('関数呼び出し演算子が取得できません。');
            }
            const funcName = word.value;
            // 関数の引数なしをチェック
            if (!word.meta) {
                throw new Error('関数本体を取得できません。');
            }
            if (!word.meta.josi) {
                throw new Error('関数の引数情報を取得できません。');
            }
            const argCount = word.meta.josi.length;
            if (argCount === 0) {
                throw NakoSyntaxError.fromNode(`引数がない関数『${funcName}』を関数呼び出し演算子で呼び出すことはできません。`, word);
            }
            // 引数を順に取得
            const curStackPos = this.stack.length;
            while (!this.isEOF()) {
                const t = this.yGetArg();
                if (t) {
                    this.pushStack(t);
                    if ((this.stack.length - curStackPos) === argCount) {
                        break;
                    }
                    continue;
                }
                break;
            }
            // この場合第一引数の省略は認めない
            const realArgCount = this.stack.length - curStackPos;
            if (realArgCount !== argCount) {
                throw NakoSyntaxError.fromNode(`関数『${funcName}』呼び出しで引数の数(${realArgCount})が定義(${argCount})と違います。`, word);
            }
            // 引数を取り出す
            const tmpList = this.stack.splice(curStackPos, argCount);
            // 引数が1つなら助詞は省略が可能。ただし、引数が2つ以上の時、正しく助詞の順序を入れ替える
            let argList = tmpList;
            if (argCount >= 2) {
                argList = [];
                const defList = word.meta.josi;
                defList.forEach((josiList, i) => {
                    for (let j = 0; j < tmpList.length; j++) {
                        const t = tmpList[j];
                        if (josiList.indexOf(t.josi) >= 0) {
                            argList[i] = t;
                            return;
                        }
                    }
                    const josiStr = josiList.join(',');
                    throw new Error(`助詞『${josiStr}』が見当たりません。`);
                });
            }
            // funcノードを返す
            return {
                type: 'func',
                name: funcName,
                args: argList,
                setter: true,
                josi: '',
                ...map,
                end: this.peekSourceMap()
            };
        }
        catch (err) {
            this.logger.debug(`${this.nodeToStr(word, { depth: 0 }, true)}の関数呼び出しで引数(『←』以降)が読み取れません。`, word);
            throw NakoSyntaxError.fromNode(`${this.nodeToStr(word, { depth: 0 }, false)}の関数呼び出しでエラーがあります。\n${err.message}`, word);
        }
    }
    /** @returns {Ast | null} */
    yLet() {
        const map = this.peekSourceMap();
        // 通常の変数
        if (this.check2(['word', 'eq'])) {
            const word = this.peek();
            let threw = false;
            try {
                if (this.accept(['word', 'eq', this.yCalc]) || this.accept(['word', 'eq', this.ySentence])) {
                    if (this.y[2].type === 'eol') {
                        throw new Error('値が空です。');
                    }
                    if (this.check('comma')) {
                        this.get();
                    } // skip comma (ex) name1=val1, name2=val2
                    const nameToken = this.getVarName(this.y[0]);
                    const valueToken = this.y[2];
                    return {
                        type: 'let',
                        name: nameToken,
                        value: valueToken,
                        ...map,
                        end: this.peekSourceMap()
                    };
                }
                else {
                    threw = true;
                    this.logger.debug(`${this.nodeToStr(word, { depth: 1 }, true)}への代入文で計算式に書き間違いがあります。`, word);
                    throw NakoSyntaxError.fromNode(`${this.nodeToStr(word, { depth: 1 }, false)}への代入文で計算式に書き間違いがあります。`, map);
                }
            }
            catch (err) {
                if (threw) {
                    throw err;
                }
                this.logger.debug(`${this.nodeToStr(word, { depth: 1 }, true)}への代入文で計算式に以下の書き間違いがあります。\n${err.message}`, word);
                throw NakoSyntaxError.fromNode(`${this.nodeToStr(word, { depth: 1 }, false)}への代入文で計算式に以下の書き間違いがあります。\n${err.message}`, map);
            }
        }
        // let_array ?
        if (this.check2(['word', '@'])) {
            const la = this.yLetArrayAt(map);
            if (this.check('comma')) {
                this.get();
            } // skip comma (ex) name1=val1, name2=val2
            if (la) {
                la.checkInit = this.flagCheckArrayInit;
                return la;
            }
        }
        if (this.check2(['word', '['])) {
            const lb = this.yLetArrayBracket(map);
            if (this.check('comma')) {
                this.get();
            } // skip comma (ex) name1=val1, name2=val2
            if (lb) {
                lb.checkInit = this.flagCheckArrayInit;
                return lb;
            }
        }
        // ローカル変数定義
        if (this.accept(['word', 'とは'])) {
            const word = this.getVarName(this.y[0]);
            if (!this.checkTypes(['変数', '定数'])) {
                throw NakoSyntaxError.fromNode('ローカル変数『' + word.value + '』の定義エラー', word);
            }
            const vtype = this.getCur(); // 変数
            // 初期値がある？
            let value = null;
            if (this.check('eq')) {
                this.get();
                value = this.yCalc();
            }
            if (this.check('comma')) {
                this.get();
            } // skip comma (ex) name1=val1, name2=val2
            return {
                type: 'def_local_var',
                name: word,
                vartype: vtype.type,
                value,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // ローカル変数定義（その２）
        if (this.accept(['変数', 'word', 'eq', this.yCalc])) {
            const word = this.getVarName(this.y[1]);
            return {
                type: 'def_local_var',
                name: word,
                vartype: '変数',
                value: this.y[3],
                ...map,
                end: this.peekSourceMap()
            };
        }
        if (this.accept(['定数', 'word', 'eq', this.yCalc])) {
            const word = this.getVarName(this.y[1]);
            return {
                type: 'def_local_var',
                name: word,
                vartype: '定数',
                value: this.y[3],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 複数定数への代入 #563
        if (this.accept(['定数', this.yJSONArray, 'eq', this.yCalc])) {
            const names = this.y[1];
            // check array
            if (names && names.value instanceof Array) {
                for (const i in names.value) {
                    if (names.value[i].type !== 'word') {
                        throw NakoSyntaxError.fromNode(`複数定数の代入文${i + 1}番目でエラー。『定数[A,B,C]=[1,2,3]』の書式で記述してください。`, this.y[0]);
                    }
                }
            }
            else {
                throw NakoSyntaxError.fromNode('複数定数の代入文でエラー。『定数[A,B,C]=[1,2,3]』の書式で記述してください。', this.y[0]);
            }
            names.value = this.getVarNameList(names.value);
            return {
                type: 'def_local_varlist',
                names: names.value,
                vartype: '定数',
                value: this.y[3],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 複数変数への代入 #563
        if (this.accept(['変数', this.yJSONArray, 'eq', this.yCalc])) {
            const names = this.y[1];
            // check array
            if (names && names.value instanceof Array) {
                for (const i in names.value) {
                    if (names.value[i].type !== 'word') {
                        throw NakoSyntaxError.fromNode(`複数変数の代入文${i + 1}番目でエラー。『変数[A,B,C]=[1,2,3]』の書式で記述してください。`, this.y[0]);
                    }
                }
            }
            else {
                throw NakoSyntaxError.fromNode('複数変数の代入文でエラー。『変数[A,B,C]=[1,2,3]』の書式で記述してください。', this.y[0]);
            }
            names.value = this.getVarNameList(names.value);
            return {
                type: 'def_local_varlist',
                names: names.value,
                vartype: '変数',
                value: this.y[3],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 複数変数への代入 #563
        if (this.check2(['word', 'comma', 'word'])) {
            // 2 word
            if (this.accept(['word', 'comma', 'word', 'eq', this.yCalc])) {
                let names = [this.y[0], this.y[2]];
                names = this.getVarNameList(names);
                return {
                    type: 'def_local_varlist',
                    names,
                    vartype: '変数',
                    value: this.y[4],
                    ...map,
                    end: this.peekSourceMap()
                };
            }
            // 3 word
            if (this.accept(['word', 'comma', 'word', 'comma', 'word', 'eq', this.yCalc])) {
                let names = [this.y[0], this.y[2], this.y[4]];
                names = this.getVarNameList(names);
                return {
                    type: 'def_local_varlist',
                    names,
                    vartype: '変数',
                    value: this.y[6],
                    ...map,
                    end: this.peekSourceMap()
                };
            }
            // 4 word
            if (this.accept(['word', 'comma', 'word', 'comma', 'word', 'comma', 'word', 'eq', this.yCalc])) {
                let names = [this.y[0], this.y[2], this.y[4], this.y[6]];
                names = this.getVarNameList(names);
                return {
                    type: 'def_local_varlist',
                    names,
                    vartype: '変数',
                    value: this.y[8],
                    ...map,
                    end: this.peekSourceMap()
                };
            }
            // 5 word
            if (this.accept(['word', 'comma', 'word', 'comma', 'word', 'comma', 'word', 'comma', 'word', 'eq', this.yCalc])) {
                let names = [this.y[0], this.y[2], this.y[4], this.y[6], this.y[8]];
                names = this.getVarNameList(names);
                return {
                    type: 'def_local_varlist',
                    names,
                    vartype: '変数',
                    value: this.y[10],
                    ...map,
                    end: this.peekSourceMap()
                };
            }
        }
        return null;
    }
    /**
     * 配列のインデックスが1から始まる場合を考慮するか
     * @param {Ast} node
     * @returns
     */
    checkArrayIndex(node) {
        // 配列が0から始まるのであればそのまま返す
        if (this.arrayIndexFrom === 0) {
            return node;
        }
        // 配列が1から始まるのであれば演算を加えて返す
        return {
            ...node,
            'type': 'op',
            'operator': '-',
            'left': node,
            'right': {
                ...node,
                'type': 'number',
                'value': this.arrayIndexFrom
            }
        };
    }
    /**
     * 配列のインデックスを逆順にするのを考慮するか
     * @param {Ast[]| null} ary
     */
    checkArrayReverse(ary) {
        if (!ary) {
            return [];
        }
        if (!this.flagReverseArrayIndex) {
            return ary;
        }
        // 二次元以上の配列変数のアクセスを[y][x]ではなく[x][y]と順序を変更する
        if (ary.length <= 1) {
            return ary;
        }
        return ary.reverse();
    }
    /** @returns {Ast | null} */
    yLetArrayAt(map) {
        // 一次元配列
        if (this.accept(['word', '@', this.yValue, 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: [this.checkArrayIndex(this.y[2])],
                value: this.y[4],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 二次元配列
        if (this.accept(['word', '@', this.yValue, '@', this.yValue, 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])]),
                value: this.y[6],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 三次元配列
        if (this.accept(['word', '@', this.yValue, '@', this.yValue, '@', this.yValue, 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])]),
                value: this.y[8],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 二次元配列(カンマ指定)
        if (this.accept(['word', '@', this.yValue, 'comma', this.yValue, 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])]),
                value: this.y[6],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 三次元配列(カンマ指定)
        if (this.accept(['word', '@', this.yValue, 'comma', this.yValue, 'comma', this.yValue, 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])]),
                value: this.y[8],
                ...map,
                end: this.peekSourceMap()
            };
        }
        return null;
    }
    /** @returns {Ast | null} */
    yLetArrayBracket(map) {
        // 一次元配列
        if (this.accept(['word', '[', this.yCalc, ']', 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: [this.checkArrayIndex(this.y[2])],
                value: this.y[5],
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 二次元配列
        if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[5])]),
                value: this.y[8],
                tag: '2',
                ...map,
                end: this.peekSourceMap()
            };
        }
        if (this.accept(['word', '[', this.yCalc, 'comma', this.yCalc, ']', 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4])]),
                value: this.y[7],
                tag: '2',
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 三次元配列
        if (this.accept(['word', '[', this.yCalc, ']', '[', this.yCalc, ']', '[', this.yCalc, ']', 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[5]), this.checkArrayIndex(this.y[8])]),
                value: this.y[11],
                ...map,
                end: this.peekSourceMap()
            };
        }
        if (this.accept(['word', '[', this.yCalc, 'comma', this.yCalc, 'comma', this.yCalc, ']', 'eq', this.yCalc])) {
            return {
                type: 'let_array',
                name: this.getVarName(this.y[0]),
                index: this.checkArrayReverse([this.checkArrayIndex(this.y[2]), this.checkArrayIndex(this.y[4]), this.checkArrayIndex(this.y[6])]),
                value: this.y[9],
                ...map,
                end: this.peekSourceMap()
            };
        }
        return null;
    }
    /** @returns {Ast | null} */
    yCalc() {
        const map = this.peekSourceMap();
        if (this.check('eol')) {
            return null;
        }
        // 値を一つ読む
        const t = this.yGetArg();
        if (!t) {
            return null;
        }
        // 助詞がある？ つまり、関数呼び出しがある？
        if (t.josi === '') {
            return t;
        } // 値だけの場合
        // 関数の呼び出しがあるなら、スタックに載せて関数読み出しを呼ぶ
        this.pushStack(t);
        const t1 = this.yCall();
        if (!t1) {
            return this.popStack();
        }
        // それが連文か確認
        if (t1.josi !== 'して') {
            return t1;
        } // 連文ではない
        // 連文なら右側を読んで左側とくっつける
        const t2 = this.yCalc();
        if (!t2) {
            return t1;
        }
        return {
            type: 'renbun',
            left: t1,
            right: t2,
            josi: t2.josi,
            ...map,
            end: this.peekSourceMap()
        };
    }
    /** @returns {Ast | null} */
    yValueKakko() {
        if (!this.check('(')) {
            return null;
        }
        const t = this.get(); // skip '('
        if (!t) {
            throw new Error('[System Error] check したのに get できない');
        }
        this.saveStack();
        const v = this.yCalc() || this.ySentence();
        if (v === null) {
            const v2 = this.get();
            this.logger.debug('(...)の解析エラー。' + this.nodeToStr(v2, { depth: 1 }, true) + 'の近く', t);
            throw NakoSyntaxError.fromNode('(...)の解析エラー。' + this.nodeToStr(v2, { depth: 1 }, false) + 'の近く', t);
        }
        if (!this.check(')')) {
            this.logger.debug('(...)の解析エラー。' + this.nodeToStr(v, { depth: 1 }, true) + 'の近く', t);
            throw NakoSyntaxError.fromNode('(...)の解析エラー。' + this.nodeToStr(v, { depth: 1 }, false) + 'の近く', t);
        }
        const closeParent = this.get(); // skip ')'
        this.loadStack();
        if (closeParent) {
            v.josi = closeParent.josi;
        }
        return v;
    }
    /** @returns {Ast | null} */
    yValue() {
        const map = this.peekSourceMap();
        // カンマなら飛ばす #877
        if (this.check('comma')) {
            this.get();
        }
        // プリミティブな値
        if (this.checkTypes(['number', 'string'])) {
            return this.getCur();
        }
        // 丸括弧
        if (this.check('(')) {
            return this.yValueKakko();
        }
        // マイナス記号
        if (this.check2(['-', 'number']) || this.check2(['-', 'word']) || this.check2(['-', 'func'])) {
            const m = this.get(); // skip '-'
            const v = this.yValue();
            const josi = (v && v.josi) ? v.josi : '';
            const line = (m && m.line) ? m.line : 0;
            return {
                type: 'op',
                operator: '*',
                left: { type: 'number', value: -1, line },
                right: v || [],
                josi: josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // NOT
        if (this.check('not')) {
            this.get(); // skip '!'
            const v = this.yValue();
            const josi = (v && v.josi) ? v.josi : '';
            return {
                type: 'not',
                value: v,
                josi: josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // JSON object
        const a = this.yJSONArray();
        if (a) {
            return a;
        }
        const o = this.yJSONObject();
        if (o) {
            return o;
        }
        // 一語関数
        const splitType = operatorList.concat(['eol', ')', ']', 'ならば', '回', '間', '反復', '条件分岐']);
        if (this.check2(['func', splitType])) {
            const tt = this.get();
            if (!tt) {
                throw new Error('[System Error] 正しく値が取れませんでした。');
            }
            const f = this.getVarNameRef(tt);
            return {
                type: 'func',
                name: f.value,
                args: [],
                josi: f.josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // C風関数呼び出し FUNC(...)
        if (this.check2([['func', 'word'], '(']) && this.peekDef().josi === '') {
            const f = this.peek();
            if (this.accept([['func', 'word'], '(', this.yGetArgParen, ')'])) {
                return {
                    type: 'func',
                    name: this.getVarNameRef(this.y[0]).value,
                    args: this.y[2],
                    josi: this.y[3].josi,
                    ...map,
                    end: this.peekSourceMap()
                };
            }
            else {
                throw NakoSyntaxError.fromNode('C風関数呼び出しのエラー', f || NewEmptyToken());
            }
        }
        // 関数呼び出し演算子
        if (this.check2(['func', '←'])) {
            return this.yCallOp();
        }
        // 無名関数(関数オブジェクト)
        if (this.check('def_func')) {
            return this.yMumeiFunc();
        }
        // 変数
        const word = this.yValueWord();
        if (word) {
            return word;
        }
        // その他
        return null;
    }
    yValueWordGetIndex(ast) {
        if (!ast.index) {
            ast.index = [];
        }
        // word @ a, b, c
        if (this.check('@')) {
            if (this.accept(['@', this.yValue, 'comma', this.yValue, 'comma', this.yValue])) {
                ast.index.push(this.checkArrayIndex(this.y[1]));
                ast.index.push(this.checkArrayIndex(this.y[3]));
                ast.index.push(this.checkArrayIndex(this.y[5]));
                ast.index = this.checkArrayReverse(ast.index);
                ast.josi = this.y[5].josi;
                return true;
            }
            if (this.accept(['@', this.yValue, 'comma', this.yValue])) {
                ast.index.push(this.checkArrayIndex(this.y[1]));
                ast.index.push(this.checkArrayIndex(this.y[3]));
                ast.index = this.checkArrayReverse(ast.index);
                ast.josi = this.y[3].josi;
                return true;
            }
            if (this.accept(['@', this.yValue])) {
                ast.index.push(this.checkArrayIndex(this.y[1]));
                ast.josi = this.y[1].josi;
                return true;
            }
            throw NakoSyntaxError.fromNode('変数の後ろの『@要素』の指定が不正です。', ast);
        }
        if (this.check('[')) {
            if (this.accept(['[', this.yCalc, ']'])) {
                ast.index.push(this.checkArrayIndex(this.y[1]));
                ast.josi = this.y[2].josi;
                return true;
            }
        }
        if (this.check('[')) {
            if (this.accept(['[', this.yCalc, 'comma', this.yCalc, ']'])) {
                const index = [
                    this.checkArrayIndex(this.y[1]),
                    this.checkArrayIndex(this.y[3])
                ];
                ast.index = this.checkArrayReverse(index);
                ast.josi = this.y[4].josi;
                return true;
            }
        }
        if (this.check('[')) {
            if (this.accept(['[', this.yCalc, 'comma', this.yCalc, 'comma', this.yCalc, ']'])) {
                const index = [
                    this.checkArrayIndex(this.y[1]),
                    this.checkArrayIndex(this.y[3]),
                    this.checkArrayIndex(this.y[5])
                ];
                ast.index = this.checkArrayReverse(index);
                ast.josi = this.y[6].josi;
                return true;
            }
        }
        return false;
    }
    /** @returns {Ast | null} */
    yValueWord() {
        const map = this.peekSourceMap();
        if (this.check('word')) {
            const t = this.getCur();
            const word = this.getVarNameRef(t);
            // word[n] || word@n
            if (word.josi === '' && this.checkTypes(['[', '@'])) {
                const ast = {
                    type: '配列参照',
                    name: word,
                    index: [],
                    josi: '',
                    ...map,
                    end: this.peekSourceMap()
                };
                while (!this.isEOF()) {
                    if (!this.yValueWordGetIndex(ast)) {
                        break;
                    }
                }
                if (ast.index && ast.index.length === 0) {
                    throw NakoSyntaxError.fromNode(`配列『${word.value}』アクセスで指定ミス`, word);
                }
                return ast;
            }
            return word;
        }
        return null;
    }
    /** 変数名を検索して解決する
     * @param {Ast|Token} word
     * @return {Ast|Token}
     */
    getVarName(word) {
        // check word name
        const f = this.findVar(word.value);
        if (!f) { // 変数が見つからない
            if (this.funcLevel === 0) { // global
                let gname = word.value;
                if (gname.indexOf('__') < 0) {
                    gname = this.modName + '__' + word.value;
                }
                this.funclist[gname] = { type: 'var', value: '' };
                word.value = gname;
            }
            else { // local
                this.localvars[word.value] = { type: 'var', value: '' };
            }
        }
        else if (f && f.scope === 'global') {
            word.value = f.name;
        }
        return word;
    }
    /** 変数名を検索して解決する */
    getVarNameRef(word) {
        // check word name
        const f = this.findVar(word.value);
        if (!f) { // 変数が見つからない
            if (this.funcLevel === 0 && word.value.indexOf('__') < 0) {
                word.value = this.modName + '__' + word.value;
            }
        }
        else if (f && f.scope === 'global') {
            word.value = f.name;
        }
        return word;
    }
    /** 複数の変数名を検索して解決する */
    getVarNameList(words) {
        for (let i = 0; i < words.length; i++) {
            words[i] = this.getVarName(words[i]);
        }
        return words;
    }
    yJSONObjectValue() {
        const a = [];
        const firstToken = this.peek();
        if (!firstToken) {
            return null;
        }
        while (!this.isEOF()) {
            while (this.check('eol')) {
                this.get();
            }
            if (this.check('}')) {
                break;
            }
            if (this.accept(['word', ':', this.yCalc])) {
                this.y[0].type = 'string'; // キー名の文字列記号省略の場合
                a.push({
                    key: this.y[0],
                    value: this.y[2]
                });
            }
            else if (this.accept(['string', ':', this.yCalc])) {
                a.push({
                    key: this.y[0],
                    value: this.y[2]
                });
            }
            else if (this.check('word')) {
                const w = this.getCur();
                w.type = 'string';
                a.push({
                    key: w,
                    value: w
                });
            }
            else if (this.checkTypes(['string', 'number'])) {
                const w = this.getCur();
                a.push({
                    key: w,
                    value: w
                });
            }
            else {
                throw NakoSyntaxError.fromNode('辞書オブジェクトの宣言で末尾の『}』がありません。', firstToken);
            }
            if (this.check('comma')) {
                this.get();
            }
        }
        return a;
    }
    /** @returns {Ast | null} */
    yJSONObject() {
        const map = this.peekSourceMap();
        if (this.accept(['{', '}'])) {
            return {
                type: 'json_obj',
                value: [],
                josi: this.y[1].josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        if (this.accept(['{', this.yJSONObjectValue, '}'])) {
            return {
                type: 'json_obj',
                value: this.y[1],
                josi: this.y[2].josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 辞書初期化に終わりがなかった場合 (エラーチェックのため) #958
        if (this.accept(['{', this.yJSONObjectValue])) {
            throw NakoSyntaxError.fromNode('辞書型変数の初期化が『}』で閉じられていません。', this.y[1]);
        }
        return null;
    }
    yJSONArrayValue() {
        if (this.check('eol')) {
            this.get();
        }
        const v1 = this.yCalc();
        if (v1 === null) {
            return null;
        }
        if (this.check('comma')) {
            this.get();
        }
        const a = [v1];
        while (!this.isEOF()) {
            if (this.check('eol')) {
                this.get();
            }
            if (this.check(']')) {
                break;
            }
            const v2 = this.yCalc();
            if (v2 === null) {
                break;
            }
            if (this.check('comma')) {
                this.get();
            }
            a.push(v2);
        }
        return a;
    }
    /** @returns {Ast | null} */
    yJSONArray() {
        const map = this.peekSourceMap();
        if (this.accept(['[', ']'])) {
            return {
                type: 'json_array',
                value: [],
                josi: this.y[1].josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        if (this.accept(['[', this.yJSONArrayValue, ']'])) {
            return {
                type: 'json_array',
                value: this.y[1],
                josi: this.y[2].josi,
                ...map,
                end: this.peekSourceMap()
            };
        }
        // 配列に終わりがなかった場合 (エラーチェックのため) #958
        if (this.accept(['[', this.yJSONArrayValue])) {
            throw NakoSyntaxError.fromNode('配列変数の初期化が『]』で閉じられていません。', this.y[1]);
        }
        return null;
    }
    /** エラー監視構文 */
    yTryExcept() {
        const map = this.peekSourceMap();
        if (!this.check('エラー監視')) {
            return null;
        }
        const kansi = this.getCur(); // skip エラー監視
        const block = this.yBlock();
        if (!this.check2(['エラー', 'ならば'])) {
            throw NakoSyntaxError.fromNode('エラー構文で『エラーならば』がありません。' +
                '『エラー監視..エラーならば..ここまで』を対で記述します。', kansi);
        }
        this.get(); // skip エラー
        this.get(); // skip ならば
        const errBlock = this.yBlock();
        if (this.check('ここまで')) {
            this.get();
        }
        else {
            throw NakoSyntaxError.fromNode('『ここまで』がありません。『エラー監視』...『エラーならば』...『ここまで』を対応させてください。', map);
        }
        return {
            type: 'try_except',
            block,
            errBlock: errBlock || [],
            josi: '',
            ...map,
            end: this.peekSourceMap()
        };
    }
}
