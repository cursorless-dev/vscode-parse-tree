import * as vscode from "vscode";
import * as Parser from "tree-sitter";

// Be sure to declare the language in package.json and include a minimalist grammar.
const languages: {
  [id: string]: {
    loadLanguage: () => any;
    parser?: Parser;
  };
} = {
  go: { loadLanguage: () => require("tree-sitter-go") },
  cpp: { loadLanguage: () => require("tree-sitter-cpp") },
  rust: { loadLanguage: () => require("tree-sitter-rust") },
  ruby: { loadLanguage: () => require("tree-sitter-ruby") },
  python: { loadLanguage: () => require("tree-sitter-python") },
  typescript: {
    loadLanguage: () => require("tree-sitter-typescript").typescript,
  },
  typescriptreact: {
    loadLanguage: () => require("tree-sitter-typescript").tsx,
  },
  json: {
    loadLanguage: () => require("tree-sitter-json"),
  },
  javascript: {
    loadLanguage: () => require("tree-sitter-javascript"),
  },
  javascriptreact: {
    loadLanguage: () => require("tree-sitter-javascript"),
  },
};

// Called when the extension is first activated by user opening a file with the appropriate language
export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating tree-sitter...");
  // Parse of all visible documents
  const trees: { [uri: string]: Parser.Tree } = {};

  async function open(editor: vscode.TextEditor) {
    const language = languages[editor.document.languageId];
    if (language == null) return;
    if (language.parser == null) {
      const lang = language.loadLanguage();
      const parser = new Parser();
      parser.setLanguage(lang);
      language.parser = parser;
    }
    const t = language.parser.parse(editor.document.getText()); // TODO don't use getText, use Parser.Input
    trees[editor.document.uri.toString()] = t;
  }

  // NOTE: if you make this an async function, it seems to cause edit anomalies
  function edit(edit: vscode.TextDocumentChangeEvent) {
    const language = languages[edit.document.languageId];
    if (language == null || language.parser == null) return;
    updateTree(language.parser, edit);
  }

  function updateTree(parser: Parser, edit: vscode.TextDocumentChangeEvent) {
    if (edit.contentChanges.length == 0) return;
    const old = trees[edit.document.uri.toString()];
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
      const delta = {
        startIndex,
        oldEndIndex,
        newEndIndex,
        startPosition,
        oldEndPosition,
        newEndPosition,
      };
      old.edit(delta);
    }
    const t = parser.parse(edit.document.getText(), old); // TODO don't use getText, use Parser.Input
    trees[edit.document.uri.toString()] = t;
  }
  function asPoint(pos: vscode.Position): Parser.Point {
    return { row: pos.line, column: pos.character };
  }
  function close(doc: vscode.TextDocument) {
    delete trees[doc.uri.toString()];
  }

  async function colorAllOpen() {
    for (const editor of vscode.window.visibleTextEditors) {
      await open(editor);
    }
  }
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(colorAllOpen)
  );
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close));
  // Don't wait for the initial color, it takes too long to inspect the themes and causes VSCode extension host to hang
  async function activateLazily() {
    colorAllOpen();
  }
  activateLazily();

  return {
    getTree(document: vscode.TextDocument) {
      return trees[document.uri.toString()];
    },

    getNodeAtLocation(location: vscode.Location) {
      return trees[location.uri.toString()].rootNode.descendantForPosition({
        row: location.range.start.line,
        column: location.range.start.character,
      });
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}
