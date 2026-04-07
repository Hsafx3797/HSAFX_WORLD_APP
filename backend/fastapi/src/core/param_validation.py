"""
Numeric parameter validation for FFmpeg / Ghostscript / image processing.

Ensures user-supplied values are within safe, sane ranges before being
passed to external binaries.
"""

from __future__ import annotations


def clamp_int(value, *, min_val: int, max_val: int, name: str) -> int:
    """Coerce to int and enforce [min_val, max_val]."""
    v = int(value)
    if not (min_val <= v <= max_val):
        raise ValueError(f"{name} must be between {min_val} and {max_val}, got {v}")
    return v


def clamp_float(value, *, min_val: float, max_val: float, name: str) -> float:
    """Coerce to float and enforce [min_val, max_val]."""
    v = float(value)
    if not (min_val <= v <= max_val):
        raise ValueError(f"{name} must be between {min_val} and {max_val}, got {v}")
    return v
