#!/usr/bin/env python
"""Flatten transparent publication-preview images onto a white background.

Scans assets/img/publication_preview for PNGs and, if an image has an alpha
channel with transparent pixels, composites it onto a solid white background
(RGB). Already-opaque images and "*_orig.png" backups are skipped, so the
script is safe to re-run any time a new preview/teaser image is added.

Usage:
    python _scripts/whiten_teasers.py
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SEARCH_DIR = ROOT / "assets" / "img" / "publication_preview"


def needs_flatten(im: Image.Image) -> bool:
    if im.mode not in ("RGBA", "LA", "PA") and "transparency" not in im.info:
        return False
    alpha = im.convert("RGBA").getchannel("A")
    return alpha.getextrema()[0] < 255


def flatten(path: Path) -> bool:
    with Image.open(path) as im:
        if not needs_flatten(im):
            return False
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        out = Image.alpha_composite(bg, rgba).convert("RGB")

    backup = path.with_name(path.stem + "_orig.png")
    if not backup.exists():
        path.replace(backup)
    out.save(path)
    return True


def main() -> int:
    if not SEARCH_DIR.exists():
        print(f"Search dir not found: {SEARCH_DIR}")
        return 1

    changed = 0
    for path in sorted(SEARCH_DIR.rglob("*.png")):
        if path.name.lower().endswith("_orig.png"):
            continue
        if flatten(path):
            print(f"flattened: {path.relative_to(ROOT)}")
            changed += 1
        else:
            print(f"skipped (already opaque): {path.relative_to(ROOT)}")
    print(f"Done. {changed} image(s) flattened.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
