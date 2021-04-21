#!/usr/bin/env bash
# Patches tree-sitter in node_modules to get electron-rebuild to work.  Will
# only be necessary until
# https://github.com/tree-sitter/node-tree-sitter/pull/83 is merged.  See
# README for usage instructions.

cd node_modules

patch -s -p0 <<'EOF'
diff -ruN tree-sitter/binding.gyp tree-sitter/binding.gyp
--- tree-sitter/binding.gyp	2021-04-21 18:10:12.000000000 +0100
+++ tree-sitter/binding.gyp	2021-04-21 18:10:17.000000000 +0100
@@ -31,7 +31,7 @@
         "-std=c++0x",
       ],
       'xcode_settings': {
-        'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
+        'CLANG_CXX_LANGUAGE_STANDARD': 'c++14',
       },
     },
     {
EOF