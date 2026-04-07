"""
Audio Converter — Native audio processing via FFmpeg subprocess.

Handles: convert, trim, merge, normalize, compress, split, fade,
         metadata, waveform, silence removal, speed, reverse.

Binary dep: ffmpeg (must be on PATH or at FFMPEG_PATH env var)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger(__name__)

FFMPEG = os.environ.get("FFMPEG_PATH", "ffmpeg")
FFPROBE = os.environ.get("FFPROBE_PATH", "ffprobe")


class AudioConverter:
    """Server-side audio processing handler via FFmpeg."""

    async def convert(
        self,
        tool_id: str,
        *,
        input_file_url: str | None = None,
        input_bytes: bytes | None = None,
        options: dict[str, Any] | None = None,
        output_dir: str | None = None,
    ) -> dict[str, Any]:
        opts = options or {}
        _created_tmp = output_dir is None
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_aud_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        input_path = out_dir / "input"
        if input_bytes:
            input_path.write_bytes(input_bytes)
        elif input_file_url:
            data = await self._download(input_file_url)
            input_path.write_bytes(data)
        else:
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": "No input audio provided"}

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if not handler:
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": f"Unknown audio tool: {tool_id}"}

        try:
            result = await handler(input_path, opts, out_dir)
            if _created_tmp:
                result["_tmp_dir"] = str(out_dir)
            return result
        except Exception as e:
            logger.exception("Audio tool %s failed", tool_id)
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": str(e)}

    # ── Handlers ─────────────────────────────────────────────────

    async def _handle_audio_convert(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert audio between formats (MP3, WAV, AAC, OGG, FLAC, M4A)."""
        fmt = opts.get("outputFormat", "mp3")
        bitrate = opts.get("bitrate", "192k")
        sample_rate = opts.get("sampleRate", None)
        out_path = out_dir / f"output.{fmt}"

        codec_map = {
            "mp3": "libmp3lame",
            "aac": "aac",
            "m4a": "aac",
            "ogg": "libvorbis",
            "flac": "flac",
            "wav": "pcm_s16le",
        }
        codec = codec_map.get(fmt, "libmp3lame")

        cmd = [FFMPEG, "-y", "-i", str(input_path), "-c:a", codec]
        if fmt not in ("wav", "flac"):
            cmd.extend(["-b:a", bitrate])
        if sample_rate:
            cmd.extend(["-ar", str(sample_rate)])
        cmd.append(str(out_path))

        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_trim(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Trim audio to start/end timestamps."""
        start = opts.get("start", "00:00:00")
        end = opts.get("end", None)
        duration = opts.get("duration", None)
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"trimmed.{fmt}"

        cmd = [FFMPEG, "-y", "-i", str(input_path), "-ss", str(start)]
        if end:
            cmd.extend(["-to", str(end)])
        elif duration:
            cmd.extend(["-t", str(duration)])
        cmd.extend(["-c", "copy", str(out_path)])
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_normalize(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Normalize audio levels (loudnorm filter)."""
        target_lufs = opts.get("targetLufs", -16)
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"normalized.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-af", f"loudnorm=I={target_lufs}:TP=-1.5:LRA=11",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_compress(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Compress audio to reduce file size."""
        bitrate = opts.get("bitrate", "96k")
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"compressed.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-c:a", "libmp3lame", "-b:a", bitrate,
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_fade(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Apply fade in/out effects."""
        from src.core.param_validation import clamp_float
        fade_in = clamp_float(opts.get("fadeIn", 0), min_val=0, max_val=300, name="fadeIn")
        fade_out = clamp_float(opts.get("fadeOut", 0), min_val=0, max_val=300, name="fadeOut")
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"faded.{fmt}"

        filters = []
        if fade_in > 0:
            filters.append(f"afade=t=in:st=0:d={fade_in}")
        if fade_out > 0:
            # Need duration for fade out — get via ffprobe
            duration = await self._get_duration(input_path)
            if duration and duration > fade_out:
                filters.append(f"afade=t=out:st={duration - fade_out}:d={fade_out}")

        cmd = [FFMPEG, "-y", "-i", str(input_path)]
        if filters:
            cmd.extend(["-af", ",".join(filters)])
        cmd.append(str(out_path))
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_speed(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Change audio playback speed."""
        from src.core.param_validation import clamp_float
        speed = clamp_float(opts.get("speed", 1.5), min_val=0.25, max_val=4.0, name="speed")
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"speed.{fmt}"

        # atempo only supports 0.5–2.0, chain for extremes
        if 0.5 <= speed <= 2.0:
            af = f"atempo={speed}"
        elif speed > 2.0:
            af = f"atempo=2.0,atempo={speed / 2.0}"
        else:
            af = f"atempo=0.5,atempo={speed / 0.5}"

        cmd = [FFMPEG, "-y", "-i", str(input_path), "-af", af, str(out_path)]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_reverse(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Reverse audio."""
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"reversed.{fmt}"
        cmd = [FFMPEG, "-y", "-i", str(input_path), "-af", "areverse", str(out_path)]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_silence_remove(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Remove silence from audio."""
        threshold = opts.get("threshold", "-30dB")
        min_duration = opts.get("minDuration", "0.5")
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"no_silence.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-af", f"silenceremove=stop_periods=-1:stop_duration={min_duration}:stop_threshold={threshold}",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_metadata_view(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract audio metadata."""
        cmd = [
            FFPROBE, "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams",
            str(input_path),
        ]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
            metadata = json.loads(stdout.decode())
            return {"success": True, "output": metadata, "metadata": metadata}
        except Exception as e:
            return {"success": False, "error": f"ffprobe failed: {e}"}

    async def _handle_audio_metadata_strip(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Strip metadata from audio."""
        fmt = opts.get("outputFormat", "mp3")
        out_path = out_dir / f"stripped.{fmt}"
        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-map_metadata", "-1", "-c", "copy",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_audio_waveform(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Generate waveform image from audio."""
        from src.core.param_validation import clamp_int
        width = clamp_int(opts.get("width", 800), min_val=100, max_val=8000, name="width")
        height = clamp_int(opts.get("height", 200), min_val=50, max_val=4000, name="height")
        color = opts.get("color", "0x1DB954")
        out_path = out_dir / "waveform.png"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-filter_complex", f"showwavespic=s={width}x{height}:colors={color}",
            "-frames:v", "1",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    # ── Canonical-ID Alias ──────────────────────────────────────

    async def _handle_audio_cutter(self, input_path, opts, out_dir):
        """Alias: audio-cutter → audio_trim."""
        return await self._handle_audio_trim(input_path, opts, out_dir)

    # ── Utilities ─────────────────────────────────────────────────

    async def _get_duration(self, path: Path) -> float | None:
        """Get audio duration in seconds."""
        try:
            cmd = [
                FFPROBE, "-v", "quiet", "-show_entries", "format=duration",
                "-of", "csv=p=0", str(path),
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            return float(stdout.decode().strip())
        except Exception:
            return None

    async def _run_ffmpeg(
        self, cmd: list[str], output_path: Path, timeout: float = 300.0
    ) -> dict[str, Any]:
        logger.info("FFmpeg: %s", " ".join(cmd))
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)

            if proc.returncode != 0:
                logger.error("FFmpeg error: %s", stderr.decode()[-500:])
                return {"success": False, "error": "Audio processing failed"}

            if output_path.exists():
                return {
                    "success": True,
                    "output": str(output_path),
                    "metadata": {"size_bytes": output_path.stat().st_size if output_path.is_file() else 0},
                }
            return {"success": False, "error": "FFmpeg produced no output"}
        except asyncio.TimeoutError:
            return {"success": False, "error": f"FFmpeg timed out after {timeout}s"}
        except FileNotFoundError:
            return {"success": False, "error": f"FFmpeg not found at '{FFMPEG}'. Install FFmpeg."}

    async def _download(self, url: str) -> bytes:
        from src.core.safe_download import MAX_DOWNLOAD_BYTES, safe_download
        return await safe_download(url, max_bytes=MAX_DOWNLOAD_BYTES["audio"])
