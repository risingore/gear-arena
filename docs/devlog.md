# SOUL STRIKE — Devlog

Gamedev.js Jam 2026 / Theme: Machines / Deadline: 2026-04-26 17:00 CET (15:00 UTC)

Built with **Cursor + Claude Code** and the **kima-core** governance layer.
Engine: Phaser 4.0 / Vite 6 / TypeScript / Bun.

---

## Day 1 — 2026-04-15

### Decisions

- **Concept**: Slot auto-battler with a mecha ROGUE-lite twist. One run = 3–5 minutes, 5 rounds, boss at round 5.
- **Core gimmick**: Each of the 4 selectable robots has a unique **blueprint** (silhouette + slot layout). You assemble your machine by dropping parts into slots in the Build scene; in the Battle scene the same robot animates and fights automatically.
- **Viewpoint**: Side-view for battle, front-view blueprint for build.
- **Parts**: 15 total — 3 weapons, 3 armors, 3 engines, 3 gears, 3 specials.
- **4 cyborgs**: INDRA (balanced), GOLIATH-414 (heavy, 15 slots), LILITH (speed, 7 slots), MUMEI (tech, 11 soul slots).

### Architecture

- **Data layer as single source of truth.** Parameters, names, slot layouts, round enemies, shop economy, and synergies all live in `src/data/*.ts`. Game code reads from `@/data` and never contains magic numbers. Non-engineers can tune balance by editing these files directly — Vite HMR reflects changes in seconds and TypeScript's `satisfies` + template literal types catch mistakes at save time. Zero dependencies.
- **Scenes**: Boot → Preloader → Title → Select → Build → Battle → Result → GameOver. Global R key restarts from any scene. Run state is a single object in Phaser's Registry, shared across all scenes.
- **Audio**: No asset files. All SFX are synthesized at runtime with the Web Audio API — keeps the initial payload tiny (sub-360 KB gzip) and avoids license juggling entirely.

### Day 1 progress

