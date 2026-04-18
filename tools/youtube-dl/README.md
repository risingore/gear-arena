# YouTube DL — YouTube URL → MP4 ダウンローダー

個人利用・参考解析目的の YouTube ダウンロードツール。既定は MP4 動画、`--audio` で MP3 音声。

## 前提（必須）

**ffmpeg をシステムにインストール済みであること。** 現代の YouTube は映像と音声を分離配信するため、MP4 合成・MP3 抽出のどちらも ffmpeg が必要。

```bash
sudo apt install ffmpeg
```

## セットアップ（初回のみ）

```bash
cd tools/youtube-dl
uv venv
uv pip install -r requirements.txt
```

## 使い方

### MP4 動画ダウンロード（既定）

```bash
cd tools/youtube-dl
.venv/bin/python fetch.py "https://www.youtube.com/watch?v=XXXXXXXXXXX"
# -> output/<title> [<id>].mp4
```

### MP3 音声ダウンロード

```bash
.venv/bin/python fetch.py --audio "https://..."
# -> output/<title> [<id>].mp3
```

### 出力先の指定

```bash
# 音声解析ツールの input/ に直接流す
.venv/bin/python fetch.py --audio --out ../audio-analyze/input "https://..."
```

## 制約・禁止事項

- **個人利用・参考解析目的のみ**。再配布禁止。
- `output/` は `.gitignore` 済み。公開リポジトリには載らない。
- 参照曲名・アーティスト名をコミットメッセージ・コードコメント等に書かない（CLAUDE.md 準拠）。
