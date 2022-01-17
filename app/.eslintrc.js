module.exports = {
    root: true,
    env: {
        browser: true,
        commonjs: true,
        es6: true
    },
    extends: ['airbnb', 'airbnb/hooks'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2021
    },
    rules: {
        indent: [2, 4],
        'arrow-parens': ['error', 'always'],
        'comma-dangle': 'off',
        'max-len': ['error', { code: 250 }],
        'object-curly-newline': ['error', { consistent: true }],
        'operator-linebreak': ['error', 'after'],
        'no-console': 'off',
        'prefer-destructuring': 'off',
        'global-require': 0,
        'arrow-body-style': 0,
        'react/jsx-filename-extension': 0,
        'react/jsx-indent': [2, 4],
        'react/jsx-indent-props': [2, 4],
        'react-hooks/exhaustive-deps': 0,
        'indent': [2, 4],
        radix: 0,
        'react/prop-types': 0,
        'linebreak-style': 0,
        'react/no-array-index-key': 0,
        'react/jsx-one-expression-per-line': 0,
        'react/function-component-definition': [
            2, {
                namedComponents: "arrow-function",
                unnamedComponents: "arrow-function"
            }
        ]
    },
    ignorePatterns: ['.eslintrc.js'],
    parserOptions: {
        project: './tsconfig.eslint.json'
    }
};