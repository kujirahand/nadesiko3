module.exports = {
    "env": {
        "browser": true,
        "commonjs": false,
        "es2021": true
    },
    "extends": [
        "standard",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json"
    },
    "rules": {
        "@typescript-eslint/ban-ts-comment": "off",
        "quote-props": "off",
        "no-unused-vars": "off",
        "no-undef": "Off",
        "@typescript-eslint/no-unused-vars":  "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-function": "off"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "root": true
}
