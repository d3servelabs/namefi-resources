#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import zipfile
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BRAND_KIT = ROOT / "static" / "brand-kit"
ZIP_PATH = BRAND_KIT / "namefi-brand-kit-assets.zip"
README_PATH = BRAND_KIT / "README.md"

SVG_ASSETS = [
    "namefi-logotype.svg",
    "namefi-logotype-mono.svg",
    "namefi-logotype-mono-green.svg",
    "namefi-logotype-mono-ink.svg",
    "namefi-logotype-mono-white.svg",
    "namefi-compact.svg",
    "namefi-compact-mono.svg",
    "namefi-compact-white.svg",
    "namefi-compact-black.svg",
    "namefi-lottie-wordmark.svg",
    "namefi-lottie-wordmark-mono.svg",
]

EXTRA_ASSETS = [
    "namefi_to_nfi.json",
]

ZIP_TIMESTAMP = (2026, 1, 1, 0, 0, 0)


def svg_dimensions(svg_path: Path) -> tuple[int, int]:
    source = svg_path.read_text()
    svg_tag = re.search(r"<svg\b([^>]*)>", source, re.IGNORECASE | re.DOTALL)
    if not svg_tag:
        raise ValueError(f"No <svg> tag found in {svg_path}")

    attrs = svg_tag.group(1)
    width = re.search(r'\bwidth="([0-9.]+)', attrs)
    height = re.search(r'\bheight="([0-9.]+)', attrs)
    if width and height:
        return round(float(width.group(1))), round(float(height.group(1)))

    viewbox = re.search(r'\bviewBox="[^"]*?\s+([0-9.]+)\s+([0-9.]+)"', attrs)
    if viewbox:
        return round(float(viewbox.group(1))), round(float(viewbox.group(2)))

    raise ValueError(f"No width/height or viewBox dimensions found in {svg_path}")


def jpeg_matte(svg_path: Path) -> tuple[int, int, int, int]:
    source = svg_path.read_text().lower()
    if 'fill="white"' in source or "#f5fcf9" in source:
        return (7, 9, 8, 255)
    return (247, 250, 246, 255)


def convert_svg(svg_name: str) -> None:
    svg_path = BRAND_KIT / svg_name
    stem = svg_path.stem
    width, height = svg_dimensions(svg_path)

    png_path = BRAND_KIT / f"{stem}.png"
    jpg_path = BRAND_KIT / f"{stem}.jpg"
    webp_path = BRAND_KIT / f"{stem}.webp"

    subprocess.run(
        [
            "rsvg-convert",
            "--format",
            "png",
            "--width",
            str(width),
            "--height",
            str(height),
            "--keep-aspect-ratio",
            "--output",
            str(png_path),
            str(svg_path),
        ],
        check=True,
    )

    image = Image.open(png_path).convert("RGBA")
    image.save(webp_path, "WEBP", lossless=True, method=6)

    background = Image.new("RGBA", image.size, jpeg_matte(svg_path))
    background.alpha_composite(image)
    background.convert("RGB").save(jpg_path, "JPEG", quality=95, subsampling=0)


def build_zip() -> None:
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        def write_bytes(archive_name: str, data: bytes, mode: int = 0o644) -> None:
            info = zipfile.ZipInfo(archive_name, ZIP_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = mode << 16
            archive.writestr(info, data)

        def write_file(path: Path, archive_name: str) -> None:
            write_bytes(archive_name, path.read_bytes())

        def write_dir(archive_name: str) -> None:
            info = zipfile.ZipInfo(archive_name, ZIP_TIMESTAMP)
            info.external_attr = (0o755 << 16) | 0x10
            archive.writestr(info, b"")

        write_dir("namefi-brand-kit/")
        write_file(README_PATH, "namefi-brand-kit/README.md")
        write_dir("namefi-brand-kit/assets/")

        for svg_name in SVG_ASSETS:
            stem = Path(svg_name).stem
            for suffix in (".svg", ".png", ".jpg", ".webp"):
                filename = f"{stem}{suffix}"
                write_file(BRAND_KIT / filename, f"namefi-brand-kit/assets/{filename}")

        for filename in EXTRA_ASSETS:
            write_file(BRAND_KIT / filename, f"namefi-brand-kit/assets/{filename}")


def main() -> None:
    for svg_name in SVG_ASSETS:
        convert_svg(svg_name)
    build_zip()


if __name__ == "__main__":
    main()
