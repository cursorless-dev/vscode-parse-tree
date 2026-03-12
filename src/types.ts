import type { Parser } from "web-tree-sitter";

export interface Language {
  module: string;
  parser?: Parser;
}
