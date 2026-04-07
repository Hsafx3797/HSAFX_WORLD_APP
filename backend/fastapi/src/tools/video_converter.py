"""
Video Converter — Native video processing via FFmpeg subprocess.

Handles: transcode, trim, merge, resize, compress, rotate, extract audio/frames,
         video-to-gif, gif-to-video, thumbnail, watermark, speed, subtitles.

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


class VideoConverter:
    """Server-side video processing handler via FFmpeg."""

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
        out_dir = Path(output_dir or tempfile.mkdtemp(prefix="hsafx_vid_"))
        out_dir.mkdir(parents=True, exist_ok=True)

        # Download input
        input_path = out_dir / "input"
        if input_bytes:
            input_path.write_bytes(input_bytes)
        elif input_file_url:
            data = await self._download(input_file_url)
            input_path.write_bytes(data)
        else:
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": "No input video provided"}

        handler = getattr(self, f"_handle_{tool_id.replace('-', '_')}", None)
        if not handler:
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": f"Unknown video tool: {tool_id}"}

        try:
            result = await handler(input_path, opts, out_dir)
            if _created_tmp:
                result["_tmp_dir"] = str(out_dir)
            return result
        except Exception as e:
            logger.exception("Video tool %s failed", tool_id)
            if _created_tmp:
                shutil.rmtree(out_dir, ignore_errors=True)
            return {"success": False, "error": str(e)}

    # ── Handlers ─────────────────────────────────────────────────

    async def _handle_video_transcode(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Transcode video to different format/codec."""
        from src.core.param_validation import clamp_int
        fmt = opts.get("outputFormat", "mp4")
        codec = opts.get("codec", "libx264")
        crf = clamp_int(opts.get("crf", 23), min_val=0, max_val=51, name="crf")
        out_path = out_dir / f"output.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-c:v", codec, "-crf", str(crf),
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_trim(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Trim video to start/end timestamps."""
        start = opts.get("start", "00:00:00")
        end = opts.get("end", None)
        duration = opts.get("duration", None)
        fmt = opts.get("outputFormat", "mp4")
        out_path = out_dir / f"trimmed.{fmt}"

        cmd = [FFMPEG, "-y", "-i", str(input_path), "-ss", str(start)]
        if end:
            cmd.extend(["-to", str(end)])
        elif duration:
            cmd.extend(["-t", str(duration)])
        cmd.extend(["-c", "copy", str(out_path)])
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_resize(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Resize video dimensions."""
        from src.core.param_validation import clamp_int
        width = clamp_int(opts.get("width", 1280), min_val=16, max_val=7680, name="width")
        height = clamp_int(opts.get("height", 720), min_val=16, max_val=4320, name="height")
        fmt = opts.get("outputFormat", "mp4")
        out_path = out_dir / f"resized.{fmt}"

        # Ensure even dimensions for H.264
        w = int(width) + (int(width) % 2)
        h = int(height) + (int(height) % 2)

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-vf", f"scale={w}:{h}",
            "-c:v", "libx264", "-c:a", "copy",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_compress(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Compress video to reduce file size."""
        from src.core.param_validation import clamp_int
        crf = clamp_int(opts.get("crf", 28), min_val=0, max_val=51, name="crf")
        preset = opts.get("preset", "medium")
        fmt = opts.get("outputFormat", "mp4")
        out_path = out_dir / f"compressed.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-c:v", "libx264", "-crf", str(crf), "-preset", preset,
            "-c:a", "aac", "-b:a", "96k",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_extract_audio(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract audio track from video."""
        fmt = opts.get("audioFormat", "mp3")
        bitrate = opts.get("bitrate", "192k")
        out_path = out_dir / f"audio.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-vn", "-acodec", "libmp3lame" if fmt == "mp3" else "aac",
            "-b:a", bitrate,
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_extract_frames(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract frames from video at specified intervals."""
        from src.core.param_validation import clamp_float
        fps = clamp_float(opts.get("fps", 1), min_val=0.01, max_val=60, name="fps")
        fmt = opts.get("imageFormat", "png")
        frames_dir = out_dir / "frames"
        frames_dir.mkdir(exist_ok=True)

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-vf", f"fps={fps}",
            str(frames_dir / f"frame_%04d.{fmt}"),
        ]
        result = await self._run_ffmpeg(cmd, frames_dir)
        if result["success"]:
            frames = sorted(frames_dir.glob(f"*.{fmt}"))
            result["metadata"] = {"frame_count": len(frames)}
        return result

    async def _handle_video_to_gif(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Convert video to animated GIF."""
        from src.core.param_validation import clamp_int
        fps = clamp_int(opts.get("fps", 10), min_val=1, max_val=30, name="fps")
        width = clamp_int(opts.get("width", 480), min_val=16, max_val=1920, name="width")
        out_path = out_dir / "output.gif"

        # Two-pass for high quality
        palette_path = out_dir / "palette.png"
        cmd1 = [
            FFMPEG, "-y", "-i", str(input_path),
            "-vf", f"fps={fps},scale={width}:-1:flags=lanczos,palettegen",
            str(palette_path),
        ]
        cmd2 = [
            FFMPEG, "-y", "-i", str(input_path), "-i", str(palette_path),
            "-lavfi", f"fps={fps},scale={width}:-1:flags=lanczos [x]; [x][1:v] paletteuse",
            str(out_path),
        ]

        result = await self._run_ffmpeg(cmd1, palette_path)
        if not result["success"]:
            return result
        return await self._run_ffmpeg(cmd2, out_path)

    async def _handle_video_thumbnail(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract a single frame as thumbnail."""
        time = opts.get("time", "00:00:01")
        fmt = opts.get("imageFormat", "jpg")
        out_path = out_dir / f"thumbnail.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-ss", str(time), "-vframes", "1",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_speed(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Change video playback speed."""
        from src.core.param_validation import clamp_float
        speed = clamp_float(opts.get("speed", 2.0), min_val=0.25, max_val=4.0, name="speed")
        fmt = opts.get("outputFormat", "mp4")
        out_path = out_dir / f"speed.{fmt}"

        # Video speed: 1/speed, Audio speed: atempo
        vf = f"setpts={1/speed}*PTS"
        af = f"atempo={speed}" if 0.5 <= speed <= 2.0 else f"atempo={min(speed, 2.0)}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-vf", vf, "-af", af,
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_rotate(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Rotate video by 90/180/270 degrees."""
        angle = int(opts.get("angle", 90))
        if angle not in (90, 180, 270):
            return {"success": False, "error": "angle must be 90, 180, or 270"}
        fmt = opts.get("outputFormat", "mp4")
        out_path = out_dir / f"rotated.{fmt}"

        transpose_map = {90: "1", 180: "1,transpose=1", 270: "2"}
        vf = f"transpose={transpose_map.get(angle, '1')}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-vf", vf, "-c:a", "copy",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    async def _handle_video_metadata_view(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Extract video metadata using ffprobe."""
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

    async def _handle_video_metadata_strip(
        self, input_path: Path, opts: dict, out_dir: Path
    ) -> dict[str, Any]:
        """Strip metadata from video."""
        fmt = opts.get("outputFormat", "mp4")
        out_path = out_dir / f"stripped.{fmt}"

        cmd = [
            FFMPEG, "-y", "-i", str(input_path),
            "-map_metadata", "-1", "-c", "copy",
            str(out_path),
        ]
        return await self._run_ffmpeg(cmd, out_path)

    # ── Canonical-ID Aliases ─────────────────────────────────────
    # media-tools.ts uses these IDs; dispatch uses getattr so we need
    # methods with the exact canonical snake_case name.

    async def _handle_video_convert(self, input_path, opts, out_dir):
        """Alias: video-convert → video_transcode."""
        return await self._handle_video_transcode(input_path, opts, out_dir)

    async def _handle_extract_audio(self, input_path, opts, out_dir):
        """Alias: extract-audio → video_extract_audio."""
        return await self._handle_video_extract_audio(input_path, opts, out_dir)

    # ── Utilities ─────────────────────────────────────────────────

    async def _run_ffmpeg(
        self, cmd: list[str], output_path: Path, timeout: float = 300.0
    ) -> dict[str, Any]:
        """Run an FFmpeg command and return result."""
        logger.info("FFmpeg: %s", " ".join(cmd))
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)

            if proc.returncode != 0:
                err = stderr.decode()[-500:]
                logger.error("FFmpeg error: %s", err)
                return {"success": False, "error": "Video processing failed"}

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
        return await safe_download(url, max_bytes=MAX_DOWNLOAD_BYTES["video"])
