import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import * as vscode from "vscode";
import * as treeSitter from "web-tree-sitter";
import {
  DeprecatedError,
  LanguageFailedToLoad,
  UnsupportedLanguageError,
} from "./errors";
import { Trees } from "./Trees";
import { isDocumentVisible } from "./utils";
import type { Language } from "./types";

/* eslint-disable @typescript-eslint/naming-convention */

// Be sure to declare the language in package.json
const languages: Record<string, Language | undefined> = {
  "java-properties": { module: "tree-sitter-properties" },
  "talon-list": { module: "tree-sitter-talon" },
  agda: { module: "tree-sitter-agda" },
  c: { module: "tree-sitter-c" },
  clojure: { module: "tree-sitter-clojure" },
  cpp: { module: "tree-sitter-cpp" },
  csharp: { module: "tree-sitter-c_sharp" },
  css: { module: "tree-sitter-css" },
  dart: { module: "tree-sitter-dart" },
  elixir: { module: "tree-sitter-elixir" },
  elm: { module: "tree-sitter-elm" },
  gdscript: { module: "tree-sitter-gdscript" },
  gleam: { module: "tree-sitter-gleam" },
  go: { module: "tree-sitter-go" },
  haskell: { module: "tree-sitter-haskell" },
  html: { module: "tree-sitter-html" },
  java: { module: "tree-sitter-java" },
  javascript: { module: "tree-sitter-javascript" },
  javascriptreact: { module: "tree-sitter-javascript" },
  json: { module: "tree-sitter-json" },
  jsonc: { module: "tree-sitter-json" },
  jsonl: { module: "tree-sitter-json" },
  julia: { module: "tree-sitter-julia" },
  kotlin: { module: "tree-sitter-kotlin" },
  latex: { module: "tree-sitter-latex" },
  lua: { module: "tree-sitter-lua" },
  markdown: { module: "tree-sitter-markdown" },
  nix: { module: "tree-sitter-nix" },
  perl: { module: "tree-sitter-perl" },
  php: { module: "tree-sitter-php" },
  properties: { module: "tree-sitter-properties" },
  python: { module: "tree-sitter-python" },
  r: { module: "tree-sitter-r" },
  ruby: { module: "tree-sitter-ruby" },
  rust: { module: "tree-sitter-rust" },
  scala: { module: "tree-sitter-scala" },
  scm: { module: "tree-sitter-query" },
  scss: { module: "tree-sitter-scss" },
  shellscript: { module: "tree-sitter-bash" },
  sparql: { module: "tree-sitter-sparql" },
  starlark: { module: "tree-sitter-python" },
  swift: { module: "tree-sitter-swift" },
  talon: { module: "tree-sitter-talon" },
  terraform: { module: "tree-sitter-hcl" },
  typescript: { module: "tree-sitter-typescript" },
  typescriptreact: { module: "tree-sitter-tsx" },
  xml: { module: "tree-sitter-xml" },
  yaml: { module: "tree-sitter-yaml" },
  zig: { module: "tree-sitter-zig" },
};

// For some reason this crashes if we put it inside activate
// Fix: this isn't a field, suppress package member coloring like Go
const initParser = treeSitter.Parser.init();

