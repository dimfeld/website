#!/bin/bash

LOCAL_BUILD_PATH=.svelte-kit/output/server/
VERCEL_BUILD_PATH=.vercel_build_output/functions/node/render/
export PATH=$(npm bin):${PATH}

for OUT in "$LOCAL_BUILD_PATH" "$VERCEL_BUILD_PATH"; do
  copyfiles -u3 -e '**/*.ts' "src/lib/og-image/*" "$OUT"
  copyfiles "notes/*" "posts/*" "roam-pages/*" "$OUT"
done

