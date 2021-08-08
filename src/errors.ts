export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(
      `Language ${language} not supported by parse tree extension.  See https://github.com/pokey/vscode-parse-tree#adding-a-new-language`
    );
    this.name = "UnsupportedLanguageError";
  }
}

export class LanguageStillLoadingError extends Error {
  constructor(language: string) {
    super(`Language ${language} is still loading; please wait and try again`);
    this.name = "LanguageStillLoadingError";
  }
}