export function activate(context: vscode.ExtensionContext) {
  // Parse of all visible documents
  const trees = new Trees();

  /**
   * FIXME: On newer vscode versions some Tree sitter parser throws memory errors
   * https://github.com/cursorless-dev/cursorless/issues/2879
   * https://github.com/cursorless-dev/vscode-parse-tree/issues/110
   */
  const disabledLanguages =
    semver.lt(vscode.version, "1.107.0") && semver.gte(vscode.version, "1.98.0")
      ? new Set(["latex", "swift"])
      : null;

  const validateGetLanguage = (languageId: string) => {
    if (disabledLanguages?.has(languageId)) {
      throw new Error(
        `${languageId} is disabled on vscode versions 1.98.0 through 1.06.3. See https://github.com/cursorless-dev/cursorless/issues/2879`,
      );
    }
  };

  /**
   * Load the parser model for a given language
   * @param languageId The vscode language id of the language to load
   * @returns a promise resolving to boolean an indicating whether the language could be loaded
   */
  async function loadLanguage(languageId: string) {
    const language = languages[languageId];

    // Language without a parser, e.g. plaintext
    if (language == null) {
      return false;
    }

    // Already loaded
    if (language.parser != null) {
      return true;
    }

    // Disabled on certain vscode versions due to memory errors in tree-sitter parsers
    if (disabledLanguages?.has(languageId)) {
      return false;
    }

    const absolute = getWasmPath(language.module);
    const wasm = path.relative(process.cwd(), absolute);

    await initParser;

    const lang = await treeSitter.Language.load(wasm);
    const parser = new treeSitter.Parser();
    parser.setLanguage(lang);
    language.parser = parser;

    return true;
  }

  function getWasmPath(moduleName: string): string {
    const absolute = path.join(
      context.extensionPath,
      "parsers",
      moduleName + ".wasm",
    );

    if (!fs.existsSync(absolute)) {
      throw Error(`Parser ${moduleName} not found at ${absolute}`);
    }

    return absolute;
  }

  /**
   * Open a document and parse it, returning the resulting tree
   * @param document the document to open
   * @returns the resulting tree, or undefined if the language couldn't be loaded
   */
  async function openDocument(
    document: vscode.TextDocument,
  ): Promise<treeSitter.Tree | undefined> {
    const uriString = document.uri.toString();
    let tree = trees.get(uriString);

    // Document is already opened
    if (tree != null) {
      return tree;
    }

    // Couldn't load language, skip opening document
    if (!(await loadLanguage(document.languageId))) {
      return undefined;
    }

    const language = languages[document.languageId];

    if (language?.parser == null) {
      throw new Error(`No parser for language ${document.languageId}`);
    }

    tree = language.parser?.parse(document.getText()) ?? undefined;

    if (tree == null) {
      throw Error(`Failed to parse ${uriString}`);
    }

    trees.set(uriString, tree);

    return tree;
  }

  /**
   * Get the parse tree for a given document, parsing it if necessary
   * @param document the document to get the tree for
   * @returns the parse tree for the document
   */
  async function getTree(
    document: vscode.TextDocument,
  ): Promise<treeSitter.Tree> {
    const uriString = document.uri.toString();
    let tree = trees.get(uriString);

    if (tree != null) {
      return tree;
    }

    tree = await openDocument(document);

    if (tree != null) {
      return tree;
    }

    if (document.languageId in languages) {
      validateGetLanguage(document.languageId);
      throw new LanguageFailedToLoad(document.languageId);
    }

    throw new UnsupportedLanguageError(document.languageId);
  }

  /**
   * Create a tree-sitter query for a given language and query source
   * @param languageId the vscode language id of the language to create the query for
   * @param source the source of the query
   * @returns the created query, or undefined if the language couldn't be loaded
   */
  function createQuery(
    languageId: string,
    source: string,
  ): treeSitter.Query | undefined {
    const language = languages[languageId]?.parser?.language;
    if (language == null) {
      validateGetLanguage(languageId);
      return undefined;
    }
    return new treeSitter.Query(language, source);
  }

  // NOTE: if you make this an async function, it seems to cause edit anomalies
  function onChange(edit: vscode.TextDocumentChangeEvent) {
    const language = languages[edit.document.languageId];
    if (language?.parser != null) {
      trees.updateTree(language.parser, edit);
    }
  }

  async function openAllVisibleDocuments() {
    for (const editor of vscode.window.visibleTextEditors) {
      await openDocument(editor.document);
    }
  }

  async function openDocumentIfVisible(document: vscode.TextDocument) {
    if (isDocumentVisible(document)) {
      await openDocument(document);
    }
  }

  function closeDocument(document: vscode.TextDocument) {
    trees.delete(document.uri.toString());
  }

  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(openAllVisibleDocuments),
    vscode.workspace.onDidChangeTextDocument(onChange),
    vscode.workspace.onDidCloseTextDocument(closeDocument),
    vscode.workspace.onDidOpenTextDocument(openDocumentIfVisible),
  );

  // Don't wait for the initial load, it takes too long to inspect the themes and causes VSCode extension host to hang
  void openAllVisibleDocuments();

  return {
    loadLanguage,
    getTree,
    createQuery,

    getLanguage() {
      throw new DeprecatedError("getLanguage");
    },
    getTreeForUri() {
      throw new DeprecatedError("getTreeForUri");
    },
    getNodeAtLocation() {
      throw new DeprecatedError("getNodeAtLocation");
    },
    registerLanguage() {
      throw new DeprecatedError("registerLanguage");
    },
  };
}
