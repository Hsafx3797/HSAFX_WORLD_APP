"""
Document Converter — Office / eBook / spreadsheet format conversions + legacy PDF ops.

Handles 15 canonical document tools (media-tools.ts "Document" subcategory):
  txt-to-pdf, txt-to-docx, docx-to-pdf, docx-to-odt, docx-to-rtf,
  pptx-to-pdf, odp-to-pptx, epub-to-pdf, epub-to-mobi, epub-to-azw3,
  markdown-to-pdf, pdf-to-html, xlsx-to-csv, xls-to-csv, ods-to-xlsx

Also retains legacy PDF helpers (merge/split/compress/text/rotate/ocr/image)
which are now superseded by pdf_handler.py for canonical routing.

Binary deps:
  - libreoffice (soffice) — DOCX/PPTX/ODS/ODT/RTF/XLSX conversions
  - calibre (ebook-convert) — EPUB ↔ MOBI/AZW3
  - poppler-utils (pdftotext, pdftoppm, pdftohtml)
  - tesseract-ocr
  - wkhtmltopdf (optional, HTML→PDF)
Python deps: PyPDF2/pypdf, reportlab, python-markdown
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

TESSERACT = os.environ.get("TESSERACT_PATH", "tesseract")
SOFFICE = os.environ.get("SOFFICE_PATH", "soffice")
EBOOK_CONVERT = os.environ.get("EBOOK_CONVERT_PATH", "ebook-convert")


class DocumentConverter:
    """Server-side document processing handler."""

    async def convert(
        self,
        tool_id: str,
        *,
        input_data: str | bytes | None = None,
        input_file_url: str | None = None,
        options: dict[str, Any] | None = None,
        output_dir: str | None = None,
    ) -> dict[str, Any]:
        opts = options or {}
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_doc_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        # For text-based inputs (Markdown, HTML, CSV)
        text_input = None
        if isinstance(input_data, str):
            text_input = input_data
        elif isinstance(input_data, bytes):
            text_input = input_data.decode("utf-8", errors="replace")

        # For file-based inputs (PDF, EPUB, DOCX)
        input_path = None
        if input_file_url:
            data = await self._download(input_file_url)
            input_path = out_dir / "input"
            input_path.write_bytes(data)
        elif isinstance(input_data, bytes):
            input_path = out_dir / "input"
            input_path.write_bytes(input_data)

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if handler:
            return await handler(
                text_input=text_input,
                input_path=input_path,
                opts=opts,
                out_dir=out_dir,
            )
        return {"success": False, "error": f"Unknown document tool: {tool_id}"}

    # ── Legacy PDF Operations (DEPRECATED — use pdf_handler.py) ──

    async def _handle_pdf_merge(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Merge multiple PDFs into one.

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        try:
            from PyPDF2 import PdfMerger  # type: ignore

            merger = PdfMerger()
            # Expect multiple file URLs in options
            file_urls = opts.get("fileUrls", [])
            if input_path:
                merger.append(str(input_path))

            for url in file_urls:
                data = await self._download(url)
                merger.append(io.BytesIO(data))

            out_path = out_dir / "merged.pdf"
            merger.write(str(out_path))
            merger.close()
            return {"success": True, "output": str(out_path)}
        except ImportError:
            return {"success": False, "error": "PyPDF2 not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _handle_pdf_split(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Split PDF into individual pages or ranges.

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}
        try:
            from PyPDF2 import PdfReader, PdfWriter  # type: ignore

            reader = PdfReader(str(input_path))
            pages = opts.get("pages", None)  # e.g., "1-3,5,7-9"
            split_dir = out_dir / "pages"
            split_dir.mkdir(exist_ok=True)

            if pages:
                # Parse page ranges
                page_nums = self._parse_page_ranges(pages, len(reader.pages))
            else:
                page_nums = list(range(len(reader.pages)))

            output_files = []
            for i, pn in enumerate(page_nums):
                writer = PdfWriter()
                writer.add_page(reader.pages[pn])
                out_path = split_dir / f"page_{pn + 1}.pdf"
                with open(str(out_path), "wb") as f:
                    writer.write(f)
                output_files.append(str(out_path))

            return {
                "success": True,
                "output": str(split_dir),
                "metadata": {"page_count": len(output_files), "files": output_files},
            }
        except ImportError:
            return {"success": False, "error": "PyPDF2 not installed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _handle_pdf_compress(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Compress PDF to reduce file size.

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}
        try:
            from PyPDF2 import PdfReader, PdfWriter  # type: ignore

            reader = PdfReader(str(input_path))
            writer = PdfWriter()

            for page in reader.pages:
                page.compress_content_streams()
                writer.add_page(page)

            writer.add_metadata(reader.metadata or {})
            out_path = out_dir / "compressed.pdf"
            with open(str(out_path), "wb") as f:
                writer.write(f)

            original_size = input_path.stat().st_size
            compressed_size = out_path.stat().st_size
            return {
                "success": True,
                "output": str(out_path),
                "metadata": {
                    "original_size": original_size,
                    "compressed_size": compressed_size,
                    "reduction_pct": round((1 - compressed_size / original_size) * 100, 1),
                },
            }
        except ImportError:
            return {"success": False, "error": "PyPDF2 not installed"}

    async def _handle_pdf_to_text(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract text from PDF.

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}
        try:
            from PyPDF2 import PdfReader  # type: ignore

            reader = PdfReader(str(input_path))
            text_parts = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text_parts.append(f"--- Page {i + 1} ---\n{page_text}")

            full_text = "\n\n".join(text_parts)
            return {"success": True, "output": full_text, "metadata": {"page_count": len(reader.pages)}}
        except ImportError:
            return {"success": False, "error": "PyPDF2 not installed"}

    async def _handle_pdf_rotate(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Rotate PDF pages.

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}
        try:
            from PyPDF2 import PdfReader, PdfWriter  # type: ignore

            angle = int(opts.get("angle", 90))
            reader = PdfReader(str(input_path))
            writer = PdfWriter()

            pages_to_rotate = opts.get("pages", None)
            page_nums = (
                self._parse_page_ranges(pages_to_rotate, len(reader.pages))
                if pages_to_rotate
                else list(range(len(reader.pages)))
            )

            for i, page in enumerate(reader.pages):
                if i in page_nums:
                    page.rotate(angle)
                writer.add_page(page)

            out_path = out_dir / "rotated.pdf"
            with open(str(out_path), "wb") as f:
                writer.write(f)
            return {"success": True, "output": str(out_path)}
        except ImportError:
            return {"success": False, "error": "PyPDF2 not installed"}

    async def _handle_pdf_ocr(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """OCR a PDF (convert to images, then tesseract).

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}

        language = opts.get("language", "eng")
        images_dir = out_dir / "ocr_images"
        images_dir.mkdir(exist_ok=True)

        # Convert PDF to images via pdftoppm (poppler)
        cmd = [
            "pdftoppm", "-png", "-r", "300",
            str(input_path), str(images_dir / "page"),
        ]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            await asyncio.wait_for(proc.communicate(), timeout=120)
        except (FileNotFoundError, asyncio.TimeoutError) as e:
            return {"success": False, "error": f"pdftoppm failed: {e}"}

        # OCR each image with tesseract
        images = sorted(images_dir.glob("*.png"))
        if not images:
            return {"success": False, "error": "No pages extracted from PDF"}

        text_parts = []
        for img_path in images:
            txt_path = img_path.with_suffix("")
            cmd = [TESSERACT, str(img_path), str(txt_path), "-l", language]
            try:
                proc = await asyncio.create_subprocess_exec(
                    *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
                )
                await asyncio.wait_for(proc.communicate(), timeout=60)
                txt_file = txt_path.with_suffix(".txt")
                if txt_file.exists():
                    text_parts.append(txt_file.read_text())
            except Exception as e:
                text_parts.append(f"[OCR Error: {e}]")

        return {"success": True, "output": "\n\n".join(text_parts)}

    async def _handle_markdown_to_pdf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert Markdown text to PDF."""
        md_text = text_input
        if not md_text and input_path:
            md_text = input_path.read_text(encoding="utf-8")
        if not md_text:
            return {"success": False, "error": "No Markdown input provided"}

        try:
            import markdown  # type: ignore
            from reportlab.lib.pagesizes import A4  # type: ignore
            from reportlab.lib.styles import getSampleStyleSheet  # type: ignore
            from reportlab.platypus import Paragraph, SimpleDocTemplate  # type: ignore

            html = markdown.markdown(md_text)
            out_path = out_dir / "output.pdf"
            doc = SimpleDocTemplate(str(out_path), pagesize=A4)
            styles = getSampleStyleSheet()
            # Simple paragraph-based rendering
            story = [Paragraph(html, styles["Normal"])]
            doc.build(story)
            return {"success": True, "output": str(out_path)}
        except ImportError as e:
            return {"success": False, "error": f"Missing dependency: {e}"}

    async def _handle_html_to_pdf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert HTML to PDF."""
        html = text_input
        if not html and input_path:
            html = input_path.read_text(encoding="utf-8")
        if not html:
            return {"success": False, "error": "No HTML input provided"}

        try:
            import pdfkit  # type: ignore

            out_path = out_dir / "output.pdf"
            pdfkit.from_string(html, str(out_path))
            return {"success": True, "output": str(out_path)}
        except ImportError:
            return {"success": False, "error": "pdfkit not installed (requires wkhtmltopdf)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _handle_pdf_to_image(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert PDF pages to images.

        .. deprecated:: Use pdf_handler.py for canonical PDF routing.
        """
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}

        fmt = opts.get("imageFormat", "png")
        dpi = int(opts.get("dpi", 150))
        images_dir = out_dir / "images"
        images_dir.mkdir(exist_ok=True)

        cmd = [
            "pdftoppm", f"-{fmt}", "-r", str(dpi),
            str(input_path), str(images_dir / "page"),
        ]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
            if proc.returncode != 0:
                return {"success": False, "error": f"pdftoppm error: {stderr.decode()[-300:]}"}

            images = sorted(images_dir.glob(f"*.{fmt}"))
            return {
                "success": True,
                "output": str(images_dir),
                "metadata": {"page_count": len(images)},
            }
        except FileNotFoundError:
            return {"success": False, "error": "pdftoppm not found. Install poppler-utils."}

    # ── Canonical Document Tools (media-tools.ts) ──────────────

    async def _handle_txt_to_pdf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert plain text to PDF via reportlab."""
        text = text_input
        if not text and input_path:
            text = input_path.read_text(encoding="utf-8", errors="replace")
        if not text:
            return {"success": False, "error": "No text input provided"}
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

            out_path = out_dir / "output.pdf"
            doc = SimpleDocTemplate(str(out_path), pagesize=A4)
            styles = getSampleStyleSheet()
            story = []
            for line in text.split("\n"):
                story.append(Paragraph(line.replace("&", "&amp;").replace("<", "&lt;"), styles["Code"]))
                story.append(Spacer(1, 4))
            doc.build(story)
            return {"success": True, "output": str(out_path)}
        except ImportError as e:
            return {"success": False, "error": f"Missing dependency: {e}"}

    async def _handle_txt_to_docx(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert plain text to DOCX via python-docx."""
        text = text_input
        if not text and input_path:
            text = input_path.read_text(encoding="utf-8", errors="replace")
        if not text:
            return {"success": False, "error": "No text input provided"}
        try:
            from docx import Document  # type: ignore
            doc = Document()
            for para in text.split("\n"):
                doc.add_paragraph(para)
            out_path = out_dir / "output.docx"
            doc.save(str(out_path))
            return {"success": True, "output": str(out_path)}
        except ImportError:
            return {"success": False, "error": "python-docx not installed"}

    async def _handle_docx_to_pdf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert DOCX to PDF via LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No DOCX file provided"}
        return await self._libreoffice_convert(input_path, "pdf", out_dir)

    async def _handle_docx_to_odt(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert DOCX to ODT via LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No DOCX file provided"}
        return await self._libreoffice_convert(input_path, "odt", out_dir)

    async def _handle_docx_to_rtf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert DOCX to RTF via LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No DOCX file provided"}
        return await self._libreoffice_convert(input_path, "rtf", out_dir)

    async def _handle_pptx_to_pdf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert PPTX to PDF via LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No PPTX file provided"}
        return await self._libreoffice_convert(input_path, "pdf", out_dir)

    async def _handle_odp_to_pptx(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert ODP to PPTX via LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No ODP file provided"}
        return await self._libreoffice_convert(input_path, "pptx", out_dir)

    async def _handle_epub_to_pdf(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert EPUB to PDF via Calibre ebook-convert."""
        if not input_path:
            return {"success": False, "error": "No EPUB file provided"}
        return await self._ebook_convert(input_path, "pdf", out_dir)

    async def _handle_epub_to_mobi(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert EPUB to MOBI via Calibre ebook-convert."""
        if not input_path:
            return {"success": False, "error": "No EPUB file provided"}
        return await self._ebook_convert(input_path, "mobi", out_dir)

    async def _handle_epub_to_azw3(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert EPUB to AZW3 via Calibre ebook-convert."""
        if not input_path:
            return {"success": False, "error": "No EPUB file provided"}
        return await self._ebook_convert(input_path, "azw3", out_dir)

    async def _handle_pdf_to_html(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert PDF to HTML via pdftohtml (poppler)."""
        if not input_path:
            return {"success": False, "error": "No PDF file provided"}
        out_path = out_dir / "output.html"
        cmd = ["pdftohtml", "-s", "-noframes", str(input_path), str(out_path)]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
            # pdftohtml creates output-html file (or output.html)
            candidates = list(out_dir.glob("*.html"))
            if candidates:
                return {"success": True, "output": str(candidates[0])}
            return {"success": False, "error": f"pdftohtml produced no output: {stderr.decode()[-300:]}"}
        except FileNotFoundError:
            return {"success": False, "error": "pdftohtml not found — install poppler-utils"}

    async def _handle_xlsx_to_csv(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert XLSX to CSV via openpyxl."""
        if not input_path:
            return {"success": False, "error": "No XLSX file provided"}
        return await self._spreadsheet_to_csv(input_path, out_dir)

    async def _handle_xls_to_csv(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert XLS to CSV via xlrd or LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No XLS file provided"}
        try:
            return await self._spreadsheet_to_csv(input_path, out_dir)
        except Exception:
            return await self._libreoffice_convert(input_path, "csv", out_dir)

    async def _handle_ods_to_xlsx(
        self, *, text_input: str | None, input_path: Path | None, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert ODS to XLSX via LibreOffice."""
        if not input_path:
            return {"success": False, "error": "No ODS file provided"}
        return await self._libreoffice_convert(input_path, "xlsx", out_dir)

    # ── Utilities ─────────────────────────────────────────────────

    async def _libreoffice_convert(
        self, input_path: Path, target_format: str, out_dir: Path
    ) -> dict[str, Any]:
        """Convert any document via LibreOffice headless mode."""
        # Give input_path a proper extension so LO detects format
        src = input_path
        if not input_path.suffix:
            # Guess from target — not ideal, caller should ensure extension
            src = input_path.with_suffix(f".{target_format}")
            shutil.copy2(input_path, src)

        cmd = [
            SOFFICE, "--headless", "--convert-to", target_format,
            "--outdir", str(out_dir), str(src),
        ]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=180)
            if proc.returncode != 0:
                return {"success": False, "error": f"LibreOffice error: {stderr.decode()[-300:]}"}

            # Find the output file
            candidates = list(out_dir.glob(f"*.{target_format}"))
            if candidates:
                return {"success": True, "output": str(candidates[0]), "metadata": {"format": target_format}}
            return {"success": False, "error": "LibreOffice produced no output file"}
        except FileNotFoundError:
            return {"success": False, "error": f"LibreOffice (soffice) not found at '{SOFFICE}'"}

    async def _ebook_convert(
        self, input_path: Path, target_format: str, out_dir: Path
    ) -> dict[str, Any]:
        """Convert eBook formats via Calibre ebook-convert."""
        out_path = out_dir / f"output.{target_format}"
        cmd = [EBOOK_CONVERT, str(input_path), str(out_path)]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
            if proc.returncode != 0:
                return {"success": False, "error": f"ebook-convert error: {stderr.decode()[-300:]}"}
            if out_path.exists():
                return {"success": True, "output": str(out_path), "metadata": {"format": target_format}}
            return {"success": False, "error": "ebook-convert produced no output"}
        except FileNotFoundError:
            return {"success": False, "error": f"Calibre ebook-convert not found at '{EBOOK_CONVERT}'"}

    async def _spreadsheet_to_csv(
        self, input_path: Path, out_dir: Path
    ) -> dict[str, Any]:
        """Convert XLSX/XLS to CSV via openpyxl."""
        try:
            import csv

            import openpyxl  # type: ignore

            wb = openpyxl.load_workbook(str(input_path), read_only=True, data_only=True)
            output_files = []
            for sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                out_path = out_dir / f"{sheet_name}.csv"
                with open(str(out_path), "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    for row in ws.iter_rows(values_only=True):
                        writer.writerow(row)
                output_files.append(str(out_path))
            wb.close()

            if len(output_files) == 1:
                return {"success": True, "output": output_files[0]}
            return {"success": True, "output": output_files, "metadata": {"sheets": len(output_files)}}
        except ImportError:
            return {"success": False, "error": "openpyxl not installed"}

    def _parse_page_ranges(self, spec: str, total: int) -> list[int]:
        """Parse page specification like '1-3,5,7-9' to 0-indexed list."""
        pages: list[int] = []
        for part in spec.split(","):
            part = part.strip()
            if "-" in part:
                start, end = part.split("-", 1)
                pages.extend(range(int(start) - 1, min(int(end), total)))
            else:
                pn = int(part) - 1
                if 0 <= pn < total:
                    pages.append(pn)
        return sorted(set(pages))

    async def _download(self, url: str) -> bytes:
        from src.core.url_validation import validate_download_url
        err = validate_download_url(url)
        if err:
            raise ValueError(f"Blocked download: {err}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.content
