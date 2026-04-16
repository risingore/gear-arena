#!/usr/bin/env python3
"""
Post-process transparent PNGs to force-remove near-black residue.

rembg sometimes leaves dark pixels (close to the game's #0a0a10 background)
in tight gaps like between robot legs. This script walks every pixel and
sets alpha to 0 for any pixel whose RGB is close enough to the target color.

Usage:
    python3 scripts/clean-dark-bg.py public/assets/images/*.png

Or via the batch wrapper:
    bun run clean-bg
"""

import sys
from pathlib import Path
from PIL import Image

# Target background color and tolerance
TARGET_R, TARGET_G, TARGET_B = 0x0A, 0x0A, 0x10
TOLERANCE = 35  # per-channel distance threshold


def clean_image(path: Path) -> int:
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    cleaned = 0

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if (
                abs(r - TARGET_R) <= TOLERANCE
                and abs(g - TARGET_G) <= TOLERANCE
                and abs(b - TARGET_B) <= TOLERANCE
            ):
                pixels[x, y] = (0, 0, 0, 0)
                cleaned += 1

    img.save(path)
    return cleaned


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/clean-dark-bg.py <image.png> [...]")
        sys.exit(1)

    for arg in sys.argv[1:]:
        p = Path(arg)
        if not p.exists() or p.suffix.lower() != ".png":
            print(f"  skip: {p}")
            continue
        n = clean_image(p)
        print(f"  {p.name}: {n} dark pixels → transparent")


if __name__ == "__main__":
    main()
