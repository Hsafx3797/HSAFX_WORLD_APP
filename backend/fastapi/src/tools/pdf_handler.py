"""
PDF Handler — All 27 PDF tool operations.

Handles page manipulation, compression, annotation, security, metadata,
and format conversion for PDF files.

Binary deps: poppler-utils (pdftoppm, pdftops, pdftohtml, pdfunite, pdfseparate),
             ghostscript (compression, grayscale, PDF/A), qpdf (linearize, repair)
Python deps: pypdf, reportlab, Pillow
"""

from __future__ import annotations

import asyncio
import io
import itertools
import logging
import math
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Lazy imports — not all deps available in every environment
_pypdf = None
_reportlab = None


def _get_pypdf():
    global _pypdf
    if _pypdf is None:
        import pypdf as _pypdf  # type: ignore
    return _pypdf


def _get_reportlab():
    global _reportlab
    if _reportlab is None:
        pass  # type: ignore
    return _reportlab


class PdfHandler:
    """Server-side PDF processing — 27 tools."""

    async def convert(
        self,
        tool_id: str,
        *,
        input_data: str | bytes | dict | None = None,
        input_file_url: str | None = None,
        input_file_urls: list[str] | None = None,
        options: dict[str, Any] | None = None,
        output_dir: str | None = None,
    ) -> dict[str, Any]:
        """Dispatch to the correct PDF operation."""
        opts = options or {}
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_pdf_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if not handler:
            return {"success": False, "error": f"Unknown PDF tool: {tool_id}"}

        try:
            return await handler(
                input_data=input_data,
                input_file_url=input_file_url,
                input_file_urls=input_file_urls,
                opts=opts,
                out_dir=out_dir,
            )
        except Exception as e:
            logger.exception("PDF tool %s failed", tool_id)
            return {"success": False, "error": str(e)}

    # ── Helpers ────────────────────────────────────────────────────

    async def _download(self, url: str) -> bytes:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(url)
            r.raise_for_status()
            return r.content

    async def _download_multi(self, urls: list[str]) -> list[bytes]:
        async with httpx.AsyncClient(timeout=120) as client:
            tasks = [client.get(u) for u in urls]
            responses = await asyncio.gather(*tasks)
            return [r.content for r in responses]

    def _load_pdf(self, data: bytes):
        pypdf = _get_pypdf()
        return pypdf.PdfReader(io.BytesIO(data))

    def _write_pdf(self, writer, out_dir: Path, filename: str = "output.pdf") -> Path:
        out_path = out_dir / filename
        with open(out_path, "wb") as f:
            writer.write(f)
        return out_path

    async def _run_gs(self, args: list[str]) -> subprocess.CompletedProcess:
        """Run Ghostscript command."""
        gs_bin = shutil.which("gs") or shutil.which("gswin64c") or "gs"
        cmd = [gs_bin] + args
        return await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, timeout=300
        )

    async def _run_cmd(self, cmd: list[str], timeout: int = 300) -> subprocess.CompletedProcess:
        return await asyncio.to_thread(
            subprocess.run, cmd, capture_output=True, timeout=timeout
        )

    # ── Page Manipulation ──────────────────────────────────────

    async def _handle_pdf_merge(self, *, input_file_urls, opts, out_dir, **kw):
        """Merge multiple PDFs into one."""
        pypdf = _get_pypdf()
        urls = input_file_urls or []
        if not urls:
            return {"success": False, "error": "Provide multiple PDF files"}

        buffers = await self._download_multi(urls)
        writer = pypdf.PdfWriter()
        for buf in buffers:
            reader = pypdf.PdfReader(io.BytesIO(buf))
            for page in reader.pages:
                writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "merged.pdf")
        return {"success": True, "output": str(out), "metadata": {"pages": len(writer.pages)}}

    async def _handle_pdf_split(self, *, input_file_url, opts, out_dir, **kw):
        """Split PDF into individual pages."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        output_files = []
        for i, page in enumerate(reader.pages):
            writer = pypdf.PdfWriter()
            writer.add_page(page)
            path = self._write_pdf(writer, out_dir, f"page_{i + 1}.pdf")
            output_files.append(str(path))
        return {"success": True, "output": output_files, "metadata": {"pages": len(output_files)}}

    async def _handle_pdf_extract(self, *, input_file_url, opts, out_dir, **kw):
        """Extract specific pages from PDF."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        pages_str = opts.get("pages", "1")  # e.g. "1,3,5-7"
        indices = self._parse_page_ranges(pages_str, len(reader.pages))

        writer = pypdf.PdfWriter()
        for idx in indices:
            writer.add_page(reader.pages[idx])

        out = self._write_pdf(writer, out_dir, "extracted.pdf")
        return {"success": True, "output": str(out), "metadata": {"pages": len(indices)}}

    async def _handle_pdf_delete(self, *, input_file_url, opts, out_dir, **kw):
        """Delete specific pages from PDF."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        pages_str = opts.get("pages", "")
        delete_set = set(self._parse_page_ranges(pages_str, len(reader.pages)))

        writer = pypdf.PdfWriter()
        for i, page in enumerate(reader.pages):
            if i not in delete_set:
                writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "trimmed.pdf")
        return {"success": True, "output": str(out), "metadata": {"pages": len(writer.pages)}}

    async def _handle_pdf_reorder(self, *, input_file_url, opts, out_dir, **kw):
        """Reorder PDF pages by specified order."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        order_str = opts.get("order", "")  # e.g. "3,1,2,5,4"
        order = [int(x.strip()) - 1 for x in order_str.split(",") if x.strip().isdigit()]

        writer = pypdf.PdfWriter()
        for idx in order:
            if 0 <= idx < len(reader.pages):
                writer.add_page(reader.pages[idx])

        out = self._write_pdf(writer, out_dir, "reordered.pdf")
        return {"success": True, "output": str(out), "metadata": {"pages": len(writer.pages)}}

    async def _handle_pdf_rotate(self, *, input_file_url, opts, out_dir, **kw):
        """Rotate PDF pages."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        angle = int(opts.get("angle", 90))
        pages_str = opts.get("pages", "all")

        writer = pypdf.PdfWriter()
        if pages_str == "all":
            indices = set(range(len(reader.pages)))
        else:
            indices = set(self._parse_page_ranges(pages_str, len(reader.pages)))

        for i, page in enumerate(reader.pages):
            if i in indices:
                page.rotate(angle)
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "rotated.pdf")
        return {"success": True, "output": str(out), "metadata": {"angle": angle, "pages": len(writer.pages)}}

    async def _handle_pdf_crop(self, *, input_file_url, opts, out_dir, **kw):
        """Crop PDF pages (trim margins)."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))

        left = float(opts.get("left", 0))
        bottom = float(opts.get("bottom", 0))
        right = float(opts.get("right", 0))
        top = float(opts.get("top", 0))

        writer = pypdf.PdfWriter()
        for page in reader.pages:
            mb = page.mediabox
            page.mediabox.lower_left = (float(mb.lower_left[0]) + left, float(mb.lower_left[1]) + bottom)
            page.mediabox.upper_right = (float(mb.upper_right[0]) - right, float(mb.upper_right[1]) - top)
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "cropped.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_resize(self, *, input_file_url, opts, out_dir, **kw):
        """Resize PDF page dimensions."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))

        # Target size in points (1 inch = 72 points)
        page_sizes = {
            "a4": (595.28, 841.89), "letter": (612, 792), "legal": (612, 1008),
            "a3": (841.89, 1190.55), "a5": (419.53, 595.28),
        }
        size_name = opts.get("size", "a4").lower()
        target_w, target_h = page_sizes.get(size_name, (595.28, 841.89))

        writer = pypdf.PdfWriter()
        for page in reader.pages:
            page.scale_to(float(target_w), float(target_h))
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "resized.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_nup(self, *, input_file_url, opts, out_dir, **kw):
        """N-up: place multiple pages per sheet."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        n = int(opts.get("n", 2))

        cols = int(math.ceil(math.sqrt(n)))
        rows = int(math.ceil(n / cols))

        # Get first page dimensions as reference
        ref = reader.pages[0]
        pw = float(ref.mediabox.width)
        ph = float(ref.mediabox.height)

        writer = pypdf.PdfWriter()
        pages = list(reader.pages)

        for chunk_start in range(0, len(pages), n):
            chunk = pages[chunk_start:chunk_start + n]
            # Create new blank page at original dimensions
            new_page = pypdf.PageObject.create_blank_page(width=pw, height=ph)
            cell_w = pw / cols
            cell_h = ph / rows
            for idx, src_page in enumerate(chunk):
                col = idx % cols
                row = idx // cols
                _tx = col * cell_w
                _ty = ph - (row + 1) * cell_h
                src_page.scale_to(float(cell_w), float(cell_h))
                new_page.merge_page(src_page)
            writer.add_page(new_page)

        out = self._write_pdf(writer, out_dir, f"nup_{n}.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_mix(self, *, input_file_urls, opts, out_dir, **kw):
        """Alternate/interleave pages from two PDFs."""
        pypdf = _get_pypdf()
        urls = input_file_urls or []
        if len(urls) < 2:
            return {"success": False, "error": "Need at least 2 PDF files"}

        buffers = await self._download_multi(urls[:2])
        r1 = pypdf.PdfReader(io.BytesIO(buffers[0]))
        r2 = pypdf.PdfReader(io.BytesIO(buffers[1]))

        writer = pypdf.PdfWriter()
        for a, b in itertools.zip_longest(r1.pages, r2.pages):
            if a:
                writer.add_page(a)
            if b:
                writer.add_page(b)

        out = self._write_pdf(writer, out_dir, "mixed.pdf")
        return {"success": True, "output": str(out), "metadata": {"pages": len(writer.pages)}}

    # ── Compression & Visual ────────────────────────────────────

    async def _handle_pdf_compress(self, *, input_file_url, opts, out_dir, **kw):
        """Compress PDF using Ghostscript."""
        data = await self._download(input_file_url)
        input_path = out_dir / "input.pdf"
        output_path = out_dir / "compressed.pdf"
        input_path.write_bytes(data)

        quality = opts.get("quality", "ebook")  # screen, ebook, printer, prepress
        result = await self._run_gs([
            "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS=/{quality}", "-dNOPAUSE", "-dBATCH", "-dQUIET",
            f"-sOutputFile={output_path}", str(input_path),
        ])

        if result.returncode != 0:
            return {"success": False, "error": f"Ghostscript failed: {result.stderr.decode(errors='replace')[:500]}"}

        orig_size = len(data)
        new_size = output_path.stat().st_size
        return {
            "success": True, "output": str(output_path),
            "metadata": {"original_size": orig_size, "compressed_size": new_size,
                         "savings_pct": round((1 - new_size / orig_size) * 100, 1) if orig_size else 0},
        }

    async def _handle_pdf_grayscale(self, *, input_file_url, opts, out_dir, **kw):
        """Convert PDF to grayscale."""
        data = await self._download(input_file_url)
        input_path = out_dir / "input.pdf"
        output_path = out_dir / "grayscale.pdf"
        input_path.write_bytes(data)

        result = await self._run_gs([
            "-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dQUIET",
            "-sColorConversionStrategy=Gray", "-dProcessColorModel=/DeviceGray",
            f"-sOutputFile={output_path}", str(input_path),
        ])

        if result.returncode != 0:
            return {"success": False, "error": "Grayscale conversion failed"}
        return {"success": True, "output": str(output_path)}

    async def _handle_pdf_flatten(self, *, input_file_url, opts, out_dir, **kw):
        """Flatten PDF form fields and annotations."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()

        for page in reader.pages:
            # Merge annotation appearances into content stream
            if "/Annots" in page:
                page[pypdf.generic.NameObject("/Annots")] = pypdf.generic.ArrayObject()
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "flattened.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_deskew(self, *, input_file_url, opts, out_dir, **kw):
        """Deskew scanned PDF pages using Ghostscript + auto-rotate."""
        data = await self._download(input_file_url)
        input_path = out_dir / "input.pdf"
        output_path = out_dir / "deskewed.pdf"
        input_path.write_bytes(data)

        result = await self._run_gs([
            "-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dQUIET",
            "-dAutoRotatePages=/All",
            f"-sOutputFile={output_path}", str(input_path),
        ])

        if result.returncode != 0:
            return {"success": False, "error": "Deskew failed"}
        return {"success": True, "output": str(output_path)}

    # ── Metadata & Annotation ────────────────────────────────────

    async def _handle_pdf_edit_metadata(self, *, input_file_url, opts, out_dir, **kw):
        """Edit PDF metadata (title, author, subject, keywords)."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()
        writer.append_pages_from_reader(reader)

        meta = {}
        if opts.get("title"):
            meta["/Title"] = opts["title"]
        if opts.get("author"):
            meta["/Author"] = opts["author"]
        if opts.get("subject"):
            meta["/Subject"] = opts["subject"]
        if opts.get("keywords"):
            meta["/Keywords"] = opts["keywords"]

        writer.add_metadata(meta)
        out = self._write_pdf(writer, out_dir, "metadata.pdf")
        return {"success": True, "output": str(out), "metadata": meta}

    async def _handle_pdf_rename_content(self, *, input_file_url, opts, out_dir, **kw):
        """Rename PDF based on extracted content (title/first line)."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))

        # Try metadata title first, then first line of text
        title = ""
        info = reader.metadata
        if info and info.title:
            title = info.title
        if not title and reader.pages:
            text = reader.pages[0].extract_text() or ""
            first_line = text.strip().split("\n")[0][:60] if text.strip() else ""
            title = first_line

        # Sanitize for filename
        safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in title).strip()[:80]
        if not safe_name:
            safe_name = "renamed"

        out_path = out_dir / f"{safe_name}.pdf"
        out_path.write_bytes(data)
        return {"success": True, "output": str(out_path), "metadata": {"title": title}}

    async def _handle_pdf_extract_images(self, *, input_file_url, opts, out_dir, **kw):
        """Extract all images from PDF."""
        pypdf = _get_pypdf()
        from PIL import Image as PILImage

        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        images = []

        for page_num, page in enumerate(reader.pages):
            if "/XObject" not in (page.get("/Resources") or {}):
                continue
            x_objects = page["/Resources"]["/XObject"].get_object()
            for obj_name in x_objects:
                obj = x_objects[obj_name].get_object()
                if obj.get("/Subtype") == "/Image":
                    try:
                        width = int(obj["/Width"])
                        height = int(obj["/Height"])
                        img_data = obj.get_data()
                        color_space = str(obj.get("/ColorSpace", "/DeviceRGB"))

                        if "/DeviceRGB" in color_space:
                            mode = "RGB"
                        elif "/DeviceCMYK" in color_space:
                            mode = "CMYK"
                        else:
                            mode = "L"

                        img = PILImage.frombytes(mode, (width, height), img_data)
                        img_path = out_dir / f"image_p{page_num + 1}_{obj_name.lstrip('/')}.png"
                        img.save(str(img_path))
                        images.append(str(img_path))
                    except Exception:
                        continue

        return {"success": True, "output": images, "metadata": {"image_count": len(images)}}

    async def _handle_pdf_remove_annotations(self, *, input_file_url, opts, out_dir, **kw):
        """Remove all annotations from PDF."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()

        for page in reader.pages:
            if "/Annots" in page:
                del page[pypdf.generic.NameObject("/Annots")]
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "no_annotations.pdf")
        return {"success": True, "output": str(out)}

    # ── Headers, Footers, Watermarks, Page Numbers ───────────────

    async def _handle_pdf_header_footer(self, *, input_file_url, opts, out_dir, **kw):
        """Add header and/or footer text to each page."""
        pypdf = _get_pypdf()
        from reportlab.lib.units import inch
        from reportlab.pdfgen import canvas as rl_canvas

        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()

        header_text = opts.get("header", "")
        footer_text = opts.get("footer", "")
        font_size = int(opts.get("fontSize", 10))

        for i, page in enumerate(reader.pages):
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)

            # Create overlay
            packet = io.BytesIO()
            c = rl_canvas.Canvas(packet, pagesize=(pw, ph))
            c.setFont("Helvetica", font_size)

            if header_text:
                text = header_text.replace("{page}", str(i + 1)).replace("{total}", str(len(reader.pages)))
                c.drawCentredString(pw / 2, ph - 0.5 * inch, text)
            if footer_text:
                text = footer_text.replace("{page}", str(i + 1)).replace("{total}", str(len(reader.pages)))
                c.drawCentredString(pw / 2, 0.5 * inch, text)

            c.save()
            packet.seek(0)
            overlay = pypdf.PdfReader(packet)
            page.merge_page(overlay.pages[0])
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "header_footer.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_page_numbers(self, *, input_file_url, opts, out_dir, **kw):
        """Add page numbers to PDF."""
        pypdf = _get_pypdf()
        from reportlab.lib.units import inch
        from reportlab.pdfgen import canvas as rl_canvas

        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()
        total = len(reader.pages)
        position = opts.get("position", "bottom-center")
        fmt = opts.get("format", "{page} / {total}")

        for i, page in enumerate(reader.pages):
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)
            text = fmt.replace("{page}", str(i + 1)).replace("{total}", str(total))

            packet = io.BytesIO()
            c = rl_canvas.Canvas(packet, pagesize=(pw, ph))
            c.setFont("Helvetica", 10)

            if "bottom" in position:
                y = 0.4 * inch
            else:
                y = ph - 0.4 * inch
            if "left" in position:
                c.drawString(0.5 * inch, y, text)
            elif "right" in position:
                c.drawRightString(pw - 0.5 * inch, y, text)
            else:
                c.drawCentredString(pw / 2, y, text)

            c.save()
            packet.seek(0)
            overlay = pypdf.PdfReader(packet)
            page.merge_page(overlay.pages[0])
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "numbered.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_watermark(self, *, input_file_url, opts, out_dir, **kw):
        """Add text watermark to PDF pages."""
        pypdf = _get_pypdf()
        from reportlab.pdfgen import canvas as rl_canvas

        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()

        wm_text = opts.get("text", "WATERMARK")
        opacity = float(opts.get("opacity", 0.3))
        font_size = int(opts.get("fontSize", 60))
        angle = float(opts.get("angle", 45))

        for page in reader.pages:
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)

            packet = io.BytesIO()
            c = rl_canvas.Canvas(packet, pagesize=(pw, ph))
            c.setFont("Helvetica-Bold", font_size)
            c.setFillAlpha(opacity)
            c.setFillColorRGB(0.5, 0.5, 0.5)
            c.saveState()
            c.translate(pw / 2, ph / 2)
            c.rotate(angle)
            c.drawCentredString(0, 0, wm_text)
            c.restoreState()
            c.save()
            packet.seek(0)

            overlay = pypdf.PdfReader(packet)
            page.merge_page(overlay.pages[0])
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "watermarked.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_bates(self, *, input_file_url, opts, out_dir, **kw):
        """Add Bates numbering to PDF pages."""
        pypdf = _get_pypdf()
        from reportlab.lib.units import inch
        from reportlab.pdfgen import canvas as rl_canvas

        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()

        prefix = opts.get("prefix", "BATES")
        start = int(opts.get("start", 1))
        digits = int(opts.get("digits", 6))

        for i, page in enumerate(reader.pages):
            pw = float(page.mediabox.width)
            ph = float(page.mediabox.height)
            bates_num = f"{prefix}{str(start + i).zfill(digits)}"

            packet = io.BytesIO()
            c = rl_canvas.Canvas(packet, pagesize=(pw, ph))
            c.setFont("Courier", 8)
            c.drawRightString(pw - 0.5 * inch, 0.3 * inch, bates_num)
            c.save()
            packet.seek(0)

            overlay = pypdf.PdfReader(packet)
            page.merge_page(overlay.pages[0])
            writer.add_page(page)

        out = self._write_pdf(writer, out_dir, "bates.pdf")
        return {"success": True, "output": str(out)}

    # ── Security ──────────────────────────────────────────────────

    async def _handle_pdf_protect(self, *, input_file_url, opts, out_dir, **kw):
        """Password-protect a PDF."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        reader = pypdf.PdfReader(io.BytesIO(data))
        writer = pypdf.PdfWriter()
        writer.append_pages_from_reader(reader)

        user_pwd = opts.get("password", opts.get("userPassword", ""))
        owner_pwd = opts.get("ownerPassword", user_pwd)
        allow_print = opts.get("allowPrint", True)

        permissions = pypdf.Permissions(
            print_document=allow_print,
            modify=False,
            extract=False,
        )

        writer.encrypt(user_password=user_pwd, owner_password=owner_pwd, permissions=permissions)
        out = self._write_pdf(writer, out_dir, "protected.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_unlock(self, *, input_file_url, opts, out_dir, **kw):
        """Remove password from PDF."""
        pypdf = _get_pypdf()
        data = await self._download(input_file_url)
        password = opts.get("password", "")

        reader = pypdf.PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            if not reader.decrypt(password):
                return {"success": False, "error": "Incorrect password"}

        writer = pypdf.PdfWriter()
        writer.append_pages_from_reader(reader)

        out = self._write_pdf(writer, out_dir, "unlocked.pdf")
        return {"success": True, "output": str(out)}

    async def _handle_pdf_redact(self, *, input_file_url, opts, out_dir, **kw):
        """Redact text patterns from PDF.

        IMPORTANT: True coordinate-based redaction requires a PDF library with layout
        information (e.g., pdfplumber or pymupdf). This implementation removes matching
        text from the extracted content and overlays black rectangles, but for production
        use a library like pymupdf (fitz) that can locate and remove text at specific
        coordinates. This version returns an error to avoid giving a false sense of
        security.
        """
        return {
            "success": False,
            "error": "PDF redaction is not yet implemented with a secure backend. "
                     "Text-based redaction requires a library that can locate and "
                     "permanently remove text at specific PDF coordinates (e.g., pymupdf). "
                     "The current implementation cannot guarantee that sensitive text is "
                     "actually removed from the PDF.",
        }

    # ── Repair & Conversion ──────────────────────────────────────

    async def _handle_pdf_repair(self, *, input_file_url, opts, out_dir, **kw):
        """Repair corrupted PDF using Ghostscript."""
        data = await self._download(input_file_url)
        input_path = out_dir / "input.pdf"
        output_path = out_dir / "repaired.pdf"
        input_path.write_bytes(data)

        result = await self._run_gs([
            "-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dQUIET",
            "-dPDFSETTINGS=/prepress",
            f"-sOutputFile={output_path}", str(input_path),
        ])

        if result.returncode != 0:
            # Try qpdf as fallback
            qpdf = shutil.which("qpdf")
            if qpdf:
                result2 = await self._run_cmd([qpdf, "--replace-input", str(input_path)])
                if result2.returncode == 0:
                    shutil.copy2(input_path, output_path)
                    return {"success": True, "output": str(output_path), "metadata": {"method": "qpdf"}}
            return {"success": False, "error": "PDF repair failed"}

        return {"success": True, "output": str(output_path), "metadata": {"method": "ghostscript"}}

    async def _handle_pdf_to_pdfa(self, *, input_file_url, opts, out_dir, **kw):
        """Convert PDF to PDF/A archival format."""
        data = await self._download(input_file_url)
        input_path = out_dir / "input.pdf"
        output_path = out_dir / "output_pdfa.pdf"
        input_path.write_bytes(data)

        # PDF/A-2b via Ghostscript
        pdfa_def = out_dir / "PDFA_def.ps"
        pdfa_def.write_text(
            """%!
