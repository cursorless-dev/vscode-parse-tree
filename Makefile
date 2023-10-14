# For generating .wasm files for parsers
# See https://www.npmjs.com/package/web-tree-sitter
LANGUAGES = agda bash c c-sharp clojure cpp css elm elixir go haskell html java javascript json julia kotlin latex markdown nix perl php python query ruby rust scala scss sparql swift talon tsx typescript yaml

# Build web-tree-sitter parsers for $(LANGUAGES)

.PHONY: parsers
parsers: $(addprefix parsers/tree-sitter-,$(addsuffix .wasm,$(LANGUAGES)))

parsers/%.wasm: node_modules/%/package.json
	mkdir -p $(dir $@)
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-elm.wasm: node_modules/@elm-tooling/tree-sitter-elm/package.json
	mkdir -p $(dir $@)
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-markdown.wasm: node_modules/tree-sitter-markdown/tree-sitter-markdown/grammar.js
	mkdir -p $(dir $@)
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-typescript.wasm: node_modules/tree-sitter-typescript/typescript/package.json
	mkdir -p $(dir $@)
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-tsx.wasm: node_modules/tree-sitter-typescript/tsx/package.json
	mkdir -p $(dir $@)
	npx tree-sitter build-wasm $(dir $^)
	mv $(notdir $@) $@

parsers/tree-sitter-c-sharp.wasm: node_modules/tree-sitter-c-sharp/package.json
	mkdir -p $(dir $@)
	npx tree-sitter build-wasm $(dir $^)
	mv tree-sitter-c_sharp.wasm $@
