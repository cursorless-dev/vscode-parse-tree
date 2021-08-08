import * as vscode from "vscode";
import * as Parser from "web-tree-sitter";
import * as path from "path";

// Be sure to declare the language in package.json and include a minimalist grammar.
const languages: {
  [id: string]: {
    module: string;
    parser?: Parser;
  };
} = {
  bash: { module: "tree-sitter-bash" },
  c: { module: "tree-sitter-c" },
  cpp: { module: "tree-sitter-cpp" },
  csharp: { module: "tree-sitter-c-sharp" },
  go: { module: "tree-sitter-go" },
  html: { module: "tree-sitter-html" },
  java: { module: "tree-sitter-java" },
  javascript: { module: "tree-sitter-javascript" },
  javascriptreact: { module: "tree-sitter-javascript" },
  json: { module: "tree-sitter-json" },
  jsonc: { module: "tree-sitter-json" },
  markdown: { module: "tree-sitter-markdown" },
  python: { module: "tree-sitter-python" },
  ruby: { module: "tree-sitter-ruby" },
  rust: { module: "tree-sitter-rust" },
  typescript: { module: "tree-sitter-typescript" },
  typescriptreact: { module: "tree-sitter-tsx" },
  xml: { module: "tree-sitter-html" },
  yaml: { module: "tree-sitter-yaml" },
};

// For some reason this crashes if we put it inside activate
const initParser = Parser.init(); // TODO this isn't a field, suppress package member coloring like Go

// Called when the extension is first activated by user opening a file with the appropriate language
export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating tree-sitter...");
  // Parse of all visible documents
  const trees: { [uri: string]: Parser.Tree } = {};

  async function open(editor: vscode.TextEditor) {
    const language = languages[editor.document.languageId];
    if (language == null) return;
    if (language.parser == null) {
      const absolute = path.join(
        context.extensionPath,
        "parsers",
        language.module + ".wasm"
      );
      const wasm = path.relative(process.cwd(), absolute);
      const lang = await Parser.Language.load(wasm);
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
    await initParser;
    colorAllOpen();
  }
  activateLazily();

  function getTreeForUri(uri: vscode.Uri) {
    const ret = trees[uri.toString()];
    if (typeof ret === "undefined") {
      throw new Error(
        "Language not supported by parse tree extension.  See https://github.com/pokey/vscode-parse-tree#adding-a-new-language"
      );
    }
    return ret;
  }

  return {
    getTree(document: vscode.TextDocument) {
      return getTreeForUri(document.uri);
    },

    getNodeAtLocation(location: vscode.Location) {
      return getTreeForUri(location.uri).rootNode.descendantForPosition({
        row: location.range.start.line,
        column: location.range.start.character,
      });
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}
