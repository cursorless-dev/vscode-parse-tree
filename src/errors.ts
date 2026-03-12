import type { Uri } from "vscode";

export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(
      `Language '${language}' not supported by parse tree extension.  See https://github.com/pokey/vscode-parse-tree#adding-a-new-language`,
    );
    this.name = "UnsupportedLanguageError";
  }
}

export class LanguageStillLoadingError extends Error {
  constructor(language: string) {
    super(`Language '${language}' is still loading; please wait and try again`);
    this.name = "LanguageStillLoadingError";
  }
}

export class DeprecatedError extends Error {
  constructor(name: string) {
    super(`${name} is deprecated and has been removed from the API`);
    this.name = "DeprecatedError";
  }
}

export class FailedToParseError extends Error {
  constructor(uri: Uri) {
    super(`Failed to parse document: ${uri.toString()}`);
    this.name = "FailedToParseError";
  }
}

export class DocumentNotOpenError extends Error {
  constructor(uri: Uri) {
    super(`Document not open: ${uri.toString()}`);
    this.name = "DocumentNotOpenError";
  }
}
