#!/usr/bin/env python3
"""YouTube URL -> MP4 downloader (ffmpeg required).

Modern YouTube serves video and audio as separate streams, so ffmpeg is
mandatory for both MP4 muxing and MP3 extraction.

Usage:
  python fetch.py "https://www.youtube.com/watch?v=..."
  python fetch.py --audio "https://www.youtube.com/watch?v=..."
  python fetch.py --out /path/to/dir "https://..."
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from yt_dlp import YoutubeDL
except ImportError:
    sys.stderr.write(
        "yt-dlp not installed. Run: uv pip install -r requirements.txt\n"
    )
    sys.exit(2)


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUT = SCRIPT_DIR / "output"


def require_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        sys.stderr.write(
            "ffmpeg not found on PATH. Install it first:\n"
            "  sudo apt install ffmpeg\n"
        )
        sys.exit(3)


def build_opts(mode: str, out_dir: Path) -> dict:
    out_tmpl = str(out_dir / "%(title)s [%(id)s].%(ext)s")
    common = {
        "outtmpl": out_tmpl,
        "noplaylist": True,
        "restrictfilenames": True,
        "quiet": False,
        "no_warnings": False,
    }
    if mode == "mp4":
        return {
            **common,
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best",
            "merge_output_format": "mp4",
        }
    if mode == "audio":
        return {
            **common,
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
        }
    raise ValueError(f"unknown mode: {mode}")


def main() -> int:
    parser = argparse.ArgumentParser(description="YouTube to MP4 downloader")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "--audio",
        action="store_true",
        help="Download MP3 audio only (default: MP4 video)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Output directory (default: {DEFAULT_OUT})",
    )
    args = parser.parse_args()

    require_ffmpeg()

    mode = "audio" if args.audio else "mp4"
    args.out.mkdir(parents=True, exist_ok=True)
    opts = build_opts(mode, args.out)

    with YoutubeDL(opts) as ydl:
        return int(ydl.download([args.url]))


if __name__ == "__main__":
    sys.exit(main())