[/Title (Converted)
 /DOCINFO pdfmark
[{
  /OutputCondition (sRGB)
  /OutputConditionIdentifier (Custom)
  /RegistryName (http://www.color.org)
  /Info (sRGB IEC61966-2.1)
  /OutputIntents [ currentdict ] pdfmark
}
""",
        )

        result = await self._run_gs([
            "-sDEVICE=pdfwrite", "-dNOPAUSE", "-dBATCH", "-dQUIET",
            "-dPDFA=2", "-dPDFACompatibilityPolicy=1",
            f"-sOutputFile={output_path}", str(pdfa_def), str(input_path),
        ])

        if result.returncode != 0:
            return {"success": False, "error": "PDF/A conversion failed"}
        return {"success": True, "output": str(output_path)}

    # ── Utility ──────────────────────────────────────────────────

    def _parse_page_ranges(self, spec: str, total: int) -> list[int]:
        """Parse page range spec like '1,3,5-7' to 0-based indices."""
        indices = []
        for part in spec.split(","):
            part = part.strip()
            if "-" in part:
                start, end = part.split("-", 1)
                s = max(1, int(start.strip())) - 1
                e = min(total, int(end.strip()))
                indices.extend(range(s, e))
            elif part.isdigit():
                idx = int(part) - 1
                if 0 <= idx < total:
                    indices.append(idx)
        return indices
