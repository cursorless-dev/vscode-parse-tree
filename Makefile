LANGUAGES = agda c clojure cpp c-sharp bash go haskell html java javascript json markdown php python ruby rust scala sparql tsx typescript yaml

TREE_SITTER_VERSION := v0.20.4

WEB_TREE_SITTER_FILES := README.md package.json tree-sitter-web.d.ts tree-sitter.js tree-sitter.wasm


# Build web-tree-sitter and web-tree-sitter parsers for $(LANGUAGES)

.PHONY: compile
compile: \
		$(addprefix vendor/web-tree-sitter/,$(WEB_TREE_SITTER_FILES)) \
		$(addprefix parsers/tree-sitter-,$(addsuffix .wasm,$(LANGUAGES)))
	tsc -p ./


# Build web-tree-sitter parsers for $(LANGUAGES)

parsers/%.wasm: node_modules/%/package.json
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


# Build web-tree-sitter

$(addprefix vendor/web-tree-sitter/,$(WEB_TREE_SITTER_FILES)):
	@rm -rf tmp/tree-sitter
	@git clone                                       \
		-c advice.detachedHead=false --quiet           \
		--depth=1 --branch=$(TREE_SITTER_VERSION)      \
		https://github.com/tree-sitter/tree-sitter.git \
		tmp/tree-sitter
	@(cd tmp/tree-sitter && ./script/build-wasm)
	@mkdir -p vendor/web-tree-sitter
	@cp tmp/tree-sitter/LICENSE vendor/web-tree-sitter
	@cp $(addprefix tmp/tree-sitter/lib/binding_web/,$(WEB_TREE_SITTER_FILES)) vendor/web-tree-sitter
	@rm -rf tmp/tree-sitter