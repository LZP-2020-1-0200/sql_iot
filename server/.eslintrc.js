export default{
    "root": true,
    "parser": "@typescript-eslint/parser",
    "plugins": [
      "@typescript-eslint",
      "import"
    ],
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended"
    ],
    "parserOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module",
	  "tsconfigRootDir": __dirname + '/server',
      "project":["./source/tsconfig.json", "./source_client/tsconfig.json"]
    },
    "rules": {
      "indent": "off",
		"no-tabs": "off",
		"@typescript-eslint/indent": ["error", "tab", {
			"SwitchCase": 1,
			"MemberExpression": 1,
			"ignoredNodes": [
				"FunctionExpression > .params[decorators.length > 0]",
				"FunctionExpression > .params > :matches(Decorator, :not(:first-child))",
				"ClassBody.body > PropertyDefinition[decorators.length > 0] > .key"
			]
		}],
		"@typescript-eslint/semi": ["error", "always"],
		"@typescript-eslint/member-delimiter-style": ["error", {
			"multiline": {
			  "delimiter": "semi",
			  "requireLast": true
			},
			"singleline": {
			  "delimiter": "semi",
			  "requireLast": false
			},
			"multilineDetection": "brackets"
		}],
		"@typescript-eslint/no-empty-interface": [
			"error",
			{
			  "allowSingleExtends": false
			}
		],
		"@typescript-eslint/no-misused-promises": [
			"error",
			{
			  "checksVoidReturn": {
				"arguments": false,
				"attributes": false
			  }
			}
		],
		"no-warning-comments": [
			"warn",
			{
			  "terms": ["todo", "fixme"],
			  "location": "start"
			}
		],
		"@typescript-eslint/consistent-type-imports": "error",
    "import/extensions":["error", "ignorePackages"]
    }
  }