// TOMLを読むためのプラグイン
import TOML from 'smol-toml';
const PluginTOML = {
    'meta': {
        type: 'const',
        value: {
            pluginName: 'plugin_toml', // プラグインの名前
            description: 'TOML形式のデータ読み書きするプラグイン', // プラグインの説明
            pluginVersion: '3.7.6', // プラグインのバージョン
            nakoRuntime: ['wnako', 'cnako'], // 対象ランタイム
            nakoVersion: '3.7.6' // 要求なでしこバージョン
        }
    },
    '初期化': {
        type: 'func',
        josi: [],
        pure: true,
        fn: function (sys) {
        }
    },
    // @TOML
    'TOML取得': {
        type: 'func',
        josi: [['を', 'の', 'から']],
        pure: true,
        fn: function (s, sys) {
            return TOML.parse(s);
        }
    },
    'TOML変換': {
        type: 'func',
        josi: [['を', 'から', 'の']],
        pure: true,
        fn: function (s, sys) {
            return TOML.stringify(s);
        }
    },
};
export default PluginTOML;
