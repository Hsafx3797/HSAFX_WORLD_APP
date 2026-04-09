"""
Cheque Engine Handler — Generate bank cheques as PDF using reportlab.

Engine #30. Supports:
  - generate       → Produce a PDF cheque from payee/amount/date/options
  - validate       → Validate cheque input data without generating

Output: PDF bytes (base64-encoded in the return dict for callback transport).
"""

from __future__ import annotations

import base64
import io
import math
from typing import Any

import structlog

logger = structlog.get_logger()

# ─── Number → words ────────────────────────────────────────────

_ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
_SCALES = ["", "Thousand", "Million", "Billion", "Trillion"]


def _convert_hundreds(n: int) -> str:
    result = ""
    if n >= 100:
        result += _ONES[n // 100] + " Hundred"
        n %= 100
        if n > 0:
            result += " and "
    if n >= 20:
        result += _TENS[n // 10]
        n %= 10
        if n > 0:
            result += "-" + _ONES[n]
    elif n > 0:
        result += _ONES[n]
    return result


def number_to_words(amount: float, currency: str = "Dollars") -> str:
    if amount == 0:
        return f"Zero {currency} Only"

    dollars = int(math.floor(amount))
    cents = round((amount - dollars) * 100)

    words = ""
    scale_index = 0
    remaining = dollars

    while remaining > 0:
        chunk = remaining % 1000
        if chunk > 0:
            chunk_words = _convert_hundreds(chunk)
            if _SCALES[scale_index]:
                words = chunk_words + " " + _SCALES[scale_index] + (" " if words else "") + words
            else:
                words = chunk_words + words
        remaining //= 1000
        scale_index += 1

    words += " " + currency
    if cents > 0:
        words += " and " + _convert_hundreds(cents) + " Cents"
    return words + " Only"


def _generate_micr(cheque_number: str, routing: str, account: str) -> str:
    return f"C{cheque_number}C A{routing}A {account}B"


def _mask_account(account: str) -> str:
    if len(account) <= 4:
        return account
    return "*" * (len(account) - 4) + account[-4:]


# ─── Validation ─────────────────────────────────────────────────

def _validate_cheque_data(data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    payee = data.get("payeeName") or data.get("payee_name") or ""
    if not payee or len(payee.strip()) < 2:
        errors.append("Payee name is required and must be at least 2 characters")
    amount = data.get("amount")
    if amount is None or (isinstance(amount, (int, float)) and amount <= 0):
        errors.append("Amount must be greater than zero")
    if isinstance(amount, (int, float)) and amount > 999_999_999.99:
        errors.append("Amount exceeds maximum limit (999,999,999.99)")
    if not data.get("date"):
        errors.append("Date is required")
    return errors


# ─── PDF Generation ─────────────────────────────────────────────

def _generate_cheque_pdf(data: dict[str, Any]) -> bytes:
    """Generate a cheque as PDF using reportlab. Returns raw PDF bytes."""
    from reportlab.lib.pagesizes import landscape
    from reportlab.lib.units import inch, mm
    from reportlab.pdfgen import canvas as rl_canvas
    from reportlab.lib.colors import HexColor

    # Dimensions: standard cheque 8.5 × 3.67 inches
    width = 8.5 * inch
    height = 3.67 * inch

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(width, height))

    # Colours
    bg = HexColor("#f8f9fa")
    border = HexColor("#dee2e6")
    text_col = HexColor("#212529")
    muted = HexColor("#6c757d")

    # Background
    c.setFillColor(bg)
    c.roundRect(0, 0, width, height, 6, stroke=0, fill=1)

    # Border
    c.setStrokeColor(border)
    c.setLineWidth(1.5)
    c.roundRect(4, 4, width - 8, height - 8, 4, stroke=1, fill=0)

    # Inner dashed border
    c.setDash(4, 4)
    c.setLineWidth(0.5)
    c.roundRect(10, 10, width - 20, height - 20, 3, stroke=1, fill=0)
    c.setDash()

    # Extract fields
    payee = data.get("payeeName") or data.get("payee_name") or "PAYEE"
    amount = float(data.get("amount", 0))
    date_str = data.get("date", "")
    memo = data.get("memo", "")
    bank_name = data.get("bankName") or data.get("bank_name") or "BANK NAME"
    account_number = data.get("accountNumber") or data.get("account_number") or "0000000000"
    cheque_number = data.get("chequeNumber") or data.get("cheque_number") or "000000"
    currency = data.get("currency", "USD")
    routing_number = data.get("routingNumber") or data.get("routing_number") or "123456789"

    currency_word = {
        "USD": "Dollars", "GBP": "Pounds Sterling", "SAR": "Saudi Riyals",
        "EUR": "Euros", "AED": "Dirhams", "PKR": "Rupees",
    }.get(currency, currency)

    amount_words = number_to_words(amount, currency_word)
    micr = data.get("micrLine") or _generate_micr(cheque_number, routing_number, account_number)

    # ─── Draw ────────────────────────────────────────────────
    y_top = height - 30

    # Bank name
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(text_col)
    c.drawString(40, y_top, bank_name)

    # Cheque number
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 40, y_top, f"No. {cheque_number}")

    # Date
    c.drawRightString(width - 40, y_top - 22, f"Date: {date_str}")

    # PAY TO THE ORDER OF
    y_payee = y_top - 60
    c.setFont("Helvetica", 8)
    c.setFillColor(muted)
    c.drawString(40, y_payee + 12, "PAY TO THE ORDER OF")

    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(text_col)
    c.drawString(40, y_payee - 5, payee)

    # Payee underline
    c.setStrokeColor(border)
    c.setLineWidth(0.5)
    c.line(40, y_payee - 10, width - 200, y_payee - 10)

    # Amount box
    from reportlab.lib.colors import white
    box_x = width - 175
    box_y = y_payee - 15
    c.setFillColor(white)
    c.setStrokeColor(border)
    c.setLineWidth(1.5)
    c.roundRect(box_x, box_y, 135, 30, 3, stroke=1, fill=1)

    # Format amount
    try:
        import locale
        locale.setlocale(locale.LC_ALL, "")
        formatted = locale.currency(amount, grouping=True)
    except Exception:
        formatted = f"${amount:,.2f}"

    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(text_col)
    c.drawString(box_x + 8, box_y + 9, formatted)

    # Amount in words
    y_words = y_payee - 48
    c.setFont("Helvetica", 10)
    c.setFillColor(text_col)
    # Truncate words to fit
    max_chars = 80
    display_words = amount_words[:max_chars] + ("..." if len(amount_words) > max_chars else "")
    c.drawString(40, y_words, display_words)

    c.setStrokeColor(border)
    c.line(40, y_words - 5, width - 40, y_words - 5)

    c.setFont("Helvetica", 8)
    c.setFillColor(muted)
    c.drawRightString(width - 40, y_words, currency_word.upper())

    # Memo
    y_memo = 55
    c.setFont("Helvetica", 8)
    c.setFillColor(muted)
    c.drawString(40, y_memo, "MEMO")
    c.setFont("Helvetica", 9)
    c.setFillColor(text_col)
    c.drawString(80, y_memo, memo[:50] if memo else "")
    c.setStrokeColor(border)
    c.line(40, y_memo - 5, 260, y_memo - 5)

    # Signature line
    c.setFont("Helvetica", 8)
    c.setFillColor(muted)
    c.drawRightString(width - 40, y_memo, "AUTHORIZED SIGNATURE")
    c.line(width - 230, y_memo - 5, width - 40, y_memo - 5)

    # MICR line
    c.setFont("Courier", 10)
    c.setFillColor(text_col)
    c.drawString(40, 30, micr)

    # Account number (masked)
    c.setFont("Helvetica", 7)
    c.setFillColor(muted)
    c.drawString(40, 18, f"Account: {_mask_account(account_number)}")

    # Void notice
    c.setFont("Helvetica", 6)
    c.drawRightString(width - 40, 18, "VOID AFTER 90 DAYS")

    c.save()
    return buf.getvalue()


# ─── Handler class ──────────────────────────────────────────────

class ChequeHandler:
    """Engine handler for cheque generation (engine #30)."""

    async def convert(self, tool_slug: str, *, input_data: Any = None, options: dict[str, Any] | None = None, **kw: Any) -> dict[str, Any]:
        """Dispatch cheque operations via tool_slug."""
        slug = tool_slug.replace("-", "_")
        method = getattr(self, f"_handle_{slug}", None)
        if not method:
            return {"success": False, "error": f"Unknown cheque operation: {tool_slug}"}
        try:
            return await method(input_data=input_data, options=options or {})
        except Exception:
            logger.exception("Cheque operation %s failed", tool_slug)
            raise

    async def _handle_generate(self, *, input_data: Any, options: dict[str, Any]) -> dict[str, Any]:
        """Generate a cheque PDF from input data."""
        data = input_data if isinstance(input_data, dict) else {}
        # Merge options into data (callers may put fields in either place)
        merged = {**data, **options}

        # Validate
        errors = _validate_cheque_data(merged)
        if errors:
            return {"success": False, "error": f"Validation failed: {'; '.join(errors)}"}

        pdf_bytes = _generate_cheque_pdf(merged)
        pdf_b64 = base64.b64encode(pdf_bytes).decode("ascii")

        return {
            "success": True,
            "output": {
                "format": "pdf",
                "data": pdf_b64,
                "filename": f"cheque_{merged.get('chequeNumber') or merged.get('cheque_number') or '000000'}.pdf",
                "mimeType": "application/pdf",
                "sizeBytes": len(pdf_bytes),
            },
            "metadata": {
                "payee": merged.get("payeeName") or merged.get("payee_name"),
                "amount": merged.get("amount"),
                "currency": merged.get("currency", "USD"),
                "chequeNumber": merged.get("chequeNumber") or merged.get("cheque_number") or "000000",
            },
        }

    async def _handle_validate(self, *, input_data: Any, options: dict[str, Any]) -> dict[str, Any]:
        """Validate cheque input without generating."""
        data = input_data if isinstance(input_data, dict) else {}
        merged = {**data, **options}
        errors = _validate_cheque_data(merged)
        return {
            "success": True,
            "output": {
                "valid": len(errors) == 0,
                "errors": errors,
            },
        }
