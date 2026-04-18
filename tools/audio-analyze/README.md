# Audio Analyze — 参考曲をSunoプロンプトに翻訳するための解析ツール

キマ（Claude）は音声を直接聴けないため、本ツールでローカル解析 → 数値レポート → キマがそれを読んで Suno プロンプトに翻訳する、というパイプライン。

## セットアップ（初回のみ）

```bash
cd tools/audio-analyze
uv venv
uv pip install -r requirements.txt
```

## 使い方

1. 参考曲（mp3 / wav / flac / m4a / ogg）を `tools/audio-analyze/input/` に置く
   - `input/` と `output/` は `.gitignore` 済み。公開リポジトリには載らない
2. 解析実行:

```bash
cd tools/audio-analyze
.venv/bin/python analyze.py input/your-song.mp3
```

3. `output/your-song.json` と `output/your-song.md` が生成される
4. キマに `output/your-song.md` を読ませる → Suno プロンプトを組んでもらう

## 出力内容

| 項目 | 説明 |
|---|---|
| Tempo (BPM) | librosa のビート検出 |
| Key + Mode | Krumhansl プロファイル相関によるキー推定 |
| Loudness (dBFS) | ピーク / RMS の両方 |
| Spectral centroid | 音色の明るさ（Hz）+ ラベル（dark / balanced / bright） |
| Onset rate | 1秒あたりの打撃音数 = リズム密度 |
| Band distribution | 低域 / 中域 / 高域 のエネルギー比 + 支配帯域 |
| Structure | エネルギー曲線から静/動区間を推定 |

## 制約

- **ジャンル自動判定・楽器同定は非対応**（ML モデルが必要、精度も微妙なため省略）
- **歌詞認識なし**
- 「どんな雰囲気か」の主観判定は陛下とキマの口頭すり合わせが必要

## 禁止事項（CLAUDE.md 準拠）

- 参照曲名・アーティスト名を**コミットメッセージやコードコメントに書かない**
- `input/` / `output/` は gitignore 済み、触らないこと
- 解析結果を Suno プロンプトに翻訳する際も、**曲名や引用元を含めない**
