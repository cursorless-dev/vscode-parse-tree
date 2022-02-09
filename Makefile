# For generating .wasm files for parsers
# See https://www.npmjs.com/package/web-tree-sitter
LANGUAGES = agda c clojure cpp c-sharp bash go haskell html java javascript json markdown php python ruby rust scala sparql tsx typescript yaml


# NOTE: Update the version number in the filepath for web-tree-sitter in package.json,
#       when you change this version number.
TREE_SITTER_VERSION := v0.20.4

WEB_TREE_SITTER_FILES := README.md package.json tree-sitter-web.d.ts tree-sitter.js tree-sitter.wasm
WEB_TREE_SITTER_DIR := vendor/web-tree-sitter/$(TREE_SITTER_VERSION)

# Build web-tree-sitter and web-tree-sitter parsers for $(LANGUAGES)

.PHONY: compile
compile: \
		$(addprefix $(WEB_TREE_SITTER_DIR)/,$(WEB_TREE_SITTER_FILES)) \
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

$(addprefix $(WEB_TREE_SITTER_DIR)/,$(WEB_TREE_SITTER_FILES)):
	@rm -rf tmp/tree-sitter
	@git clone                                       \
		-c advice.detachedHead=false --quiet           \
		--depth=1 --branch=$(TREE_SITTER_VERSION)      \
		https://github.com/tree-sitter/tree-sitter.git \
		tmp/tree-sitter
	@(cd tmp/tree-sitter && ./script/build-wasm)
	@mkdir -p $(WEB_TREE_SITTER_DIR)
	@cp tmp/tree-sitter/LICENSE $(WEB_TREE_SITTER_DIR)
	@cp $(addprefix tmp/tree-sitter/lib/binding_web/,$(WEB_TREE_SITTER_FILES)) $(WEB_TREE_SITTER_DIR)
	@rm -rf tmp/tree-sitter