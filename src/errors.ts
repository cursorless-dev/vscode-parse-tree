export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(
      `Language '${language}' not supported by parse tree extension.  See https://github.com/pokey/vscode-parse-tree#adding-a-new-language`,
    );
    this.name = "UnsupportedLanguageError";
  }
}

export class LanguageFailedToLoad extends Error {
  constructor(language: string) {
    super(`Language '${language}' failed to load`);
    this.name = "LanguageFailedToLoad";
  }
}

export class DeprecatedError extends Error {
  constructor(name: string) {
    super(`${name} is deprecated and has been removed from the API`);
    this.name = "DeprecatedError";
  }
}
