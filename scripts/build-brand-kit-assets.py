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

# Icon / favicon assets are derived from the compact mark (first Lottie frame):
# a tight cut (no padding, ~1.35:1) and a square `contain` framing, each on a
# transparent and an opaque-black background, rasterized at multiple sizes.
ICON_SOURCE = "namefi-compact.svg"
ICON_SQUARE_SIZES = [32, 64, 128, 256, 512, 1024, 2048, 4096]
ICON_CUT_WIDTHS = [64, 128, 256, 512, 1024, 2048, 4096]
# Fraction of the square the mark spans, leaving a uniform safe-area margin so
# the mark never touches an edge — every edge is the variant's own background
# (transparent / black). The tight cut keeps no margin (green to the edge).
ICON_SQUARE_INSET = 0.88

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


def _icon_boxes() -> tuple[tuple[float, float, float, float], tuple[float, float, float, float]]:
    """Derive the tight-cut and square viewBoxes from the compact source SVG.

    Renders the source, measures the opaque (green) bounding box, and returns
    ``(cut_box, square_box)`` as ``(x, y, w, h)`` tuples in viewBox units.
    """
    source_path = BRAND_KIT / ICON_SOURCE
    view = re.search(
        r'viewBox="([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.\-]+)\s+([0-9.\-]+)"',
        source_path.read_text(),
    )
    if not view:
        raise ValueError(f"No viewBox found in {source_path}")
    _, _, vb_w, vb_h = (float(value) for value in view.groups())

    measure_path = BRAND_KIT / "_icon_measure.png"
    subprocess.run(
        ["rsvg-convert", "--zoom", "60", "--output", str(measure_path), str(source_path)],
        check=True,
    )
    rendered = Image.open(measure_path).convert("RGBA")
    width_px, height_px = rendered.size
    opaque = rendered.split()[3].point(lambda value: 255 if value > 20 else 0)
    left, top, right, bottom = opaque.getbbox()
    measure_path.unlink()

    units_x, units_y = width_px / vb_w, height_px / vb_h
    x0, y0 = left / units_x, top / units_y
    box_w, box_h = right / units_x - x0, bottom / units_y - y0
    cut_box = (x0, y0, box_w, box_h)
    # Square with a uniform safe-area margin: the mark spans ICON_SQUARE_INSET of
    # the square and is centered, so no edge of the mark touches the icon border.
    side = max(box_w, box_h) / ICON_SQUARE_INSET
    center_x, center_y = x0 + box_w / 2, y0 + box_h / 2
    square_box = (center_x - side / 2, center_y - side / 2, side, side)
    return cut_box, square_box


def _retarget_viewbox(text: str, box: tuple[float, float, float, float], aspect: str | None) -> str:
    x, y, w, h = box
    out = re.sub(r'viewBox="[^"]*"', f'viewBox="{x:.4f} {y:.4f} {w:.4f} {h:.4f}"', text, count=1)
    if aspect is not None:
        if re.search(r'preserveAspectRatio="[^"]*"', out):
            out = re.sub(r'preserveAspectRatio="[^"]*"', f'preserveAspectRatio="{aspect}"', out, count=1)
        else:
            out = re.sub(r"(<svg\b)", rf'\1 preserveAspectRatio="{aspect}"', out, count=1)
    return out


def _with_black_background(text: str, box: tuple[float, float, float, float]) -> str:
    x, y, w, h = box
    rect = f'<rect x="{x:.4f}" y="{y:.4f}" width="{w:.4f}" height="{h:.4f}" fill="#000000"/>'
    return re.sub(r"(<svg\b[^>]*>)", r"\1" + rect, text, count=1)


def _save_icon_raster(image: Image.Image, stem: str, *, black: bool) -> None:
    if black:
        canvas = Image.new("RGBA", image.size, (0, 0, 0, 255))
        canvas.alpha_composite(image)
        canvas.save(BRAND_KIT / f"{stem}.png")
        canvas.save(BRAND_KIT / f"{stem}.webp", "WEBP", lossless=True, method=6)
        canvas.convert("RGB").save(BRAND_KIT / f"{stem}.jpg", "JPEG", quality=95, subsampling=0)
        return
    image.save(BRAND_KIT / f"{stem}.png")
    image.save(BRAND_KIT / f"{stem}.webp", "WEBP", lossless=True, method=6)
    matte = Image.new("RGBA", image.size, (247, 250, 246, 255))
    matte.alpha_composite(image)
    matte.convert("RGB").save(BRAND_KIT / f"{stem}.jpg", "JPEG", quality=95, subsampling=0)


def build_icons() -> list[str]:
    """Generate the icon SVGs + multi-size rasters, returning their filenames."""
    cut_box, square_box = _icon_boxes()
    source = (BRAND_KIT / ICON_SOURCE).read_text()
    cut_svg = _retarget_viewbox(source, cut_box, None)
    square_svg = _retarget_viewbox(source, square_box, "xMidYMid meet")

    (BRAND_KIT / "namefi-compact-cut.svg").write_text(cut_svg)
    (BRAND_KIT / "namefi-compact-cut-black.svg").write_text(_with_black_background(cut_svg, cut_box))
    (BRAND_KIT / "namefi-compact-square.svg").write_text(square_svg)
    (BRAND_KIT / "namefi-compact-square-black.svg").write_text(_with_black_background(square_svg, square_box))

    names = [
        "namefi-compact-cut.svg",
        "namefi-compact-cut-black.svg",
        "namefi-compact-square.svg",
        "namefi-compact-square-black.svg",
    ]
    tmp = BRAND_KIT / "_icon_tmp.png"

    for size in ICON_SQUARE_SIZES:
        subprocess.run(
            ["rsvg-convert", "--format", "png", "--width", str(size), "--height", str(size),
             "--output", str(tmp), str(BRAND_KIT / "namefi-compact-square.svg")],
            check=True,
        )
        image = Image.open(tmp).convert("RGBA")
        if image.size != (size, size):
            padded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            padded.alpha_composite(image, ((size - image.width) // 2, (size - image.height) // 2))
            image = padded
        _save_icon_raster(image, f"namefi-compact-square-{size}", black=False)
        _save_icon_raster(image, f"namefi-compact-square-black-{size}", black=True)
        for ext in ("png", "webp", "jpg"):
            names.append(f"namefi-compact-square-{size}.{ext}")
            names.append(f"namefi-compact-square-black-{size}.{ext}")

    for width in ICON_CUT_WIDTHS:
        subprocess.run(
            ["rsvg-convert", "--format", "png", "--width", str(width),
             "--output", str(tmp), str(BRAND_KIT / "namefi-compact-cut.svg")],
            check=True,
        )
        image = Image.open(tmp).convert("RGBA")
        _save_icon_raster(image, f"namefi-compact-cut-{width}w", black=False)
        _save_icon_raster(image, f"namefi-compact-cut-black-{width}w", black=True)
        for ext in ("png", "webp", "jpg"):
            names.append(f"namefi-compact-cut-{width}w.{ext}")
            names.append(f"namefi-compact-cut-black-{width}w.{ext}")

    if tmp.exists():
        tmp.unlink()
    return names


def build_zip(icon_files: list[str]) -> None:
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

        for filename in icon_files:
            write_file(BRAND_KIT / filename, f"namefi-brand-kit/assets/{filename}")


def main() -> None:
    for svg_name in SVG_ASSETS:
        convert_svg(svg_name)
    icon_files = build_icons()
    build_zip(icon_files)


if __name__ == "__main__":
    main()
