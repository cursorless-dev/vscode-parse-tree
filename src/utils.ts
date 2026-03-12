import * as fs from "node:fs";
import * as path from "node:path";
import type { TextDocument } from "vscode";
import { window } from "vscode";

export function isDocumentVisible(document: TextDocument): boolean {
  const uriString = document.uri.toString();
  return window.visibleTextEditors.some(
    (editor) => editor.document.uri.toString() === uriString,
  );
}

export function getWasmPath(extensionPath: string, moduleName: string): string {
  const absolute = path.join(extensionPath, "parsers", moduleName + ".wasm");

  if (!fs.existsSync(absolute)) {
    throw Error(`Parser ${moduleName} not found at ${absolute}`);
  }

  return absolute;
}
