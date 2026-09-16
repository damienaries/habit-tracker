import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
	// Generated output and vendored function bundles — linting them buried the
	// handful of real findings under ~170 errors nobody could act on.
	{ ignores: ['dist', 'dev-dist', '.netlify', '**/node_modules'] },
	{
		files: ['**/*.{js,jsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: { ...globals.browser, __BUILD_REF__: 'readonly', __BUILD_TIME__: 'readonly' },
			parserOptions: {
				ecmaVersion: 'latest',
				ecmaFeatures: { jsx: true },
				sourceType: 'module',
			},
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			...js.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
		},
	},
	{
		files: ['**/sw.js'],
		languageOptions: {
			globals: globals.serviceworker,
		},
	},
	{
		// Tests run under Node, so Buffer and friends are available.
		files: ['**/*.test.{js,jsx}'],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
	},
	{
		// Config files run in Node, not the browser.
		files: ['vite.config.js', 'vitest.config.js', 'eslint.config.js', 'postcss.config.js'],
		languageOptions: { globals: globals.node },
	},
	{
		files: ['netlify/functions/**/*.js'],
		languageOptions: {
			globals: globals.node,
			parserOptions: {
				sourceType: 'commonjs',
			},
		},
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
	prettier,
];
