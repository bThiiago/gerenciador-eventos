module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true
        },
        'ecmaVersion': 12,
        'sourceType': 'module'
    },
    'plugins': [
        'react',
        '@typescript-eslint'
    ],
    'rules': {
        'indent': ['off'],
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/ban-ts-comment': ['warn'],
        '@typescript-eslint/no-explicit-any': ['off'],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};
