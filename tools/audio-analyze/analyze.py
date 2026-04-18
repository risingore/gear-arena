#!/usr/bin/env python3
"""Audio analysis CLI for translating reference tracks into Suno-style prompts.

Outputs JSON + Markdown reports containing BPM, key, loudness, spectral
brightness, onset rate, and a coarse energy-curve structure estimate.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

import librosa
import numpy as np


KEY_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

KRUMHANSL_MAJOR = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
)
KRUMHANSL_MINOR = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
)


@dataclass
class AnalysisResult:
    path: str
    duration_sec: float
    sample_rate: int
    bpm: float
    beat_count: int
    beats_per_bar: int
    key: str
    mode: str
    key_confidence: float
    rms_mean: float
    rms_peak: float
    loudness_dbfs_peak: float
    loudness_dbfs_rms: float
    spectral_centroid_hz_mean: float
    spectral_centroid_hz_std: float
    brightness_label: str
    onset_rate_hz: float
    rhythm_density_label: str
    low_band_energy_ratio: float
    mid_band_energy_ratio: float
    high_band_energy_ratio: float
    dominant_band_label: str
    structure_segments: list[dict]


def estimate_key(y: np.ndarray, sr: int) -> tuple[str, str, float]:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chroma.mean(axis=1)
    best_score = -np.inf
    best_key = "C"
    best_mode = "major"
    for i in range(12):
        major_corr = np.corrcoef(np.roll(KRUMHANSL_MAJOR, i), chroma_mean)[0, 1]
        minor_corr = np.corrcoef(np.roll(KRUMHANSL_MINOR, i), chroma_mean)[0, 1]
        if major_corr > best_score:
            best_score = major_corr
            best_key = KEY_NAMES_SHARP[i]
            best_mode = "major"
        if minor_corr > best_score:
            best_score = minor_corr
            best_key = KEY_NAMES_SHARP[i]
            best_mode = "minor"
    confidence = float(max(0.0, min(1.0, best_score)))
    return best_key, best_mode, confidence


def band_energy_ratios(y: np.ndarray, sr: int) -> tuple[float, float, float]:
    stft = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    power = stft.mean(axis=1) ** 2
    total = power.sum()
    if total <= 0:
        return 0.0, 0.0, 0.0
    low = power[freqs < 250].sum() / total
    mid = power[(freqs >= 250) & (freqs < 4000)].sum() / total
    high = power[freqs >= 4000].sum() / total
    return float(low), float(mid), float(high)


def structure_from_energy(y: np.ndarray, sr: int, duration: float) -> list[dict]:
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    if len(rms) == 0:
        return []
    median = float(np.median(rms))
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    segments: list[dict] = []
    current_label = "quiet" if rms[0] < median else "loud"
    current_start = float(times[0])
    for t, r in zip(times, rms):
        label = "quiet" if r < median else "loud"
        if label != current_label:
            segments.append(
                {
                    "start_sec": round(current_start, 2),
                    "end_sec": round(float(t), 2),
                    "label": current_label,
                }
            )
            current_label = label
            current_start = float(t)
    segments.append(
        {
            "start_sec": round(current_start, 2),
            "end_sec": round(duration, 2),
            "label": current_label,
        }
    )
    merged: list[dict] = []
    for seg in segments:
        if seg["end_sec"] - seg["start_sec"] < 1.5:
            continue
        if merged and merged[-1]["label"] == seg["label"]:
            merged[-1]["end_sec"] = seg["end_sec"]
        else:
            merged.append(seg)
    return merged


def label_brightness(centroid_hz: float) -> str:
    if centroid_hz < 1500:
        return "dark"
    if centroid_hz < 3000:
        return "balanced"
    if centroid_hz < 5000:
        return "bright"
    return "very bright / harsh"


def label_rhythm(onset_rate_hz: float) -> str:
    if onset_rate_hz < 1.5:
        return "sparse"
    if onset_rate_hz < 3.0:
        return "moderate"
    if onset_rate_hz < 5.0:
        return "dense"
    return "very dense"


def label_dominant_band(low: float, mid: float, high: float) -> str:
    bands = {"low (sub/kick)": low, "mid (body/synths)": mid, "high (cymbals/air)": high}
    return max(bands, key=bands.get)


def analyze(path: Path) -> AnalysisResult:
    y, sr = librosa.load(str(path), sr=None, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])

    key, mode, key_conf = estimate_key(y, sr)

    rms = librosa.feature.rms(y=y)[0]
    rms_mean = float(rms.mean())
    rms_peak = float(rms.max())
    peak = float(np.abs(y).max() or 1e-12)
    loud_peak_db = float(20 * np.log10(peak))
    loud_rms_db = float(20 * np.log10(rms_mean or 1e-12))

    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    centroid_mean = float(centroid.mean())
    centroid_std = float(centroid.std())

    onsets = librosa.onset.onset_detect(y=y, sr=sr, units="time")
    onset_rate = float(len(onsets) / duration) if duration > 0 else 0.0

    low, mid, high = band_energy_ratios(y, sr)
    segments = structure_from_energy(y, sr, duration)

    return AnalysisResult(
        path=str(path),
        duration_sec=round(duration, 2),
        sample_rate=sr,
        bpm=round(bpm, 1),
        beat_count=int(len(beats)),
        beats_per_bar=4,
        key=key,
        mode=mode,
        key_confidence=round(key_conf, 3),
        rms_mean=round(rms_mean, 4),
        rms_peak=round(rms_peak, 4),
        loudness_dbfs_peak=round(loud_peak_db, 2),
        loudness_dbfs_rms=round(loud_rms_db, 2),
        spectral_centroid_hz_mean=round(centroid_mean, 1),
        spectral_centroid_hz_std=round(centroid_std, 1),
        brightness_label=label_brightness(centroid_mean),
        onset_rate_hz=round(onset_rate, 2),
        rhythm_density_label=label_rhythm(onset_rate),
        low_band_energy_ratio=round(low, 3),
        mid_band_energy_ratio=round(mid, 3),
        high_band_energy_ratio=round(high, 3),
        dominant_band_label=label_dominant_band(low, mid, high),
        structure_segments=segments,
    )


def render_markdown(r: AnalysisResult) -> str:
    lines = [
        f"# Audio Analysis — {Path(r.path).name}",
        "",
        f"- **Duration**: {r.duration_sec}s ({r.sample_rate} Hz)",
        f"- **Tempo**: {r.bpm} BPM ({r.beat_count} beats detected)",
        f"- **Key**: {r.key} {r.mode} (confidence {r.key_confidence})",
        f"- **Loudness**: peak {r.loudness_dbfs_peak} dBFS / RMS {r.loudness_dbfs_rms} dBFS",
        f"- **Spectral centroid**: {r.spectral_centroid_hz_mean} Hz — **{r.brightness_label}**",
        f"- **Onset rate**: {r.onset_rate_hz} hits/sec — **{r.rhythm_density_label}**",
        f"- **Band distribution**: low {r.low_band_energy_ratio} / mid {r.mid_band_energy_ratio} / high {r.high_band_energy_ratio} — dominant: **{r.dominant_band_label}**",
        "",
        "## Structure (energy-based)",
        "",
    ]
    if r.structure_segments:
        lines.append("| Start | End | Energy |")
        lines.append("|---|---|---|")
        for seg in r.structure_segments:
            lines.append(f"| {seg['start_sec']}s | {seg['end_sec']}s | {seg['label']} |")
    else:
        lines.append("_No clear structure detected._")
    lines += [
        "",
        "## Suno translation hints",
        "",
        f"- Tempo tag: `{int(round(r.bpm))} BPM`",
        f"- Key tag: `{r.key} {r.mode}`",
        f"- Brightness tag: `{r.brightness_label} timbre`",
        f"- Rhythm tag: `{r.rhythm_density_label} rhythm`",
        f"- Dominant band: `{r.dominant_band_label}`",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze an audio file for Suno prompt authoring.")
    parser.add_argument("audio", type=Path, help="Path to an audio file (mp3, wav, flac, m4a, ogg)")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
        help="Directory to write <basename>.json and <basename>.md (default: ./output)",
    )
    args = parser.parse_args()

    if not args.audio.exists():
        print(f"error: file not found: {args.audio}", file=sys.stderr)
        return 2

    result = analyze(args.audio)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    stem = args.audio.stem
    (args.output_dir / f"{stem}.json").write_text(
        json.dumps(asdict(result), indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (args.output_dir / f"{stem}.md").write_text(render_markdown(result), encoding="utf-8")
    print(f"wrote {args.output_dir / f'{stem}.json'}")
    print(f"wrote {args.output_dir / f'{stem}.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
