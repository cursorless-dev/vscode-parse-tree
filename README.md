# Parse tree

Exposes an api function that can be used to get a parse tree node for a given file location.

## Usage

Can be used as follows:

```ts
const parseTreeExtension = vscode.extensions.getExtension("pokey.parse-tree");

if (parseTreeExtension == null) {
  throw new Error("Depends on pokey.parse-tree extension");
}

const { getNodeAtLocation } = await parseTreeExtension.activate();
```

Don't forget to add an `extensionDependencies`-entry to `package.json` as
described in
https://code.visualstudio.com/api/references/vscode-api#extensions.

### Parsing a custom language

If you'd like to add support for a new language, see the [Adding a new language](#adding-a-new-language) section below. Alternatively, your extension can register a custom language with this extension. Although this is not the preferred way to add a new language, it can be convenient when you have a parser that you don't believe belongs in the main extension.

Parsing your own language is as simple as registering your `languageId` with an absolute path to your `.wasm` file:

```ts
const { registerLanguage } = await parseTreeExtension.activate();

registerLanguage(languageId, wasmPath);
```

## Contributing

### Setup

1. `yarn`
2. Install [emscripten](https://emscripten.org/docs/getting_started/downloads.html) for generating parser wasm files

### Adding a new language

It's straightforward to add any [language with a tree-sitter grammar](https://tree-sitter.github.io/tree-sitter/).

1. Add a dependency on the npm package for that language in [tree-sitter-wasms](https://github.com/cursorless-dev/tree-sitter-wasms)
2. Add a language to the dictionary at the top of `./src/extension.ts`
3. Add a reference to `onLanguage:yourlang` to the [activationEvents section of package.json](package.json). `yourlang` must be a [VSCode language identifier](https://code.visualstudio.com/docs/languages/identifiers).
4. Run `yarn compile`, then hit `F5` in VSCode, with this project open, to test your changes.
5. Submit a PR!

### Developing on WSL2

When working with WSL, the host vscode instance connects to a vscode server on the WSL vm. This happens automatically when you run "code" in WSL, as long as you have the "Remote - WSL" extension installed on the host. From there you need to:

- Install the `pokey.command-server` extension on the host vscode
- Clone the extension in the WSL side.
- If you're adding language support to `vscode-parse-tree`, you need to clone that as well, build it, and link it into the `vscode-server` extension folder: `ln -s ~/your/code/vscode-parse-tree ~/.vscode-server/extensions/parse-tree` for instance.
- If you get errors about needing to install the `Remote-WSL` extension, you might need to manually delete the extension from the host side and try again.

## Change Log

See [CHANGELOG.md](CHANGELOG.md).

# Credits

Forked from https://github.com/georgewfraser/vscode-tree-sitter.
