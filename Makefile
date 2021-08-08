# For generating .wasm files for parsers
# See https://www.npmjs.com/package/web-tree-sitter
languages = c cpp c-sharp bash go html java javascript json markdown python ruby rust tsx typescript yaml

.PHONY: parsers
parsers: $(addprefix parsers/tree-sitter-,$(addsuffix .wasm,$(languages)))

parsers/%.wasm: node_modules/%/package.json
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-typescript.wasm: node_modules/tree-sitter-typescript/typescript/package.json
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-tsx.wasm: node_modules/tree-sitter-typescript/tsx/package.json
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-c-sharp.wasm: node_modules/tree-sitter-c-sharp/package.json
	npx tree-sitter build-wasm $(dir $^)
	mv tree-sitter-c_sharp.wasm $@