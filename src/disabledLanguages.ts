import * as semver from "semver";
import * as vscode from "vscode";

/**
 * FIXME: On newer vscode versions some Tree sitter parser throws memory errors
 * https://github.com/cursorless-dev/cursorless/issues/2879
 * https://github.com/cursorless-dev/vscode-parse-tree/issues/110
 */

const isProblemVersion =
  semver.lt(vscode.version, "1.107.0") && semver.gte(vscode.version, "1.98.0");

const disabledLanguages = new Set(isProblemVersion ? ["latex", "swift"] : []);

export function isLanguageDisabled(languageId: string): boolean {
  return disabledLanguages.has(languageId);
}

export function throwIfLanguageIsDisabled(languageId: string): void {
  if (isLanguageDisabled(languageId)) {
    throw new Error(
      `${languageId} is disabled on vscode versions 1.98.0 through 1.06.3. See https://github.com/cursorless-dev/cursorless/issues/2879`,
    );
  }
}
