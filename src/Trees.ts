import type { Position, TextDocumentChangeEvent } from "vscode";
import { Edit } from "web-tree-sitter";
import type { Parser, Point, Tree } from "web-tree-sitter";

export class Trees {
  private readonly trees = new Map<string, Tree>();

  get(uri: string): Tree | undefined {
    return this.trees.get(uri);
  }

  set(uri: string, tree: Tree): void {
    this.trees.set(uri, tree);
  }

  delete(uri: string): void {
    this.trees.delete(uri);
  }

  updateTree(parser: Parser, edit: TextDocumentChangeEvent): void {
    if (edit.contentChanges.length === 0) {
      return;
    }

    const uriString = edit.document.uri.toString();
    const old = this.trees.get(uriString);

    if (old == null) {
      throw new Error(`No existing tree for ${uriString}`);
    }

    for (const e of edit.contentChanges) {
      const startIndex = e.rangeOffset;
      const oldEndIndex = e.rangeOffset + e.rangeLength;
      const newEndIndex = e.rangeOffset + e.text.length;
      const startPos = edit.document.positionAt(startIndex);
      const oldEndPos = edit.document.positionAt(oldEndIndex);
      const newEndPos = edit.document.positionAt(newEndIndex);
      const startPosition = asPoint(startPos);
      const oldEndPosition = asPoint(oldEndPos);
      const newEndPosition = asPoint(newEndPos);
      const delta = new Edit({
        startIndex,
        oldEndIndex,
        newEndIndex,
        startPosition,
        oldEndPosition,
        newEndPosition,
      });
      old.edit(delta);
    }

    const tree = parser.parse(edit.document.getText(), old);

    if (tree == null) {
      throw new Error(`Failed to parse ${uriString}`);
    }

    this.trees.set(uriString, tree);
  }
}

function asPoint(pos: Position): Point {
  return { row: pos.line, column: pos.character };
}
