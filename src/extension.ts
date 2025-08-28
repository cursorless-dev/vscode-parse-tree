import * as vscode from "vscode";
import * as treeSitter from "web-tree-sitter";
import * as path from "path";
import * as fs from "fs";
import * as semver from "semver";
import { LanguageStillLoadingError, UnsupportedLanguageError } from "./errors";

interface Language {
  module: string;
  parser?: treeSitter.Parser;
}

// Be sure to declare the language in package.json and include a minimalist grammar.
const languages: {
  [id: string]: Language;
} = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "java-properties": { module: "tree-sitter-properties" },
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
};

// For some reason this crashes if we put it inside activate
const initParser = treeSitter.Parser.init(); // TODO this isn't a field, suppress package member coloring like Go

// Called when the extension is first activated by user opening a file with the appropriate language
export async function activate(context: vscode.ExtensionContext) {
  console.debug("Activating tree-sitter...");
  // Parse of all visible documents
  const trees: { [uri: string]: treeSitter.Tree } = {};

  /**
   * FIXME: On newer vscode versions some Tree sitter parser throws memory errors
   * https://github.com/cursorless-dev/cursorless/issues/2879
   * https://github.com/cursorless-dev/vscode-parse-tree/issues/110
   */
  const disabledLanguages = semver.gte(vscode.version, "1.98.0")
    ? new Set(["latex", "swift"])
    : null;

  const validateGetLanguage = (languageId: string) => {
    if (disabledLanguages?.has(languageId)) {
      throw new Error(
        `${languageId} is disabled on vscode versions >= 1.98.0. See https://github.com/cursorless-dev/cursorless/issues/2879`
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
    if (language == null) {
      return false;
    }
    if (language.parser != null) {
      return true;
    }

    if (disabledLanguages?.has(languageId)) {
      return false;
    }

    let absolute;
    if (path.isAbsolute(language.module)) {
      absolute = language.module;
    } else {
      absolute = path.join(
        context.extensionPath,
        "parsers",
        language.module + ".wasm"
      );
    }

    if (!fs.existsSync(absolute)) {
      throw Error(`Parser for ${languageId} not found at ${absolute}`);
    }

    const wasm = path.relative(process.cwd(), absolute);
    await initParser;
    const lang = await treeSitter.Language.load(wasm);
    const parser = new treeSitter.Parser();
    parser.setLanguage(lang);
    language.parser = parser;

    return true;
  }

  async function open(document: vscode.TextDocument) {
    const uriString = document.uri.toString();
    if (uriString in trees) {
      return;
    }

    if (!(await loadLanguage(document.languageId))) {
      return;
    }

    const language = languages[document.languageId];
    const t = language.parser?.parse(document.getText());
    if (t == null) {
      throw Error(`Failed to parse ${document.uri}`);
    }
    trees[uriString] = t;
  }

  function openIfLanguageLoaded(document: vscode.TextDocument) {
    const uriString = document.uri.toString();
    if (uriString in trees) {
      return null;
    }

    const language = languages[document.languageId];
    if (language?.parser == null) {
      return null;
    }

    const t = language.parser.parse(document.getText());
    if (t == null) {
      throw Error(`Failed to parse ${document.uri}`);
    }
    trees[uriString] = t;
    return t;
  }

  // NOTE: if you make this an async function, it seems to cause edit anomalies
  function edit(edit: vscode.TextDocumentChangeEvent) {
    const language = languages[edit.document.languageId];
    if (language == null || language.parser == null) {
      return;
    }
    updateTree(language.parser, edit);
  }

  function updateTree(
    parser: treeSitter.Parser,
    edit: vscode.TextDocumentChangeEvent
  ) {
    if (edit.contentChanges.length === 0) {
      return;
    }
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
    const t = parser.parse(edit.document.getText(), old);
    if (t == null) {
      throw Error(`Failed to parse ${edit.document.uri}`);
    }
    trees[edit.document.uri.toString()] = t;
  }

  function asPoint(pos: vscode.Position): treeSitter.Point {
    return { row: pos.line, column: pos.character };
  }

  function close(document: vscode.TextDocument) {
    delete trees[document.uri.toString()];
  }

  async function colorAllOpen() {
    for (const editor of vscode.window.visibleTextEditors) {
      await open(editor.document);
    }
  }

  function openIfVisible(document: vscode.TextDocument) {
    if (
      vscode.window.visibleTextEditors.some(
        (editor) => editor.document.uri.toString() === document.uri.toString()
      )
    ) {
      return open(document);
    }
  }

  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors(colorAllOpen)
  );
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(edit));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(close));
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(openIfVisible)
  );
  // Don't wait for the initial color, it takes too long to inspect the themes and causes VSCode extension host to hang
  colorAllOpen();

  function getTreeForUri(uri: vscode.Uri) {
    const ret = trees[uri.toString()];

    if (ret == null) {
      const document = vscode.workspace.textDocuments.find(
        (textDocument) => textDocument.uri.toString() === uri.toString()
      );

      if (document == null) {
        throw new Error(`Document ${uri} is not open`);
      }

      const ret = openIfLanguageLoaded(document);

      if (ret != null) {
        return ret;
      }

      const languageId = document.languageId;

      if (languageId in languages) {
        validateGetLanguage(document.languageId);
        throw new LanguageStillLoadingError(languageId);
      } else {
        throw new UnsupportedLanguageError(languageId);
      }
    }

    return ret;
  }

  return {
    loadLanguage,

    /**
     * @deprecated
     */
    getLanguage(languageId: string): treeSitter.Language | undefined {
      console.warn(
        "vscode-parse-tree: getLanguage is deprecated, use createQuery(languageId, source) instead."
      );
      validateGetLanguage(languageId);
      return languages[languageId]?.parser?.language ?? undefined;
    },

    createQuery(
      languageId: string,
      source: string
    ): treeSitter.Query | undefined {
      const language = languages[languageId]?.parser?.language;
      if (language == null) {
        validateGetLanguage(languageId);
        return undefined;
      }
      return new treeSitter.Query(language, source);
    },

    /**
     * Register a parser wasm file for a language not supported by this
     * extension. Note that {@link wasmPath} must be an absolute path, and
     * {@link languageId} must not already have a registered parser.
     * @param languageId The VSCode language id that you'd like to register a
     * parser for
     * @param wasmPath The absolute path to the wasm file for your parser
     */
    registerLanguage(languageId: string, wasmPath: string) {
      if (languages[languageId] != null) {
        throw new Error(`Language id '${languageId}' is already registered`);
      }

      languages[languageId] = { module: wasmPath };
      colorAllOpen();
    },

    getTree(document: vscode.TextDocument) {
      return getTreeForUri(document.uri);
    },

    getTreeForUri,

    getNodeAtLocation(location: vscode.Location) {
      return getTreeForUri(location.uri).rootNode.descendantForPosition({
        row: location.range.start.line,
        column: location.range.start.character,
      });
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {
  // Empty
}
