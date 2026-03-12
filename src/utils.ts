import type { TextDocument } from "vscode";
import { window } from "vscode";

export function isDocumentVisible(document: TextDocument): boolean {
  const uriString = document.uri.toString();
  return window.visibleTextEditors.some(
    (editor) => editor.document.uri.toString() === uriString,
  );
}
