import * as path from "node:path";
import type {
  ExtensionContext,
  TextDocument,
  TextDocumentChangeEvent,
} from "vscode";
import { window, workspace } from "vscode";
import type { Tree } from "web-tree-sitter";
import { Parser, Query, Language as TreeSitterLanguage } from "web-tree-sitter";
import {
  isLanguageDisabled,
  throwIfLanguageIsDisabled,
} from "./disabledLanguages";
import {
  DeprecatedError,
  LanguageFailedToLoad,
  UnsupportedLanguageError,
} from "./errors";
import { languages } from "./languages";
import { Trees } from "./Trees";
import { getWasmPath, isDocumentVisible } from "./utils";

// For some reason this crashes if we put it inside activate
// Fix: this isn't a field, suppress package member coloring like Go
const initParser = Parser.init();

export function activate(context: ExtensionContext) {
  // Parse of all visible documents
  const trees = new Trees();

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
    if (isLanguageDisabled(languageId)) {
      return false;
    }

    const absolute = getWasmPath(context.extensionPath, language.module);
    const wasm = path.relative(process.cwd(), absolute);

    await initParser;

    const lang = await TreeSitterLanguage.load(wasm);
    const parser = new Parser();
    parser.setLanguage(lang);
    language.parser = parser;

    return true;
  }

  /**
   * Open a document and parse it, returning the resulting tree
   * @param document the document to open
   * @returns the resulting tree, or undefined if the language couldn't be loaded
   */
  async function openDocument(
    document: TextDocument,
  ): Promise<Tree | undefined> {
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
  async function getTree(document: TextDocument): Promise<Tree> {
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
      throwIfLanguageIsDisabled(document.languageId);
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
  function createQuery(languageId: string, source: string): Query | undefined {
    const language = languages[languageId]?.parser?.language;
    if (language == null) {
      throwIfLanguageIsDisabled(languageId);
      return undefined;
    }
    return new Query(language, source);
  }

  // NOTE: if you make this an async function, it seems to cause edit anomalies
  function onChange(edit: TextDocumentChangeEvent) {
    const language = languages[edit.document.languageId];
    if (language?.parser != null) {
      trees.updateTree(language.parser, edit);
    }
  }

  async function openAllVisibleDocuments() {
    for (const editor of window.visibleTextEditors) {
      await openDocument(editor.document);
    }
  }

  async function openDocumentIfVisible(document: TextDocument) {
    if (isDocumentVisible(document)) {
      await openDocument(document);
    }
  }

  function closeDocument(document: TextDocument) {
    trees.delete(document.uri.toString());
  }

  context.subscriptions.push(
    window.onDidChangeVisibleTextEditors(openAllVisibleDocuments),
    workspace.onDidChangeTextDocument(onChange),
    workspace.onDidCloseTextDocument(closeDocument),
    workspace.onDidOpenTextDocument(openDocumentIfVisible),
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
