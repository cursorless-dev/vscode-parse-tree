import { defineConfig } from "oxlint";

const disabledRules = [
  "eslint/arrow-body-style",
  "eslint/capitalized-comments",
  "eslint/complexity",
  "eslint/id-length",
  "eslint/init-declarations",
  "eslint/max-classes-per-file",
  "eslint/max-lines-per-function",
  "eslint/max-lines",
  "eslint/max-params",
  "eslint/max-statements",
  "eslint/no-console",
  "eslint/no-continue",
  "eslint/no-eq-null",
  "eslint/no-magic-numbers",
  "eslint/no-negated-condition",
  "eslint/no-plusplus",
  "eslint/no-ternary",
  "eslint/no-undefined",
  "eslint/no-use-before-define",
  "eslint/no-void",
  "eslint/prefer-destructuring",
  "eslint/sort-imports",
  "eslint/sort-keys",
  "func-style",
  "import/exports-last",
  "import/group-exports",
  "import/max-dependencies",
  "import/no-named-export",
  "import/no-namespace",
  "import/no-nodejs-modules",
  "import/no-relative-parent-imports",
  "import/prefer-default-export",
  "oxc/no-async-await",
  "oxc/no-optional-chaining",
  "oxc/no-rest-spread-properties",
  "promise/prefer-await-to-callbacks",
  "typescript/explicit-function-return-type",
  "typescript/parameter-properties",
  "typescript/prefer-readonly-parameter-types",
  "typescript/promise-function-async",
  "typescript/strict-void-return",
  "unicorn/filename-case",
  "unicorn/no-array-for-each",
  "unicorn/no-lonely-if",
  "unicorn/no-null",
  "unicorn/prefer-at",
  "unicorn/prefer-spread",
  "unicorn/switch-case-braces",
];

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  ignorePatterns: ["src/typings"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  env: {
    node: true,
  },
  plugins: [
    "eslint",
    "typescript",
    "unicorn",
    "oxc",
    "import",
    "node",
    "promise",
  ],
  categories: {
    correctness: "warn",
    suspicious: "warn",
    pedantic: "warn",
    perf: "warn",
    style: "warn",
    restriction: "warn",
    nursery: "warn",
  },

  rules: {
    ...Object.fromEntries(disabledRules.map((r) => [r, "off"])),
    "eslint/no-duplicate-imports": [
      "warn",
      {
        allowSeparateTypeImports: true,
      },
    ],
    "eslint/no-restricted-imports": [
      "warn",
      {
        paths: [
          {
            name: "node:assert",
            message: "Use node:assert/strict instead",
          },
        ],
      },
    ],
    "eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      },
    ],
    "typescript/strict-boolean-expressions": [
      "warn",
      {
        allowNullableBoolean: true,
      },
    ],
    eqeqeq: [
      "warn",
      "always",
      {
        null: "never",
      },
    ],
  },
});
