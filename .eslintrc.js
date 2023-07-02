"use strict"

/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: "plugin:@eslint-community/mysticatea/es2018",
    parserOptions: {
        project: "./tsconfig.eslint.json",
    },
    settings: {
        node: {
            tryExtensions: [
                ".js",
                ".json",
                ".mjs",
                ".node",
                ".ts",
                ".tsx",
                ".vue",
            ],
        },
    },
    rules: {
        // TSC does this
        "no-redeclare": "off",
        // https://github.com/typescript-eslint/typescript-eslint/issues/743
        "@eslint-community/mysticatea/ts/unbound-method": "off",

        // Temporary disabled rule: Making a type stricter requires a breaking change of the types.
        "@eslint-community/mysticatea/ts/prefer-readonly-parameter-types":
            "off",
        // Should be fixed by `@eslint-community/eslint-plugin-mysticatea`
        "no-duplicate-imports": "off",
        "@eslint-community/mysticatea/ts/no-duplicate-imports": [
            "error",
            { includeExports: true },
        ],
    },
    overrides: [
        {
            files: "./scripts/clone-without-circular.ts",
            // Temporarily disable these rules until we fix the `any` usage
            rules: {
                "@eslint-community/mysticatea/eslint-comments/no-use": "off",
                "@eslint-community/mysticatea/ts/no-unsafe-argument": "off",
                "@eslint-community/mysticatea/ts/no-unsafe-assignment": "off",
                "@eslint-community/mysticatea/ts/no-unsafe-member-access":
                    "off",
                "@eslint-community/mysticatea/ts/no-unsafe-return": "off",
            },
        },
        {
            files: ["./scripts/extract-test262.ts"],
            // Disables rules that cannot resolve reports due to missing library type definitions.
            rules: {
                "@eslint-community/mysticatea/ts/ban-ts-comment": "off",
                "@eslint-community/mysticatea/ts/no-unsafe-assignment": "off",
                "@eslint-community/mysticatea/ts/no-unsafe-call": "off",
            },
        },

        {
            files: "./src/unicode/ids.ts",
            rules: {
                curly: "off",
                "no-misleading-character-class": "off",
            },
        },
        {
            files: "./src/unicode/property-data.ts",
            rules: {
                "@eslint-community/mysticatea/ts/camelcase": "off",
            },
        },
    ],
}
