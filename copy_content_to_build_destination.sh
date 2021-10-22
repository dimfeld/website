#!/bin/bash

LOCAL_BUILD_PATH=.svelte-kit/output/server/
VERCEL_BUILD_PATH=.vercel_build_output/functions/node/render/
export PATH=$(npm bin):${PATH}

for OUT in "$LOCAL_BUILD_PATH" "$VERCEL_BUILD_PATH"; do
  copyfiles -u3 -e '**/*.ts' "src/lib/og-image/*" "$OUT"
  copyfiles "notes/*" "posts/*" "roam-pages/*" "$OUT"
  cp node_modules/@dimfeld/create-social-card-wasm/create_social_card_wasm_bg.wasm "$OUT"
done
