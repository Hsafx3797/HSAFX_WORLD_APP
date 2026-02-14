"""
Image Converter — Native image processing via Pillow + libvips.

Handles: format conversion, resize, crop, compress, watermark, metadata,
         HEIC/RAW/PSD/SVG conversion, batch operations.

Binary deps: libvips (optional, for advanced formats)
Python deps: Pillow, pillow-heif (HEIC), rawpy (RAW)
"""

from __future__ import annotations

import io
import logging
import tempfile
from pathlib import Path
from typing import Any

import httpx
from PIL import ExifTags, Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# Format mapping
FORMAT_MAP = {
    "png": "PNG",
    "jpg": "JPEG",
    "jpeg": "JPEG",
    "webp": "WEBP",
    "bmp": "BMP",
    "tiff": "TIFF",
    "gif": "GIF",
    "avif": "AVIF",
    "ico": "ICO",
}

# Maximum dimensions to prevent OOM
MAX_DIMENSION = 16384


class ImageConverter:
    """Server-side image processing handler."""

    async def convert(
        self,
        tool_id: str,
        *,
        input_file_url: str | None = None,
        input_bytes: bytes | None = None,
        options: dict[str, Any] | None = None,
        output_dir: str | None = None,
    ) -> dict[str, Any]:
        """Dispatch to the correct image operation."""
        opts = options or {}
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_img_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        # Download input file
        img_bytes = input_bytes
        if not img_bytes and input_file_url:
            img_bytes = await self._download(input_file_url)
        if not img_bytes:
            return {"success": False, "error": "No input image provided"}

        try:
            img = Image.open(io.BytesIO(img_bytes))
        except Exception as e:
            return {"success": False, "error": f"Cannot open image: {e}"}

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if handler:
            return await handler(img, opts, out_dir)

        # Default: format conversion
        return await self._handle_raster_to_raster(img, opts, out_dir)

    # ── Handlers ─────────────────────────────────────────────────

    async def _handle_raster_to_raster(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert between raster formats (PNG, JPEG, WebP, BMP, TIFF, GIF)."""
        fmt = opts.get("outputFormat", "png").lower()
        quality = int(opts.get("quality", 85))
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")

        # Convert RGBA to RGB for JPEG
        if pil_fmt == "JPEG" and img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
            img = background

        out_path = out_dir / f"output.{fmt}"
        save_kwargs: dict[str, Any] = {"format": pil_fmt}
        if pil_fmt in ("JPEG", "WEBP"):
            save_kwargs["quality"] = quality
        if pil_fmt == "PNG":
            save_kwargs["optimize"] = True

        img.save(str(out_path), **save_kwargs)
        return {
            "success": True,
            "output": str(out_path),
            "metadata": {
                "format": fmt,
                "width": img.width,
                "height": img.height,
                "size_bytes": out_path.stat().st_size,
            },
        }

    async def _handle_image_resize(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Resize image to specified dimensions."""
        width = min(int(opts.get("width", img.width)), MAX_DIMENSION)
        height = min(int(opts.get("height", img.height)), MAX_DIMENSION)
        maintain_aspect = opts.get("maintainAspect", True)
        resample = Image.LANCZOS

        if maintain_aspect:
            img.thumbnail((width, height), resample)
        else:
            img = img.resize((width, height), resample)

        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"resized.{fmt}"
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")

        if pil_fmt == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        img.save(str(out_path), format=pil_fmt, quality=int(opts.get("quality", 85)))
        return {
            "success": True,
            "output": str(out_path),
            "metadata": {"width": img.width, "height": img.height},
        }

    async def _handle_image_crop(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Crop image to specified region."""
        left = int(opts.get("left", 0))
        top = int(opts.get("top", 0))
        right = int(opts.get("right", img.width))
        bottom = int(opts.get("bottom", img.height))

        cropped = img.crop((left, top, right, bottom))
        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"cropped.{fmt}"
        cropped.save(str(out_path), format=FORMAT_MAP.get(fmt, "PNG"))
        return {"success": True, "output": str(out_path), "metadata": {"width": cropped.width, "height": cropped.height}}

    async def _handle_image_compress(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Compress image to reduce file size."""
        quality = int(opts.get("quality", 60))
        fmt = opts.get("outputFormat", "webp").lower()
        pil_fmt = FORMAT_MAP.get(fmt, "WEBP")

        if pil_fmt == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        out_path = out_dir / f"compressed.{fmt}"
        img.save(str(out_path), format=pil_fmt, quality=quality, optimize=True)
        return {
            "success": True,
            "output": str(out_path),
            "metadata": {"quality": quality, "size_bytes": out_path.stat().st_size},
        }

    async def _handle_image_rotate(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Rotate image by specified degrees."""
        angle = float(opts.get("angle", 90))
        expand = opts.get("expand", True)
        rotated = img.rotate(-angle, expand=expand, resample=Image.BICUBIC)

        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"rotated.{fmt}"
        rotated.save(str(out_path), format=FORMAT_MAP.get(fmt, "PNG"))
        return {"success": True, "output": str(out_path)}

    async def _handle_image_flip(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Flip image horizontally or vertically."""
        from PIL import ImageOps
        direction = opts.get("direction", "horizontal")
        if direction == "vertical":
            flipped = ImageOps.flip(img)
        else:
            flipped = ImageOps.mirror(img)

        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"flipped.{fmt}"
        flipped.save(str(out_path), format=FORMAT_MAP.get(fmt, "PNG"))
        return {"success": True, "output": str(out_path)}

    async def _handle_image_watermark(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Add text watermark to image."""
        text = opts.get("text", "HSAFX.WORLD")
        opacity = int(opts.get("opacity", 128))
        position = opts.get("position", "center")

        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Use default font (cross-platform)
        font_size = max(img.width // 20, 16)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

        if position == "center":
            x, y = (img.width - tw) // 2, (img.height - th) // 2
        elif position == "bottom-right":
            x, y = img.width - tw - 20, img.height - th - 20
        elif position == "top-left":
            x, y = 20, 20
        else:
            x, y = (img.width - tw) // 2, img.height - th - 20

        draw.text((x, y), text, fill=(255, 255, 255, opacity), font=font)

        watermarked = Image.alpha_composite(img.convert("RGBA"), overlay)
        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"watermarked.{fmt}"
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")
        if pil_fmt == "JPEG":
            watermarked = watermarked.convert("RGB")
        watermarked.save(str(out_path), format=pil_fmt)
        return {"success": True, "output": str(out_path)}

    async def _handle_image_metadata_strip(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Strip EXIF metadata from image."""
        data = list(img.getdata())
        stripped = Image.new(img.mode, img.size)
        stripped.putdata(data)

        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"stripped.{fmt}"
        stripped.save(str(out_path), format=FORMAT_MAP.get(fmt, "PNG"))
        return {"success": True, "output": str(out_path)}

    async def _handle_image_metadata_view(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract and return EXIF metadata as JSON."""
        metadata: dict[str, Any] = {
            "width": img.width,
            "height": img.height,
            "mode": img.mode,
            "format": img.format or "unknown",
        }

        exif_data = img.getexif()
        if exif_data:
            exif_dict = {}
            for tag_id, value in exif_data.items():
                tag = ExifTags.TAGS.get(tag_id, str(tag_id))
                if isinstance(value, bytes):
                    value = value.hex()[:100]
                exif_dict[tag] = str(value)
            metadata["exif"] = exif_dict

        return {"success": True, "output": metadata, "metadata": metadata}

    async def _handle_image_thumbnail(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Generate thumbnail."""
        size = int(opts.get("size", 150))
        img.thumbnail((size, size), Image.LANCZOS)

        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"thumb.{fmt}"
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")
        if pil_fmt == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(str(out_path), format=pil_fmt, quality=int(opts.get("quality", 80)))
        return {"success": True, "output": str(out_path)}

    # ── Format-Specific Converters (canonical IDs) ──────────────

    async def _handle_heic_convert(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert HEIC/HEIF to raster format."""
        # pillow-heif registers with Pillow at import time, so if we got here
        # the image was already decoded.  Just re-save as the target format.
        return await self._handle_raster_to_raster(img, opts, out_dir)

    async def _handle_camera_raw_convert(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert camera RAW (CR2/NEF/ARW/DNG) to raster format via rawpy."""
        # rawpy produces a numpy array; Pillow can open the result.
        return await self._handle_raster_to_raster(img, opts, out_dir)

    async def _handle_psd_convert(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert PSD to raster.  Pillow reads PSD natively (flattened)."""
        return await self._handle_raster_to_raster(img, opts, out_dir)

    async def _handle_ai_eps_convert(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert AI/EPS to raster via Ghostscript (Pillow EPS plugin)."""
        return await self._handle_raster_to_raster(img, opts, out_dir)

    async def _handle_svg_convert(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert SVG to raster.

        Note: Pillow cannot open SVG.  The executor should pre-render SVG to
        PNG via cairosvg before passing bytes here.  If we received an already-
        rasterised image, just re-save.
        """
        return await self._handle_raster_to_raster(img, opts, out_dir)

    # ── New Canonical Handlers ────────────────────────────────────

    async def _handle_image_to_ascii(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert image to ASCII art text."""
        width = int(opts.get("width", 100))
        chars = opts.get("charset", "@%#*+=-:. ")

        # Resize keeping aspect (terminal chars are ~2x tall as wide)
        aspect = img.height / img.width
        new_h = int(width * aspect * 0.55)
        img = img.resize((width, new_h), Image.LANCZOS).convert("L")

        pixels = list(img.getdata())
        step = 256 / len(chars)
        lines = []
        for row in range(new_h):
            line = "".join(chars[min(int(p / step), len(chars) - 1)] for p in pixels[row * width:(row + 1) * width])
            lines.append(line)
        ascii_art = "\n".join(lines)

        out_path = out_dir / "ascii.txt"
        out_path.write_text(ascii_art, encoding="utf-8")
        return {"success": True, "output": ascii_art, "metadata": {"width": width, "height": new_h}}

    async def _handle_image_canvas_resize(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Resize canvas (extend/pad) without scaling the image."""
        new_w = min(int(opts.get("width", img.width)), MAX_DIMENSION)
        new_h = min(int(opts.get("height", img.height)), MAX_DIMENSION)
        bg_color = opts.get("backgroundColor", "#ffffff")
        anchor = opts.get("anchor", "center")  # center, top-left, top-right, etc.

        # Parse hex colour
        if bg_color.startswith("#") and len(bg_color) == 7:
            r, g, b = int(bg_color[1:3], 16), int(bg_color[3:5], 16), int(bg_color[5:7], 16)
            fill = (r, g, b, 255) if img.mode == "RGBA" else (r, g, b)
        else:
            fill = (255, 255, 255, 255) if img.mode == "RGBA" else (255, 255, 255)

        canvas = Image.new(img.mode, (new_w, new_h), fill)

        anchor_map = {
            "center": ((new_w - img.width) // 2, (new_h - img.height) // 2),
            "top-left": (0, 0),
            "top-right": (new_w - img.width, 0),
            "bottom-left": (0, new_h - img.height),
            "bottom-right": (new_w - img.width, new_h - img.height),
        }
        x, y = anchor_map.get(anchor, anchor_map["center"])
        canvas.paste(img, (max(x, 0), max(y, 0)))

        fmt = opts.get("outputFormat", "png").lower()
        out_path = out_dir / f"canvas.{fmt}"
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")
        if pil_fmt == "JPEG" and canvas.mode in ("RGBA", "P"):
            canvas = canvas.convert("RGB")
        canvas.save(str(out_path), format=pil_fmt)
        return {"success": True, "output": str(out_path), "metadata": {"width": new_w, "height": new_h}}

    async def _handle_image_color_mode(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert image colour mode (RGB, CMYK, Grayscale, 1-bit)."""
        mode = opts.get("mode", "RGB").upper()
        mode_map = {"GRAYSCALE": "L", "GREYSCALE": "L", "BW": "1", "1-BIT": "1"}
        pil_mode = mode_map.get(mode, mode)

        converted = img.convert(pil_mode)
        fmt = opts.get("outputFormat", "png").lower()
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")

        if pil_fmt == "JPEG" and converted.mode in ("RGBA", "P", "1"):
            converted = converted.convert("RGB")

        out_path = out_dir / f"colour_mode.{fmt}"
        converted.save(str(out_path), format=pil_fmt)
        return {"success": True, "output": str(out_path), "metadata": {"mode": converted.mode}}

    async def _handle_image_batch_filters(
        self, img: Image.Image, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Apply batch image filters (brightness, contrast, saturation, sharpness, blur)."""
        from PIL import ImageEnhance, ImageFilter

        brightness = float(opts.get("brightness", 1.0))
        contrast = float(opts.get("contrast", 1.0))
        saturation = float(opts.get("saturation", 1.0))
        sharpness = float(opts.get("sharpness", 1.0))
        blur_radius = float(opts.get("blur", 0))
        grayscale = opts.get("grayscale", False)

        result = img.copy()
        if brightness != 1.0:
            result = ImageEnhance.Brightness(result).enhance(brightness)
        if contrast != 1.0:
            result = ImageEnhance.Contrast(result).enhance(contrast)
        if saturation != 1.0:
            result = ImageEnhance.Color(result).enhance(saturation)
        if sharpness != 1.0:
            result = ImageEnhance.Sharpness(result).enhance(sharpness)
        if blur_radius > 0:
            result = result.filter(ImageFilter.GaussianBlur(radius=blur_radius))
        if grayscale:
            result = result.convert("L").convert("RGB")

        fmt = opts.get("outputFormat", "png").lower()
        pil_fmt = FORMAT_MAP.get(fmt, "PNG")
        if pil_fmt == "JPEG" and result.mode in ("RGBA", "P"):
            result = result.convert("RGB")
        out_path = out_dir / f"filtered.{fmt}"
        result.save(str(out_path), format=pil_fmt, quality=int(opts.get("quality", 85)))
        return {"success": True, "output": str(out_path)}

    # ── Utilities ─────────────────────────────────────────────────

    async def _download(self, url: str) -> bytes:
        """Download file from URL (R2 signed URL)."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.content
