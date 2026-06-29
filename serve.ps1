# One-command local dev: flatten teaser images onto white, then serve the site.
# Usage:  ./serve.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> Whitening teaser backgrounds..." -ForegroundColor Cyan
python _scripts/whiten_teasers.py

Write-Host "==> Starting Jekyll (http://127.0.0.1:4000)..." -ForegroundColor Cyan
bundle exec jekyll serve --config _config.yml,_config.local.yml --livereload
