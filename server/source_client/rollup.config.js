import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonJS from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import scss from 'rollup-plugin-scss';

const source = "./source_client";

const output = "./static/bundles";

const plugins=[
	typescript({ tsconfig: source+"/tsconfig.json" }),
	commonJS({

	}),
	nodeResolve({
		browser:true
	}),
	// terser()
]

export default [
	{
		input: source+'/pointset/add.ts',
		output: {
			sourcemap: true,
			file: output+'/pointset/bundle.js',
			format: 'es'
		},
		plugins: [scss({fileName: 'style.css'})].concat(plugins)
	},
	{
		input: source+'/pointset/edit.ts',
		output: {
			sourcemap: true,
			file: output+'/pointset/edit/bundle.js',
			format: 'es'
		},
		plugins: [scss({fileName: 'style.css'})].concat(plugins)
	},
	{
		input: source+'/experiment/index.ts',
		output: {
			sourcemap: true,
			file: output+'/experiment/index.js',
			format: 'es'
		},
		plugins: [scss({fileName: 'style.css'})].concat(plugins)
	},
	{
		input: source+'/deviceList/index.ts',
		output: {
			sourcemap: true,
			file: output+'/deviceList.js',
			format: 'es'
		},
		plugins: plugins
	},
	{
		input: source+'/experiment_start/index.ts',
		output: {
			sourcemap: true,
			file: output+'/experiment_start.js',
			format: 'es'
		},
		plugins: plugins
	}
];