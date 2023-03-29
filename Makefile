# For generating .wasm files for parsers
# See https://www.npmjs.com/package/web-tree-sitter
LANGUAGES = agda bash c c-sharp clojure cpp css elm elixir go haskell html java javascript json julia kotlin latex markdown perl php python query ruby rust scala scss sparql talon tsx typescript yaml


# NOTE: Update the version number in the filepath for web-tree-sitter in package.json,
#       when you change this version number.
TREE_SITTER_VERSION := 0.20.4


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
WEB_TREE_SITTER_DIR := vendor/web-tree-sitter/$(TREE_SITTER_VERSION)
WEB_TREE_SITTER_PATCH := patches/tree-sitter+$(TREE_SITTER_VERSION).patch

MAKE_CACHE_DIR := .make-work

.PHONY: web-tree-sitter
web-tree-sitter: $(addprefix $(WEB_TREE_SITTER_DIR)/,$(WEB_TREE_SITTER_FILES)) \

$(addprefix $(WEB_TREE_SITTER_DIR)/,$(WEB_TREE_SITTER_FILES)):
	@rm -rf $(MAKE_CACHE_DIR)/tree-sitter
	@git clone                                       \
		-c advice.detachedHead=false --quiet           \
		--depth=1 --branch=v$(TREE_SITTER_VERSION)     \
		https://github.com/tree-sitter/tree-sitter.git \
		$(MAKE_CACHE_DIR)/tree-sitter
ifneq (,$(wildcard $(WEB_TREE_SITTER_PATCH)))
	@(cp $(WEB_TREE_SITTER_PATCH) $(MAKE_CACHE_DIR)/tree-sitter)
	@(cd $(MAKE_CACHE_DIR)/tree-sitter && git apply $(notdir $(WEB_TREE_SITTER_PATCH)))
endif
	@(cd $(MAKE_CACHE_DIR)/tree-sitter && ./script/build-wasm)
	@mkdir -p $(WEB_TREE_SITTER_DIR)
	@cp $(MAKE_CACHE_DIR)/tree-sitter/LICENSE $(WEB_TREE_SITTER_DIR)
	@cp $(addprefix $(MAKE_CACHE_DIR)/tree-sitter/lib/binding_web/,$(WEB_TREE_SITTER_FILES)) $(WEB_TREE_SITTER_DIR)
	@rm -rf $(MAKE_CACHE_DIR)/tree-sitter
