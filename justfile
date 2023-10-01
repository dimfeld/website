_default:
  just -l

# Export Logseq notes and commit to Git
pkm:
  export-logseq-notes
  git add pkm-pages
  git commit -m 'logseq export'
  PAGER= git show

# Watch the Logseq directory for changes and run the exporter whenever something changes
watch-pkm:
  watchlist ~/logseq/pages ~logseq/journals -- export-logseq-notes --safe-write
