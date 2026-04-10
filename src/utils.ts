import * as fs from "node:fs";
import * as path from "node:path";
import type { TextDocument, Uri } from "vscode";
import { window, workspace } from "vscode";
import type { Parser, Tree } from "web-tree-sitter";
import { DocumentNotOpenError, FailedToParseError } from "./errors";

export function isDocumentVisible(document: TextDocument): boolean {
  const uriString = document.uri.toString();
  return window.visibleTextEditors.some(
    (editor) => editor.document.uri.toString() === uriString,
  );
}

export function getOpenDocument(uri: Uri): TextDocument {
  const uriString = uri.toString();
  const document = workspace.textDocuments.find(
    (doc) => doc.uri.toString() === uriString,
  );

  if (document == null) {
    throw new DocumentNotOpenError(uri);
  }

  return document;
}

export function getWasmPath(extensionPath: string, moduleName: string): string {
  const absolute = path.join(extensionPath, "parsers", `${moduleName}.wasm`);

  if (!fs.existsSync(absolute)) {
    throw new Error(`Parser ${moduleName} not found at ${absolute}`);
  }

  return absolute;
}

export function parseDocument(parser: Parser, document: TextDocument): Tree {
  const tree = parser.parse(document.getText());

  if (tree == null) {
    throw new FailedToParseError(document.uri);
  }

  return tree;
}
