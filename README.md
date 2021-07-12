# Parse tree

Exposes an api function that can be used to get a parse tree node for a given
file location.  Can be used as follows:

```ts
  const parseTreeExtension = vscode.extensions.getExtension("pokey.parse-tree");

  if (parseTreeExtension == null) {
    throw new Error("Depends on pokey.parse-tree extension");
  }

  const { getNodeAtLocation } = await parseTreeExtension.activate();
```

Don't forget to add add an `extensionDependencies`-entry to `package.json`  as
described in
https://code.visualstudio.com/api/references/vscode-api#extensions.

## Contributing

### Setup

1. `yarn`
2. Install [emscripten](https://emscripten.org/docs/getting_started/downloads.html) for generating parser wasm files

### Adding a new language

It's straightforward to add any [language with a tree-sitter grammar](https://tree-sitter.github.io/tree-sitter/).

1. Add a dependency on the npm package for that language: `yarn add -D tree-sitter-yourlang`.
2. Add a language to the dictionary at the top of `./src/extension.ts`
3. Add a reference to `onLanguage:yourlang` to the [activationEvents section of package.json](package.json). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
4. Add your language to the top of the [Makefile](Makefile)
5. Hit `F5` in VSCode, with this project open, to test your changes.
6. Submit a PR!

# Release notes

## 0.4.0
Add support for untrusted workspaces

## 0.3.0
Switch to wasm to support Windows and Remote SSH

## 0.2.0
- Add JSON parser

# Credits

Forked from https://github.com/georgewfraser/vscode-tree-sitter.
