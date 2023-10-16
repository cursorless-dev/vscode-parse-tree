# For generating .wasm files for parsers
# See https://www.npmjs.com/package/web-tree-sitter
LANGUAGES = agda bash c c-sharp clojure cpp css elm elixir go haskell html java javascript json julia kotlin latex lua markdown nix perl php python query ruby rust scala scss sparql swift talon tsx typescript yaml

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


# Build web-tree-sitter

WEB_TREE_SITTER_FILES := README.md package.json tree-sitter-web.d.ts tree-sitter.js tree-sitter.wasm
WEB_TREE_SITTER_DIR := vendor/web-tree-sitter

MAKE_CACHE_DIR := .make-work

.PHONY: web-tree-sitter
web-tree-sitter: $(addprefix $(WEB_TREE_SITTER_DIR)/,$(WEB_TREE_SITTER_FILES))

$(addprefix $(WEB_TREE_SITTER_DIR)/,$(WEB_TREE_SITTER_FILES)): tree-sitter-version
	@rm -rf $(MAKE_CACHE_DIR)/tree-sitter
	@TREE_SITTER_VERSION=$(shell cat tree-sitter-version) ;\
	mkdir -p $(MAKE_CACHE_DIR)/tree-sitter && \
	curl -L https://api.github.com/repos/tree-sitter/tree-sitter/tarball/$$TREE_SITTER_VERSION | \
	tar -xz -C $(MAKE_CACHE_DIR)/tree-sitter --strip-components=1
	@cd $(MAKE_CACHE_DIR)/tree-sitter && \
	./script/build-wasm
	@mkdir -p $(WEB_TREE_SITTER_DIR)
	@cp $(MAKE_CACHE_DIR)/tree-sitter/LICENSE $(WEB_TREE_SITTER_DIR)
	@cp $(addprefix $(MAKE_CACHE_DIR)/tree-sitter/lib/binding_web/,$(WEB_TREE_SITTER_FILES)) $(WEB_TREE_SITTER_DIR)
	@rm -rf $(MAKE_CACHE_DIR)/tree-sitter
