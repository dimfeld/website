#!/bin/bash

outputDir='build/server/chunks'

copyfiles -u3 -e '**/*.ts' "src/lib/og-image/*" ${outputDir};
cp node_modules/@dimfeld/create-social-card-wasm/create_social_card_wasm_bg.wasm ${outputDir}