- Set up the project from the `jam-phaser-template`.
- Locked in the concept, wrote `docs/concept.md` + `docs/parts-spec.md` + `docs/data-ownership.md`.
- Implemented every scene end-to-end with placeholder rectangles: you can already pick a robot, buy parts into its blueprint, auto-battle through 5 rounds, and restart on loss.
- Deployed to Cloudflare Workers: [machines.risingore.com](https://machines.risingore.com).
- Packaged the itch.io HTML5 zip.
- Pushed polish: SFX via Web Audio, damage/heal popups, Overdrive indicator, rotating gear backdrop on the Title scene.

### Next

- Day 2+: Replace placeholder rectangles with real art generated through the Grok → Piskel workflow documented in `ai-asset-workflow.md`.
- Day 8: Balance tuning entirely via `src/data/*.ts`.
- Day 11: Devlog final pass, itch.io page, submission.

---

## Day 1 — 2026-04-15 (follow-up)

Pushed the second batch of Day-1 work without waiting for Day 2. Everything below is fully automated or designer-driven; no manual art was required.

### Added

- **Audio**: `systems/audio.ts` synthesizes every SFX at runtime via the Web Audio API — click, buy, sell, reroll, attack_melee, attack_ranged, hit, repair, win, lose, victory. No asset files, no license checklists, no extra bytes.
- **Battle feel**: damage popups (`-N` rising and fading), heal popups (`+N` green), camera shake on hits, Overdrive flash when HP drops below 30 %, Turbo Combo indicator when engine_turbo + weapon_laser are both equipped.
- **Battle UX**: Space toggles speed between ×1 / ×2 / ×4; the current speed is shown top-right. Makes replaying a run feel snappy.
- **Scene transitions**: 180 ms cross-fades between every scene via `systems/transition.ts`.
- **Title**: three rotating blueprint gears as an ambient backdrop (placeholder until real art ships on Day 7).
- **Build UX**: number keys 1–5 buy from matching shop slots. Hover on a shop card to see a live stat diff (`MAX HP 100 → 120`, `DR pct 0 % → 15 %`) before you spend gold. Gold color flips to orange when you're hoarding more than 15 g.
- **Meta progression**: `systems/savedata.ts` records best round and total victories per robot in localStorage. Shown on the title screen when the save file has data.
- **Tests**: `bun test` with 18 unit tests covering `stats.ts` and `combat.ts`. Lets Day-8 balance changes fail fast instead of breaking combat silently.
- **Submission docs**: `docs/itch-description.md` drafted with tagline, full description, screenshot checklist, and a submission-day checklist.
- **Data ownership**: all of the above reads from `@/data` only. Zero magic numbers in scene code.

### Deferred for designer decision

Consolidated every open question into `tasks/kima-questions.md` so they can be batched-reviewed (Turbo Combo's real effect, Kinetic Shield's "block first hit" implementation, reroll cost curve, HP carry-over between rounds, etc.).

### Numbers

- `tsc --noEmit`: 0 errors, strict mode
- `bun test`: 18 / 18 passing
- `bun run build`: gzip total ~360 KB (target is under 2 MB)
- Live deploy: [machines.risingore.com](https://machines.risingore.com)

---

## Day 2 — 2026-04-16

### Progress

**Content expansion:**
- **Parts 15 → 25** (5 per category): Railgun, Flamethrower, Reactive Plating, Fortress Frame, Striker Core, Regen Cell, Micro Gear, Overclock Gear, Last Stand Module, Vampiric Core.
- **Enemy pool**: 10 normal enemies (tier 1-10), 5 mid-bosses, 3 big bosses, 1 super boss (APEX MACHINE). Each run generates a randomized 10-round lineup with ±10% stat variance.
- **Enemy diversity**: Mid-bosses and bosses now have multiple weapons, shield charges (block first N hits), and self-healing.
- **Robot slots expanded ~1.5x**: KNIGHT 9, GOLIATH 12, STRIKER 7, ORACLE 10.

**New systems:**
- **Consumable items** (5 types): Repair Spray, Emergency Patch (instant heal), Adrenaline Shot, Hardened Coating, Recon Scan (next-battle buffs). Items appear in shop with 20% chance alongside parts.
- **Achievement/title system**: 10 achievements derived from save data (no extra storage). Titles displayed on Title screen and in a new Collection tab.
- **Drag & drop** in the Build scene: drag shop cards onto blueprint slots. Valid drop targets highlight green.
- **Settings screen**: BGM/SFX volume, language (EN/JA), fullscreen, default battle speed, debug mode, reset all data.
- **Collection screen**: 4 tabs — MACHINES, PARTS, ENEMIES, TITLES.
- **Robot unlock progression**: clear with one robot to unlock the next.

**Combat & balance:**
- **HP carry-over**: actual remaining HP from previous battle carries into the next round (no more free heal).
- **Reroll cost**: escalates every 3 uses (+1g per 3 rerolls) instead of every single use.
- **Kinetic Shield**: first N hits are completely blocked (damage 0).
- **Synergies**: Gear Sync (3+ gears → -15% CD) and Turbo Combo (engine + weapon → -15% CD), stackable.
- **Auto fast-forward**: battle auto-accelerates to x6 after 15 seconds of real time.

**UX:**
- **Mouse-driven UI**: all menu scenes (Title, Select, Settings, Collection, GameOver) now use hover feedback (scale + alpha) on clickable elements. Keyboard shortcuts for battle speed retained.
- **HiDPI text**: crisp rendering on Retina/4K displays.
- **Tutorial hint** on round 1 Build screen.
- **GameOver analysis**: hints based on loadout (no weapons / too few parts / etc).
- **Debug badge**: red "DEBUG" label on all scenes when debug mode is ON.

**Art:**
- INDRA battle sprite (960x960 RGBA transparent, Grok + rembg).
- Art style locked: post-cyberpunk biomechanical. High-detail digital illustration, NOT pixel art.
- Batch background-removal tool (`bun run remove-bg`) via rembg.

**Infrastructure:**
- i18n system (gettext-style, English source strings as keys, ja.ts dictionary).
- BGM support with crossfade (MP3 + OGG fallback).
- Pre-commit hook: 3-layer defense (path blocking, banned string detection, identity verification).

### Numbers

- `tsc --noEmit`: 0 errors, strict mode
- `bun test`: 37 / 37 passing (stats, combat, loadout, achievements)
- `bun run build`: ~360 KB gzip
- Parts: 25 | Robots: 4 | Enemies: 19 | Items: 5 | Achievements: 10

### Next

- Day 3+: Remaining robot battle sprites (GOLIATH, STRIKER, ORACLE).
- Enemy sprites.
- Part icons for blueprint slots.
- BGM tracks (Suno).
- Balance tuning via `src/data/*.ts`.

---

## Day 3 — 2026-04-17

### Progress

**Ultimate-only combat pivot:**
- Removed auto-attack combat loop. Battles are now survival → ultimate → one shot. The player's only offensive action is pressing the ULTIMATE button when the gauge fills. This is the core identity of SOUL STRIKE: "One Shot. One Kill."

**Pachislot hit system:**
- Internal hit determination runs at 1/240.9 probability per tick during battle, inspired by Japanese pachislot machines.
- On hit: enter rush mode with dramatically increased rates and ultimate charge multiplier.
- Aura system: at 70% gauge during rush, an aura appears (green → blue → red → rainbow) indicating critical power level.
- Continuation: rush mode can chain across rounds for persistent advantage.

**ULTIMATE button freeze mechanic:**
- When ultimate gauge fills, combat freezes. A large ULTIMATE button appears center-screen.
- Player presses Space or clicks to fire. The pachislot system resolves whether the strike is normal or critical.
- Critical hits trigger the full 8-phase cut-in animation with amplified damage (SLOT_HIT_DAMAGE_MULT).

**Prediction effects:**
- Visual hints that appear on the ULTIMATE button screen before the player presses.
- Rainbow button (100% trust, hit-only), Fish School (80%), Red Flash (60%), Exclamation (40%), Lightning (70%), Mandala Flash (90%, hit-only), Screen Glitch (30%).
- Each prediction has separate weights for hit vs miss scenarios — some are reliable tells, others are traps.

**8-phase cut-in animation with critical variant:**
- Phase 0: camera zoom. Phase 1: white flash → dark overlay. Phase 2: diagonal slash lines. Phase 3: V-shape screen crack. Phase 4: character portrait slide-in. Phase 5: ultimate name text. Phase 6: strike count. Phase 7: shockwave rings. Phase 8: dismiss + camera restore.
- Critical variant: red color theme, extra shockwaves, "CRITICAL!" pulsing text, deeper camera zoom.

**Category rename:**
- Weapon → Module, Armor → Implant, Engine → Charger, Gear → Booster, Special → Soul.
- All 25 parts renamed with cyberpunk-appropriate names matching the new categories.

**World setting:**
- Corporate AI "ATMAN" controls humanity through neural implants. The player commands resistance cyborgs who severed their neural links.
- Circle of Samsara story integration — ATMAN's name references the Buddhist concept of self/soul, tying into the Soul part category and ORACLE's soul manifestation abilities.

**Build scene redesign:**
- Drag & drop only — no click-to-equip. Drag from shop to slots, drag equipped parts to SELL zone (50% refund) or STORAGE zone.
- Buff slots on the blueprint accept consumable items for next-battle effects.

**Select screen redesign:**
- Full-page character view with large portrait, stat summary, and slot layout preview.

**UI factory + fonts:**
- Bebas Neue for headings, Rajdhani for body text. Consistent `createLabel` factory across all scenes.

**Visual debugger + headless browser testing:**
- `runVisualChecks()` validates scene layout (overlaps, off-screen elements, text truncation) in debug mode.
- Headless browser test harness for CI validation.

**Slot expansion:**
- KNIGHT: 9 → 14 slots. GOLIATH: 12 → 16 slots. STRIKER: 7 → 13 slots. ORACLE: 10 → 15 slots.

### Numbers

- `tsc --noEmit`: 0 errors, strict mode
- Predictions: 7 effects (rainbow, fish, red flash, exclamation, lightning, mandala, glitch)
- Parts: 25 across 5 categories (module, implant, charger, booster, soul)
- Slot counts: 13–16 per character

### Next

- Day 4+: Remaining cyborg battle sprites (GOLIATH, STRIKER, ORACLE).
- Enemy sprites and part icons.
- BGM tracks.
- Balance tuning via `src/data/*.ts`.
- itch.io page finalization.

---

## Day 4 — 2026-04-18

### Progress

**Visual debugger v2:**
- Added circle-on-circle overlap detection (catches blueprint slot collisions).
- Added asymmetric divider margin check — measures gap above and below each divider line, flags if difference exceeds 6px. Would have caught the Settings layout bug instantly.
- Now 8 total automated checks running in debug mode.

**Settings layout fix:**
- Root cause: `y += ROW_H` was added before divider margin, making the gap above the divider 84px vs 36px below. Removed the stray row advance; divider margins are now symmetric (36px / 36px) via `DIVIDER_MARGIN` constant.

**Build scene — slot overlap fix:**
- `SLOT_RADIUS` reduced from 22 to 19 (diameter 44 → 38px).
- INDRA slot y-coordinates respaced from 28-unit to 32-unit vertical intervals.
- GOLIATH chest/arm/leg gaps normalized from 30 to 32 units.
- All 4 robots now have ≥32 virtual units between adjacent slots → 48px at render scale, 10px clear gap.

**Data & content:**
- Ultimates, enemies, balance, skills, achievements, predictions — incremental updates.
- New data files: `placementSynergies.ts`, `storyText.ts`.
- New system: `layoutDebug.ts` for interactive layout inspection.

**Infrastructure:**
- `tools/audio-analyze` and `tools/youtube-dl` utility scripts.
- Browser test harness expanded.
- PWA manifest and service worker updates.

### Obstacles

- Repeated failure to fix the Settings divider margin issue across multiple attempts. Root cause was not the margin values themselves but an extra `y += ROW_H` polluting the spacing calculation. Lesson captured in visual debugger Check 8 to prevent recurrence.

### Next

- Day 5+: Remaining cyborg battle sprites.
- Enemy sprites and part icons.
- BGM tracks.
- Balance tuning via `src/data/*.ts`.
- itch.io page finalization.

---

## Day N template

```
## Day N — YYYY-MM-DD
### Progress
### Obstacles
### Next
```
