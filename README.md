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

In order to get it to build, you need to run the following:

```sh
yarn
./scripts/patch-tree-sitter
$(npm bin)/electron-rebuild -v $ELECTRON_VERSION
```

where `ELECTRON_VERSION` needs to be set to the current electron version of VSCode (via the about VSCode menu).

Note: the second step (`patch-tree-sitter`) will be necessary until https://github.com/tree-sitter/node-tree-sitter/pull/83 is merged.

### Adding a new language

It's straightforward to add any [language with a tree-sitter grammar](https://tree-sitter.github.io/tree-sitter/).

1. Add a dependency on the npm package for that language: `yarn add tree-sitter-yourlang`.
3. Add a language to the dictionary at the top of `./src/extension.ts`
4. Add a reference to `onLanguage:yourlang` to the [activationEvents section of package.json](https://github.com/georgewfraser/vscode-tree-sitter/blob/fb4400b78481845c6a8497d079508d28aea25c19/package.json#L18). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
5. Hit `F5` in VSCode, with this project open, to test your changes.
6. Submit a PR!

# Credits

Forked from https://github.com/georgewfraser/vscode-tree-sitter.
