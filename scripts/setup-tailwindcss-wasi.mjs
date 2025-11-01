#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const oxideDir = path.join(projectRoot, 'node_modules', '@tailwindcss', 'oxide');
const wasiBindingPath = path.join(oxideDir, 'tailwindcss-oxide.wasi.cjs');

if (!fs.existsSync(oxideDir)) {
	process.exit(0);
}

if (fs.existsSync(wasiBindingPath)) {
	process.exit(0);
}

try {
	// Check if wasm32-wasi is installed (it likely won't be on x64, but if cross-compilation tooling exists, use it)
	const wasmPkg = path.join(projectRoot, 'node_modules', '@tailwindcss', 'oxide-wasm32-wasi', 'index.js');
	if (fs.existsSync(wasmPkg)) {
		const shim = "module.exports = require('@tailwindcss/oxide-wasm32-wasi');\n";
		fs.writeFileSync(wasiBindingPath, shim, 'utf8');
		process.exit(0);
	}

	// Otherwise, provide a fallback that uses the native binding as-is
	// The oxide loader will eventually try to require the actual binding
	const fallback = [
		"// WASI fallback shim for arm64 builds",
		"try {",
		"  const wasmWasi = require('@tailwindcss/oxide-wasm32-wasi');",
		"  module.exports = wasmWasi;",
		"} catch {",
		"  // If WASI not available, throw with helpful message",
		"  throw new Error(",
		"    'WASI binding not available for arm64. Install @tailwindcss/oxide-wasm32-wasi or use a supported platform.',",
		"    { cause: new Error('arm64 native binding missing') }",
		"  );",
		"}",
	].join('\n') + '\n';
	fs.writeFileSync(wasiBindingPath, fallback, 'utf8');
} catch (error) {
	console.warn('[setup-tailwindcss-wasi] Failed to create wasi shim:', error);
	process.exit(0);
}
