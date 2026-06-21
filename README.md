# al-folio

## Local development

Quick start (whitens teaser backgrounds, then serves at http://127.0.0.1:4000):

```powershell
./serve.ps1
```

Manual steps:

```powershell
bundle install                                    # first time only
python _scripts/whiten_teasers.py                 # flatten transparent teaser PNGs onto white
bundle exec jekyll serve --config _config.yml,_config.local.yml
```

Notes:

- Always pass `--config _config.yml,_config.local.yml` locally; `_config.local.yml` excludes
  `assets/jupyter/` (no local Jupyter) and disables ImageMagick on Windows.
- `_scripts/whiten_teasers.py` is idempotent: it scans `assets/img/publication_preview/`
  for PNGs, composites any transparent ones onto a white background (backing up the original
  as `*_orig.png`), and skips images that are already opaque. Re-run it whenever you add a
  publication preview/teaser image.
- Optional formatting: `npm install && npx prettier . --write`

## License

The theme is available as open source under the terms of the [MIT License](https://github.com/alshedivat/al-folio/blob/main/LICENSE).

Originally, **al-folio** was based on the [\*folio theme](https://github.com/bogoli/-folio) (published by [Lia Bogoev](https://liabogoev.com) and under the MIT license). Since then, it got a full re-write of the styles and many additional cool features.
