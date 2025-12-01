// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { options, parse, stringify } from './nako_csv.mjs';
const PluginCSV = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_csv', // プラグインの名前
            description: 'CSV関連の命令を提供するプラグイン', // プラグインの説明
            pluginVersion: '3.6.0', // プラグインのバージョン
            nakoRuntime: ['wnako', 'cnako', 'phpnako'], // 対象ランタイム
            nakoVersion: '3.6.0' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function () {
            // 基本的に初期化不要
        }
    },
    // @CSV操作
    'CSV取得': {
        type: 'func',
        josi: [['を', 'の', 'で']],
        pure: true,
        fn: function (str) {
            options.delimiter = ',';
            return parse(str);
        }
    },
    'TSV取得': {
        type: 'func',
        josi: [['を', 'の', 'で']],
        pure: true,
        fn: function (str) {
            options.delimiter = '\t';
            return parse(str);
        }
    },
    '表CSV変換': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (a) {
            options.delimiter = ',';
            return stringify(a);
        }
    },
    '表TSV変換': {
        type: 'func',
        josi: [['を']],
        pure: true,
        fn: function (a) {
            options.delimiter = '\t';
            return stringify(a);
        }
    },
    'CSVオプション設定': {
        type: 'func',
        josi: [['を', 'で']],
        pure: true,
        fn: function (obj) {
            for (const key in obj) {
                const value = obj[key];
                if (key === 'delimiter' || key === '区切文字') {
                    options.delimiter = value;
                }
                else if (key === 'eol') {
                    options.eol = value;
                }
                else if (key === 'auto_convert_number') {
                    options.auto_convert_number = value;
                }
            }
        },
        return_none: true
    }
};
export default PluginCSV;
