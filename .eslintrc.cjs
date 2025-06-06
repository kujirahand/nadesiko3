module.exports = {
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
      "sourceType": "module",
      "project": ["./tsconfig.json"],
      "ecmaVersion": "latest"
    },
    "env": {
        "browser": true,
        "commonjs": false,
        "es2022": true,
        "node": true
    },
    "extends": [
        "standard",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "rules": {
        // anyに関するルールを無効化
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        // promiseに関するルールを無効化
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/require-await": "off",
        //
        "@typescript-eslint/ban-ts-comment": "off",
        "quote-props": "off",
        "no-unused-vars": "off",
        "no-undef": "off",
        "@typescript-eslint/no-unused-vars":  "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-function": "off",
        "react/prop-types": "off"
    },
    "ignorePatterns": [
        "node_modules/",
        "src/**/*.mjs",
        "**/*.js",
        "core/command/*.mts",
        "core/deno/*.ts"
      ],
    "plugins": [
        "@typescript-eslint"
    ],
    "root": true
}
