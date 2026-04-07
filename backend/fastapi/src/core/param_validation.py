"""
Numeric parameter validation for FFmpeg / Ghostscript / image processing.

Ensures user-supplied values are within safe, sane ranges before being
passed to external binaries.
"""

from __future__ import annotations

import re


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


# ─── FFmpeg / media parameter whitelists ──────────────────────


_VIDEO_CODECS = frozenset({
    "libx264", "libx265", "libvpx", "libvpx-vp9", "libaom-av1",
    "mpeg4", "h264", "hevc", "copy",
})

_AUDIO_CODECS = frozenset({
    "aac", "libmp3lame", "libvorbis", "libopus", "flac",
    "pcm_s16le", "pcm_s24le", "pcm_s32le", "copy",
})

_PRESETS = frozenset({
    "ultrafast", "superfast", "veryfast", "faster", "fast",
    "medium", "slow", "slower", "veryslow",
})

_OUTPUT_FORMATS = frozenset({
    "mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "ts", "m4v",
    "mp3", "wav", "aac", "ogg", "flac", "m4a", "wma", "opus",
    "png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp",
})

# Bitrate must be digits optionally followed by 'k' or 'M'
_BITRATE_RE = re.compile(r"^\d{1,6}[kKmM]?$")

# Color values: hex (0x.../#...) or named colors
_COLOR_RE = re.compile(r"^(0x[0-9a-fA-F]{1,8}|#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$")

# FFmpeg timestamp: HH:MM:SS or HH:MM:SS.mmm or seconds
_TIMESTAMP_RE = re.compile(r"^(\d{1,3}:\d{2}:\d{2}(\.\d{1,3})?|\d+(\.\d+)?)$")

# dB values: e.g. "-30dB", "0dB"
_DB_RE = re.compile(r"^-?\d{1,3}(\.\d{1,2})?dB$")


def validate_video_codec(value: str, name: str = "codec") -> str:
    v = str(value).strip().lower()
    if v not in _VIDEO_CODECS:
        raise ValueError(f"{name} must be one of {sorted(_VIDEO_CODECS)}, got '{value}'")
    return v


def validate_audio_codec(value: str, name: str = "codec") -> str:
    v = str(value).strip().lower()
    if v not in _AUDIO_CODECS:
        raise ValueError(f"{name} must be one of {sorted(_AUDIO_CODECS)}, got '{value}'")
    return v


def validate_preset(value: str, name: str = "preset") -> str:
    v = str(value).strip().lower()
    if v not in _PRESETS:
        raise ValueError(f"{name} must be one of {sorted(_PRESETS)}, got '{value}'")
    return v


def validate_output_format(value: str, name: str = "format") -> str:
    v = str(value).strip().lower()
    if v not in _OUTPUT_FORMATS:
        raise ValueError(f"{name} must be one of {sorted(_OUTPUT_FORMATS)}, got '{value}'")
    return v


def validate_bitrate(value: str, name: str = "bitrate") -> str:
    v = str(value).strip()
    if not _BITRATE_RE.match(v):
        raise ValueError(f"{name} must match pattern '<digits>[k|M]', got '{value}'")
    return v


def validate_color(value: str, name: str = "color") -> str:
    v = str(value).strip()
    if not _COLOR_RE.match(v):
        raise ValueError(f"{name} must be a hex color or named color, got '{value}'")
    return v


def validate_timestamp(value: str, name: str = "timestamp") -> str:
    v = str(value).strip()
    if not _TIMESTAMP_RE.match(v):
        raise ValueError(f"{name} must be HH:MM:SS[.mmm] or seconds, got '{value}'")
    return v


def validate_db_value(value: str, name: str = "threshold") -> str:
    v = str(value).strip()
    if not _DB_RE.match(v):
        raise ValueError(f"{name} must be a dB value like '-30dB', got '{value}'")
    return v
