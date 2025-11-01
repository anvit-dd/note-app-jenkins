#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const lightningcssDir = path.join(projectRoot, "node_modules", "lightningcss");
const pkgDir = path.join(lightningcssDir, "pkg");
const indexPath = path.join(pkgDir, "index.js");

if (!fs.existsSync(lightningcssDir)) {
	process.exit(0);
}

if (fs.existsSync(indexPath)) {
	process.exit(0);
}

try {
	fs.mkdirSync(pkgDir, { recursive: true });
	const shim =
		[
			"'use strict';",
			"const wasm = require('lightningcss-wasm');",
			"module.exports = wasm;",
		].join("\n") + "\n";
	fs.writeFileSync(indexPath, shim, "utf8");
} catch (error) {
	console.warn("[setup-lightningcss-wasm] Failed to create wasm shim:", error);
	process.exit(0);
}
