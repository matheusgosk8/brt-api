import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

/**
 * Regras trazidas de `prototipo/` (.eslintrc.json + eslint.config.mjs),
 * adaptadas ao flat config (ESLint 9) deste projeto.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'src/db/migrations/**',
      'webpack.config.js',
      'drizzle.config.ts',
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // --- do .eslintrc.json do prototipo ---
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'prettier/prettier': 'warn',
      'import/prefer-default-export': 'off',
      'import/no-default-export': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
          typedefs: true,
        },
      ],
      'import/no-extraneous-dependencies': 'off',
    },
  },
  // entrypoints / configs que naturalmente usam default export
  {
    files: [
      'src/index.ts',
      'src/app.ts',
      'src/local/server.ts',
      'src/scripts/**/*.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
);
