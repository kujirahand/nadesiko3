module.exports = {
    "env": {
        "browser": true,
        "commonjs": false,
        "es2021": true
    },
    "extends": [
        "standard",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json",
        // "extraFileExtensions": [".mts", ".mjs"]
    },
    "rules": {
        "quote-props": "off", // 重要
        "@typescript-eslint/no-explicit-any": "off", // any型を認めないをオフ
        "@typescript-eslint/explicit-module-boundary-types": "off", // 型の指定に関する警告をオフ
        "@typescript-eslint/ban-ts-comment": "off", // ts-nocheck を許さないをオフ
        // anyに関するルールを無効化
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        //"@typescript-eslint/no-unused-vars":  0,
        //"@typescript-eslint/no-empty-function": 0,
        // "no-unused-vars":0,
        // "no-undef": 0
        //"react/prop-types": "off"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "ignorePatterns": [
      "node_modules/",
      "src/*.mjs",
      "**/*.js",
      "command/*.mts",
      "deno/*.ts"
    ],
    "root": true
}
