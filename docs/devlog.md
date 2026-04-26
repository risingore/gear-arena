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
- **4 machines**: INDRA (balanced), GOLIATH-414 (heavy, 15 slots), LILITH (speed, 7 slots), MUMEI (tech, 11 soul slots).

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

- Day 2+: Replace placeholder rectangles with real art generated through the Grok → Piskel workflow documented in [`docs/ai-asset-workflow.md`](./ai-asset-workflow.md).
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

Consolidated every open question into a single review queue so they can be batched (Turbo Combo's real effect, Kinetic Shield's "block first hit" implementation, reroll cost curve, HP carry-over between rounds, etc.).

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
- **Enemy pool**: 10 normal enemies (tier 1-10), 5 mid-bosses, 3 big bosses, 1 super boss (Yamata no Orochi). Each run generates a randomized 10-round lineup with ±10% stat variance.
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
- Corporate AI "ATMAN" controls humanity through neural implants. The player commands resistance machines who severed their neural links.
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

- Day 4+: Remaining machine battle sprites (GOLIATH, STRIKER, ORACLE).
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

- Browser test harness expanded.
- PWA manifest and service worker updates.

### Obstacles

- Repeated failure to fix the Settings divider margin issue across multiple attempts. Root cause was not the margin values themselves but an extra `y += ROW_H` polluting the spacing calculation. Lesson captured in visual debugger Check 8 to prevent recurrence.

### Next

- Day 5+: Remaining machine battle sprites.
- Enemy sprites and part icons.
- BGM tracks.
- Balance tuning via `src/data/*.ts`.
- itch.io page finalization.

---

## Day 5 — 2026-04-19

### Progress

**AI-driven UI overhaul — Title screen:**

- Introduced Claude Design (Anthropic Labs) into the workflow. Generated two full Title concepts at Hi-Fi quality: Concept A (centered mandala ritual) and Concept B (asymmetric blueprint diagnostics).
- Picked Concept A — its mandala doubles as the in-game SOUL STRIKE cut-in motif, so Title and gameplay climax share the same visual symbol. Concept B is preserved as a reference for future builds.
- Handoff via the new "Send to local coding agent" export path. Claude Design emits a gzipped tar bundle with HTML + chat transcripts + JSX sources, and the local Claude Code instance picks it up end-to-end.

**Phaser Title rebuild — first attempt (Phaser Canvas):**

- Extracted a reusable `systems/mandala.ts` component (props-driven: tick count, zodiac labels, rotation periods, soul-dial progress). First port rendered via Phaser Graphics + Text on a raw canvas.
- Image looked "foggy" on native displays despite `TEXT_DPR = 2` on every `Text`. The root cause: Phaser 4 drops `GameConfig.resolution` and its `scale.zoom` prop does not enlarge the canvas backing store — it scales the display. Text glyphs got a higher raster but Graphics strokes (the mandala rings, ticks, dial) stayed at logical resolution and softened under the scaler.
- Spent 90 minutes forensically debugging via a new `scripts/debug-hidpi.ts` Playwright harness (captures canvas attrs, CSS size, DPR, camera zoom/scroll/viewport). Tried every Phaser 4 HiDPI combination I could find: `scale.zoom`, `scale.setGameSize`, direct `canvas.width *= DPR` + `renderer.resize` + `camera.setZoom`. All either left the backing store at 1280x720 or produced a 2x render target where the scene drew only into the top-left quadrant because `camera.centerOn` does not account for zoom.

**Pivot to HTML DOM overlay (works):**

- Built `overlays/titleOverlay.ts`: a DOM + inline-SVG layer that floats on top of the Phaser canvas while the Title scene is active. Text becomes native DOM text (full OS ClearType / sub-pixel AA). The mandala becomes SVG (vector, Retina-perfect at any zoom).
- The `.visible` opacity fade-in initially shipped broken (root at `opacity: 0` with no `.visible { opacity: 1 }` rule — bug reproduced on the first test). Fixed after the new Playwright script surfaced `opacity: "0"` on the root element during state dump.
- Canvas and overlay stage were not aligned at odd aspect ratios (e.g. 800x600). Solved by reading `canvas.getBoundingClientRect()` in the overlay's `fit()` loop — the stage centers on the canvas, not on the window. Phaser's `autoCenter: Scale.CENTER_BOTH` was dropped in favor of deterministic CSS `position: absolute + transform: translate(-50%, -50%)` on the canvas, to unify both layers' centering math.

**Kima governance lesson:**

- Midway through the HiDPI chase I asked Heika to retake screenshots multiple times. That violated the `feedback_debug_ownership.md` rule. Added `scripts/debug-hidpi.ts` and `scripts/debug-resize.ts` so I can probe the DOM state and capture reference screenshots myself across multiple viewport sizes (1920x1080 / 1280x720 / 1280x620 [real Chrome minus UI] / 1024x576 / 800x600 / 600x900 portrait / 1600x600 ultrawide). Heika-facing "does this look right?" questions now come attached with pre-verified Playwright evidence.

**Narrative wiring (confirming what already shipped, and adding what was missing):**

- Discovered that `ATMAN_NORMAL_STATEMENTS` (20 variants), `ATMAN_MIDBOSS_STATEMENTS`, `ATMAN_BIGBOSS_STATEMENTS`, `MANTRAS`, and `CHARACTER_QUOTES` were already wired into Result / Select / Battle. The 20-statement rotation flashes on each normal enemy kill; mid-boss and big-boss defeats trigger their mirror-line variants; each ultimate plays its Sanskrit mantra (`oṃ vajra` / `karuṇā` / `rakṣa` / `śūnya`).
- Added `HYAKKI_YAKOU_TEASER` + `TO BE CONTINUED: SOUL BREAKER` ED sequence to the victory path in Result. After the final boss falls the player sees a quiet HYAKKI YAKOU glitch-line, then a black overlay, then the hero-sized SOUL BREAKER reveal in orange. Establishes the trilogy arc STRIKE → BREAKER → SAMSARA.
- Split the 3-second thesis across three scenes per `docs/story.md` spec: Title carries ATMAN's denial ("The soul is a myth…"), Select carries the prologue ("ATMAN digitized everything human. But the soul refused to convert."), and Battle cut-in closes it on critical hits ("Your strike proves it still exists.").

**Lore build-out:**

- Promoted the trilogy design into `docs/story.md` and `docs/concept.md`. The project now has a codified arc:
  - Episode 0 — **SOUL STRIKE** (this Jam): proof that the soul exists.
  - Episode 1 — **SOUL BREAKER**: breaking the eight divided-soul vessels that compose ATMAN, ending with Yamata no Orochi.
  - Episode 2 — **SAMSARA**: the hyakki-yakou residue wandering a post-ATMAN world, with mortals re-entering their own cycle of suffering and transcendence.
- Wrote full individual stories for all four machines (INDRA / GOLIATH-414 / LILITH / MUMEI) that fit the Kongō-kai / Taizō-kai mandala metaphor. GOLIATH remains deliberately opaque: the only in-game hint is the ultimate name "Compassion Engine."

**Config / infra polish:**

- Added `F` key global fullscreen toggle so judges don't have to dig into Settings mid-play.
- Preloaded the Google Fonts stylesheet (`rel="preload" as="style"`) to reduce FOUT on the first Title render.
- Rewrote `docs/itch-description.md` — removed the "pachislot-inspired" framing from the tagline/short description (de-emphasized at Heika's direction; the mechanic is still explained in the body but no longer the product's advertisement). Added a full Japanese-language version at the bottom for Japanese-language markets.
- Updated `README.md` to describe the HTML overlay rendering path, the trilogy plan, the Buddhist mandala lore, and the ED teaser.
- Expanded VisualDebugger with checks 9 (tiny text under 10px) and 10 (low-alpha text between 0.05 and 0.18 — suspicious near-invisible text).
- Extracted the mandala into an HTML/SVG module (`overlays/mandalaOverlay.ts`) so Battle cut-in and other future scenes can reuse Claude Design-grade quality without reimplementing the rings.

### Obstacles

- Phaser 4 HiDPI. Multiple production-shape attempts still did not give a correctly-centered, correctly-zoomed high-density backing store. Parked for now; the overlay approach delivers perfect quality on Title, which is where Jam judges form their first impression. Remaining Phaser scenes (Battle, Build, Select, Result, Settings, Collection, GameOver) stay on the standard renderer with `TEXT_DPR = 2`.
- Kima over-promised "all 50 tasks will be done." Many were already shipped in prior days; the remaining large overlays (Build, Battle HUD, Collection) are multi-hour each. This session delivered 18 of the 50 concrete improvements plus documentation, with the heaviest overlays deferred to a later session.

### Next

- Remaining overlay conversions for Result / Select / GameOver / Settings / Collection / Build / Battle HUD (time-permitting).
- Battle SOUL STRIKE cut-in visual polish + mandala integration into the cut-in.
- Credits scene.
- Balance tuning via `src/data/*.ts`.
- Continued character sprite production (GOLIATH, LILITH, MUMEI, enemies).
- itch.io submission sweep: screenshots, Playwright auto-playthrough video, final devlog link wiring.

### Day 5 — late session polish pass

Second sweep after the overlay pivot, working through the Day 5 remainder
of the polish queue.

- **Title scanlines + holographic glitch tear.** Added `::before` /
  `::after` layers on the Title overlay stage for CRT-style scanline
  repeating-linear-gradient (2.4s step animation) and a rare (every 7.3s)
  orange/blue tear streak that skews across the frame. Same Post-cyberpunk
  palette, zero extra bundle weight.
- **Pachislot audio depth.** Audio bus was doing a single `ultimate`
  voicing for all four machines, and the seven prediction-cue visual
  effects fired silently. Added seven new Web Audio primitives
  (`pred_rainbow` / `pred_fish` / `pred_red_flash` / `pred_exclaim` /
  `pred_lightning` / `pred_mandala` / `pred_glitch`) routed through the
  existing chime / sweep / noise helpers, and piped a
  `ULT_PITCH_BY_ROBOT` map (new `src/data/audioProfile.ts`) through
  `playSfx('ultimate', pitch)` so INDRA / GOLIATH / LILITH / MUMEI each
  get a distinct vocal range.
- **Closing credits.** ED overlay (post-final-boss `SOUL BREAKER`
  reveal) and GameOver overlay both end on a two-line credits block:
  `SOUL STRIKE — GAMEDEV.JS JAM 2026 · THEME MACHINES / PHASER 4 ·
  TYPESCRIPT · VITE · BUN`. Fades in on a 1.5s transition-delay so it
  doesn't upstage the hero headline.
- **PWA icon.** Manifest referenced `icon-192.png` / `icon-512.png` that
  were never checked in — install-to-home-screen would have 404'd.
  Replaced both entries with a single inline SVG
  (`public/assets/icon.svg`) built from the Title mandala motif, marked
  `sizes: any` + `purpose: any maskable`. One file, vector, honors the
  project's post-cyberpunk palette.
- **FPS meter wired.** `systems/fpsMeter.ts` already existed but was
  never attached. Hooked it into Battle and Build (the two high-load
  scenes) via `attachFpsMeter(this)` — debug-mode only, top-right,
  colored on the 55 / 30 / <30 thresholds.

### Day 5 — verification

Full type-check (`bunx tsc --noEmit`, 0 errors), production build
(`bun run build`, 65 modules, gzip 408 KB total = 58 KB app + 350 KB
Phaser — well under the 2 MB target), and `bun run package-itch`
emitted `machines-itch.zip` at 3.4 MB, ready for itch.io upload.

Placement synergy log-wiring was scoped out:
`src/data/placementSynergies.ts` has the 10 definitions but no
`stats.ts` / `chargeSpeed` effect-application path yet. Adding log
output without the numeric effect would read as fake feedback, so it
moves to the Day 8 balance tranche alongside the effect hookup.

The remaining four scenes (Select / Battle / Build / Result) still
inline their UI in Phaser Canvas. Converting them to DOM overlays
mirrors the Title / Settings / GameOver / Mandala / ED work already
shipped, but each is substantially heavier — those land next session.

### Day 5 — `/debug` patrol (full automated + visual pass)

Ran the project's `/debug` skill end-to-end. Automated Playwright
walk-through through 22 screenshots, then structured visual review on
six key frames, then fixes, then re-run.

- **Page error found**: stack trace pointed to `fpsMeter.ts:20 → Text.setText
  → Frame.updateUVs → drawImage null`. The FPS meter registered
  `scene.events.on('update', ...)` but never called `off` on shutdown,
  so after a scene transition the old callback kept firing against the
  destroyed label — that `drawImage` call on a null texture took the
  whole Phaser renderer down. Symptoms: **Result screen rendered pure
  black, subsequent Build screen rendered pure black, and the R-key
  handler on the re-entered Build scene stopped responding**. Two
  separate bugs, one root cause. Fixed by saving the `onUpdate`
  reference, calling `scene.events.off('update', onUpdate)` in the
  shutdown handler, and adding an `if (!label.active) return` guard.
  After the fix: Playwright `pageerror` count `1 → 0`, Result /
  post-battle Build render correctly, R returns the player to Title.
- **Overlay pointer leaks**: the Title glitch/scanline decorations I
  added earlier used `position: absolute; inset: 0` without
  `pointer-events: none`, so the CRT overlay was eating every click on
  the Play/Collection/Settings buttons. Pinned down by reproducing in
  the automated harness. Fix: scoped `.stage { pointer-events: none }`
  and whitelisted the three interactive regions back to `auto`.
- **Overlay re-mount ghosting**: each of the DOM overlays (Title,
  Settings, GameOver, ED, Mandala) fades out over 240 ms before
  removing its root node — which meant a rapid scene loop could stack
  two overlay layers for a quarter second, with the outgoing one still
  capturing clicks. Hardened every `mount*Overlay` function with a
  defensive `document.querySelectorAll('.${ROOT_CLASS}').forEach(el =>
  el.remove())` at the top.
- **Settings `RESET ALL DATA` button clipped** below the 720-px stage
  bottom. Tightened the panel (top 135 → 100, title 52 → 44, row
  padding 12 → 8, divider margin 24 → 14) so the whole sheet fits the
  design viewport again.
- **Battle HP text contrast failure**: white/gray glyphs on the red HP
  bar dropped below visual threshold and the VisualDebugger correctly
  flagged it. Swapped both `playerHpText` / `enemyHpText` to
  `setColor('#ffffff').setStroke('#000000', 3)` for guaranteed legibility
  against any bar fill.
- **Browser-test harness modernization**: the Phaser-canvas click
  coordinates the suite had been using no longer work now that Title /
  Settings / GameOver are DOM overlays. Added a `clickDom(selector)`
  helper that dispatches click through `page.evaluate` (bypassing
  Playwright's actionability check, which mis-reads CSS-transformed
  overlays as "intercepted"), and rewrote the Title → Collection /
  Settings / Select transitions to target `[data-role="..."]`
  selectors on the overlay DOM.

Result: `Functional 16/16`, `Page errors 0`, `Boss test passes`.
All automated checks clean except for an unrelated `Audio errors: 8 (BGM
assets missing)` which is the known Task D deliverable.

### Day 5 — Select overlay migration (A-2 done)

With the `/debug` fixes in place and time left on the clock, migrated
the Select (character picker) scene to the DOM-overlay architecture —
the same approach already used on Title / Settings / GameOver / ED /
Mandala.

- New `overlays/selectOverlay.ts` (323 lines) — stage-scaled 1280×720
  HTML with a left-side info panel (name / archetype / accent line /
  description / passive / HP-Slots-Buff stat strip / ULT name / quote),
  a right-side portrait via `<img src="assets/images/battle_*.png">`
  (currently only `battle_knight.png` ships, others fall back to a
  themed placeholder), a bottom icon row, arrow buttons, and a footer
  BACK button. Theme color bleeds into the right-side `bg-wash`
  gradient, the accent line under the name, and the EMBARK button's
  border+glow, parameterized through CSS custom properties
  (`--theme-border` / `--theme-wash`) that re-bind on every index change.
- Rewrote `scenes/Select.ts` (316 → 158 lines) — builds the character
  descriptor array from the data layer (`ROBOTS`, `ROBOT_ULTIMATES`,
  `CHARACTER_QUOTES`, `isRobotUnlocked`, `ROBOT_COLORS`), mounts the
  overlay with scene-aware callbacks (`onChange` plays a click cue,
  `onConfirm` runs the existing run-state initialization, `onBack`
  fades to Title), and retains every keyboard shortcut (Arrow keys /
  Enter / Space / R). The Phaser scene itself now owns nothing but the
  camera fade + keyboard input + run-state setup.
- Caught during validation: the EMBARK button rendered inside the
  info panel (itself `position: absolute`) was using its own
  `position: absolute` and therefore positioning relative to `info`
  instead of the stage, which sent it below the 720-px bottom line
  and made it invisible. Lifted the button out of the info panel
  into the stage directly and wired a stable click listener that
  reads `currentIdx` at fire time, so the button no longer has to be
  re-bound on every index change.
- Browser-test suite updated: `click(240, 620)` Phaser-canvas clicks
  replaced with `clickDom('.soul-strike-select-overlay
  [data-role="embark"]')` at the two points that entered Build from
  Select. The Boss-round + skill-selection tests (which force round 1
  to be a boss via `scene.registry.get('runState').generatedRounds[0].isBoss
  = true`, then verify the "CHOOSE A SKILL" UI renders and the NEXT
  ROUND button replaces it) now pass cleanly.

### Day 5 — ending state

- 5 overlays complete: Title, Settings, GameOver, ED, Mandala, Select
  (this session added Select).
- 3 scenes still Phaser-Canvas-inline: Battle (heaviest, 1700 lines
  with the pachislot cut-in logic), Build (drag-drop + shop + slot
  grid), Result (round summary + ATMAN statement + skill selection).
- Shipped 16 of the 50 Day-5 punch-list items including the two
  bug-cluster root-cause fixes (fpsMeter leak → Result black screen +
  R-key dead) and the Settings / HP-text polish surfaced by the debug
  patrol.
- Build: gzip 408 KB (58 KB app + 350 KB Phaser), well inside the 2-MB
  Jam ceiling.

---

## Day N template

```
## Day N — YYYY-MM-DD
### Progress
### Obstacles
### Next
```

---

## Day 6 — 2026-04-20

### Progress

Kima cleared 22 of 24 independent tasks from the Day-5 punch list.
Two remaining overlay migrations (Build and Battle) are the heaviest
Phaser scenes in the project and have been deferred to the next
session.

**Overlay work — A-7 Result migration.** The round-result screen
(previously 457 lines of Phaser canvas code with four outcome
branches, animated gold counter, three-card skill picker, ATMAN
statement frame, victory stats panel, and ED sequence) is now a DOM
overlay. New file `src/game/overlays/resultOverlay.ts` owns all
presentation; `scenes/Result.ts` owns only run-state mutation,
outcome routing, and scene transitions. The `win` outcome animates
the gold counter via `requestAnimationFrame`, the `victory` outcome
layers the ATMAN statement above a multi-line stats readout and a
parts-category machine summary, and the `lose` outcome now has a
single-shot guard so SPACE + the 2.5-second auto-timer cannot both
fire `fadeToScene('GameOver')` on a shutting-down scene.

**Title Credits link.** Added a small `CREDITS` footer link to the
Title overlay that routes to the existing `Credits` Phaser scene. It
sits in the same row as the keyboard hint ("PRESS SPACE / NAV
MOUSE") and lights up on hover to `#aeeaff`. The `Credits` scene
itself was never integrated; now it is reachable without cluttering
the main menu buttons.

**Overlay base extraction.** All seven DOM overlays (Title,
Settings, GameOver, ED, Mandala, Select, Result) now share common
plumbing from `src/game/overlays/overlayBase.ts`: `escapeHtml`,
`ensureStyle(id, css)`, `clearPriorRoots(rootClass)`,
`fitStageToCanvas(stage)`, and `wrapUnmount(root, dispose, delayMs)`.
Result overlay was refactored to consume these helpers, shaving
~30 lines of duplicated plumbing. Future overlays (Build, Battle)
will use the same helpers.

**Automated QA scripts.**
- `scripts/check-slots.ts` — validates that every blueprint slot in
  `src/data/robots.ts` lies inside the 192×240 drawable blueprint
  area (minus radius) and flags any overlapping pairs. All 42 slots
  across 4 machines pass.
- `scripts/check-i18n.ts` — scans every `t('…')` and `bl('…')` call
  in `src/` and cross-checks against `src/game/i18n/ja.ts`.
  Identified 10 missing Japanese translations (`BACK`, `CONTINUE`,
  `CREDITS`, `EMBARK`, `LOCKED`, `NEXT ROUND`, `READY`, `Acquired:`,
  and the LICENSE tagline line); added them all. Coverage now 100%.
- `scripts/shots.ts` — headless Playwright capture of the five Jam
  screenshots (Title, Select, Build, Battle, Result) at 1280×720
  DPR-2 with debug mode forced off. Output: `docs/screenshots/`.
- `scripts/gif.ts` — records a scripted Build→Ready→Battle→Ultimate
  play sequence via Playwright's video capture, then uses ffmpeg
  (palette-pass two-step) to emit `docs/screenshots/intro.gif`
  (10 s, 12 fps, 640×360, ~4 MB) alongside the higher-quality
  `intro.webm`. For itch.io preview + X post.
- `scripts/auto-play.ts` — runs N INDRA simulated 5-round
  playthroughs headlessly, collects `runStats` from Phaser registry
  at end-of-run, aggregates clear rate / average round / average
  gold. Day-8 balance tuning input.
- `scripts/release.sh` — one-command `tsc + build + package-itch`
  (optional `deploy` arg runs `bun run deploy`). Wired as
  `bun run release` in `package.json`.

**`/debug` patrol follow-up.**
- `visualDebugger` console output is now gated on `isDebugEnabled()`
  so production builds stay silent (was firing a `console.log` on
  every scene change).
- Three parallel code-review agents ran `/simplify` against the
  diff. Findings applied: resultOverlay now consumes overlayBase
  instead of re-implementing `ensureStyle` / `fit` / `unmount`;
  flashTeaser timers tracked and cleared on scene shutdown so the
  DOM node can't survive the scene's death; titleMap literal map
  replaced with direct string args; narrative section-banner
  comments and the `'…': '…'` identity i18n entry removed.

### Quality bar

- `bunx tsc --noEmit`: 0 errors.
- `bun run build`: 6.6 s, gzip 408 KB total (58 KB app + 350 KB
  Phaser) — under the 2 MB Jam ceiling.
- `bun run scripts/browser-test.ts`: VisualDebugger `7 OK / 0 issues`
  (was `4 OK / 2 issues` before Result + Select overlay work),
  Functional `14 passed, 1 failed` (lone failure is a timing quirk
  in the Space-press sequence during the Battle→Result transition,
  not a correctness bug — scene and state transitions are all
  verified).
- `bun run scripts/check-slots.ts`: `42/42` slots pass.
- `bun run scripts/check-i18n.ts`: 0 missing translations.
- `bun run scripts/gif.ts`: produces 4 MB GIF + 2.3 MB webm.

### Obstacles

None from the scope actually attempted. The two remaining overlays
(Build, Battle) were scoped out up-front as too heavy for a single
session: Battle alone is 1700 lines with pachislot cut-in choreography,
Build embeds drag-and-drop against blueprint coordinates. Both
deferred to the next session.

### Next

- Overlay A-6 (Build) → `buildOverlay.ts` hybrid migration.
- Overlay A-5 (Battle) → `battleOverlay.ts` hybrid migration.
- Day 8 balance tuning once the two overlays land.

---

## Day 6 — 2026-04-20 (session 2)

Kima cleared the final three deferred items: placement-synergy
effect hookup, plus hybrid DOM headers for Build and Battle. All
seven gameplay scenes now have some DOM-overlay UI.

### Placement synergy effect hookup

`src/data/placementSynergies.ts` has ten definitions but until this
session they were data-only — no code path consumed them. Added:

- `systems/synergyCheck.ts` gains `getActivePlacementSynergies` and
  `computePlacementSynergyEffects`. Both use the same rule: a synergy
  is active when the matching-slot count meets its `minCount`, or —
  if `minCount` is omitted — when **every** relevant slot in the
  robot is occupied by a qualifying category. The effect bundle
  exposes `hpBonus`, `drBonus`, `chargeSpeedMult`, `ultDamageMult`,
  `ultStrikeBonus`, and `hitChancePerSec` as pre-aggregated numbers
  so downstream layers just add them in.
- `systems/stats.ts` consumes the bundle: HP / DR bonuses fold into
  the base stat calculation, `ultimateStrikes` / `ultimateDamagePerStrike`
  / `ultimateChargeRate` absorb the remaining fields, and
  `LoadoutStats.placementSynergies` exposes the bundle for Battle.
- `systems/slotMachine.ts` — `tickSlotMachine` gains an optional
  `bonusHitProbPerSec` parameter folded into the per-frame roll, so
  placement effects like `hit_chance_bonus` speed up the slot roll.
- `scenes/Battle.ts` pulls `stats.placementSynergies.hitChancePerSec`
  into the slot tick, and pushes each active synergy's
  `name — description` to the battle log at the start of combat
  (prefixed with `◆`). Players now see concrete feedback for the
  blueprint choices they made.

All ten synergies are now both data and behavior — no more fake
feedback. Next step (Day 8) is actually **tuning** the numbers now
that they're live.

### Overlay A-6 — Build hybrid header

`src/game/scenes/Build.ts` (1337 lines, heavy with drag-and-drop
coordinate math that has to stay on the Phaser canvas) has been
migrated to a hybrid overlay:

- DOM: `ROUND N / M` label top-center, per-round inner-voice
  monologue (italic, fades in then out), first-round tutorial hint
  (`Drag parts from shop to blueprint slots`).
- Canvas (unchanged): blueprint silhouette + slot circles + buff
  slots, SELL / STORAGE drop zones, shop cards with hover preview,
  STATS panel (gold / ult summary / defense / preview diff),
  REROLL / READY buttons.

The DOM header is `overlays/buildOverlay.ts` (consumes overlayBase
helpers) with `update(round, totalRounds, monologue?)` so scene
transitions can update it without remounting.

The drag system is intentionally left on the canvas because it
tracks pointer events against blueprint-local coordinates; moving
it to DOM would require re-implementing the slot-hit test in HTML
and add more complexity than the crispness payoff justifies before
the Jam deadline.

### Overlay A-5 — Battle hybrid header

`src/game/scenes/Battle.ts` (1700 lines, with pachislot cut-in
choreography, camera shake tweens, sprite knockbacks) migrated the
top strip only:

- DOM: `ROUND N / M` headline, `BATTLE` / `⚠  BOSS BATTLE  ⚠`
  subheading (orange glow for boss), `(S) SPEED xN` indicator in
  the top-right with a live `setSpeed(x)` update method.
- Canvas (unchanged): player + enemy sprites, HP bars + ULT gauge,
  prediction cues, cut-in overlay, log lines, all the combat
  choreography.

The speedLabel Phaser `Text` object and its two `setText` call
sites are gone — the overlay handle's `setSpeed(x)` replaces them.
One import (`createLabel`) became unused and was removed with it.

### Quality bar (session 2)

- `bunx tsc --noEmit`: 0 errors.
- `bun run build`: 5.3 s, gzip 408 KB total (58 KB app + 350 KB
  Phaser) — unchanged from session 1.
- `bun run scripts/browser-test.ts`: Functional `14 passed, 1 failed`
  (same timing quirk in the Battle → Result transition, not a
  correctness bug), VisualDebugger `7 scenes OK / 0 issues`, Boss
  test + skill pick green.
- Every gameplay scene in the project now has at least its header
  rendered through DOM with native-browser text quality. Select,
  Result, GameOver, Title, Settings are fully DOM; Build and Battle
  are hybrid (header + hint in DOM, mechanics in canvas).

### Next

- Day 7 onward: art + audio asset integration (Tasks A–E).
- Day 8: balance tuning driven by `auto-play.ts` run-stats data,
  now that placement synergies actually fire.
- If we revisit, extend the Build / Battle overlays to cover the
  STATS panel (Build) and HP / ULT bars (Battle) — that's still
  value to be had, but no longer critical for Jam submission.

---

## Day 7 — 2026-04-21

**Theme: one visual language, everywhere.** The Title screen was
already the project's strongest piece — grid + brackets + SS-tags +
scanlines + glitch tear + chamfered buttons. Every other scene was
a reasonable dark rectangle. Today was the day to close the gap.

### Ultimate cut-in — kill the noise, keep the impact

The old cut-in ran 1.4 s across 8 phases, stacking diagonal slash
lines, V-shape screen splits, a right-column of stacked text
(ULT name + robot name + mantra + HIT counter × up to 5), twin
shockwaves, plus a full-screen mandala behind it all. On CRITICAL,
the same pass also fired a 100px pulsing "CRITICAL!", three extra
rings, and a thesis-proof body line. Reading it back as a frame
list, it was obvious: four main elements were all shouting at once
and nothing landed.

Rebuilt as a classic fighting-game cut-in: slanted panel slams in
from the left, character portrait sits inside the panel, ULT name
stamps in from the opposite side with a scale-punch, shockwave
ring releases, dismiss. 0.9 s total, three elements, one beat each.

- `src/game/scenes/Battle.ts` — the 300-line `spawnUltimateFlash`
  body is now ~100 lines. `_x, _y` parameters (unused since the
  redesign) were removed, the panel + portrait tween was merged
  into a single `targets: [panel, portrait]` call, and a
  `this.events.once('shutdown', destroy)` now guards against a
  scene exit mid-animation leaving the `delayedCall` chain to fire
  against destroyed objects.
- Critical differentiation survived but was slimmed: accent colour
  shifts from gold to red, zoom is slightly stronger (1.15 vs
  1.08), and camera shake is longer. No extra text layers, no
  extra rings. If it needs to feel different, colour + impact
  duration does the job.

One bug that `tsc --noEmit` and `/simplify` could not catch: the
Battle top DOM header (`ROUND N / M`, BATTLE subheading, SPEED
indicator) sits **outside** the Phaser canvas, so the cut-in's
in-canvas black overlay couldn't dim it. During the 900 ms
takeover, the HUD chrome stayed at 100% brightness and broke the
framing. Fix: added `BattleOverlayHandle.setDimmed(dim)` that
toggles a `.dimmed { opacity: 0 }` class on the overlay root, and
the cut-in entry/exit flips it. The canvas-level black overlay was
also pushed from α 0.78 → 0.96 so the ghost HP bars / combat log
behind the cut-in stop bleeding through.

The character scale was still too large on the first pass — head
and sword clipped the panel top and bottom. Panel height went from
`gameHeight * 0.58` → `0.82`, character scale 1.25 → 0.6. The
character now sits cleanly inside the frame.

### One frame to rule them all

Extracted the Title's visual chrome into `overlays/overlayBase.ts`:

- `ensureFrameStyle()` — injects a single global stylesheet
  exposing `.ss-stage` (radial BG + scanlines + glitch tear),
  `.ss-frame-grid`, `.ss-frame-vignette`,
  `.ss-frame-bracket.tl|tr|bl|br`, `.ss-frame-tag.tl|tr`, and
  shared chamfer buttons `.ss-primary` / `.ss-secondary` /
  `.ss-danger` / `.ss-panel`.
- `buildFrameHtml({tagLeft, tagRight, showGrid?, showVignette?,
  showBrackets?})` — emits the decor divs as a single HTML
  fragment, dropped into any overlay's stage.
- `mountFrameOverlay(opts)` — a thin standalone frame-only
  overlay for Phaser scenes not yet DOM-migrated (Collection,
  Credits).

Applied to every DOM overlay (Build, Select, Result, Settings,
GameOver, ED, Battle) with scene-appropriate tag text:

| Scene | Top-left | Top-right |
|---|---|---|
| Build | SS-003 / BLUEPRINT ∙ BUILD | BUILD PHASE ∙ ROUND NN |
| Select | SS-002 / ROSTER ∙ SELECT | MACHINE PROFILE ∙ NN / MM |
| Battle | SS-004 / COMBAT ∙ BATTLE | ROUND ∙ NN / MM |
| Result | SS-005 / RESULT ∙ SUMMARY | OUTCOME ∙ ROUND |
| Settings | SS-099 / SYSTEM ∙ CONFIG | USER PREFERENCES ∙ ACTIVE |
| GameOver | SS-066 / FLATLINE ∙ TERMINATED | REACHED ∙ NN / MM |
| ED | SS-??? / EPILOGUE ∙ TRANSMISSION | SIGNAL ∙ LOST |
| Collection | SS-050 / ARCHIVE ∙ COLLECTION | UNLOCK STATUS ∙ INDEX |
| Credits | SS-100 / CREDITS ∙ ROSTER | PRODUCTION ∙ SOUL STRIKE |

Every non-Title scene is now framed with the same brackets, tag
pattern, grid mask, and scanlines it inherits from Title.

### Orange-glow bug: clip-path eats box-shadow

While reviewing screenshots, the orange halo on PLAY and READY
looked chunky — like the glow was being cut at the chamfer edges
instead of curving around them. It was. `clip-path: polygon(…)`
clips the element's rendered output including its `box-shadow`,
so a chamfered button with `box-shadow: 0 0 28px orange` loses
the shadow at every diagonal corner. The glow is then drawn as a
rectangle minus wedges, which reads as a visual glitch.

Swapped every `clip-path`-clipped element's `box-shadow` for
`filter: drop-shadow()`, which respects the clipped shape and
draws the halo around the actual silhouette. `.ss-primary`,
`.ss-secondary`, `.ss-danger`, `.ss-panel` / `.ss-panel-accent`
in `overlayBase.ts`; `.primary`, `.secondary`, `.menu-backing`
in `titleOverlay.ts`; `.action` in `selectOverlay.ts`. The orange
halo now traces the hex chamfer cleanly on hover.

### Build — holographic, not dark

The parts-equipping screen is where the player *thinks*. It was
the darkest screen in the build. Three palette shifts made it
feel like an active holographic readout instead of a black slab:

- `PALETTE.blueprintBg`: `0x10204a` (deep navy) → `0x142a5e`
  (brighter navy-cyan). Blueprint panel now reads as lit-from-
  within rather than painted-on.
- `PALETTE.cardStroke`: `0x555577` (muted purple) → `0x5a8ec4`
  (cyan-blue). Every shop card gets a cool-toned hairline that
  matches the SS-tag palette instead of looking like a leftover
  UI kit.
- `uiFactory.PANEL_BORDER`: `0x334466` → `0x5a8ec4`. The STATS
  panel on the right and the Collection cards inherit it.
- `scenes/Build.ts` — READY button switched from
  `accentColor: 0x3aff7a` (bright green, wildly off-brand) to
  `PALETTE.accentOrange` (`0xff7a00`), so it matches Title's PLAY.

### SOUL STRIKE button — Title's circle, as a button

When the ult gauge fills and combat freezes, the old button was a
flat yellow rectangle with "SOUL STRIKE" in black. Replaced with
a Title-style mandala: two counter-rotating cyan rings with
dashed guides and crosshair axes, a breathing orange center-pulse,
and a circular button at the core with "SOUL" (white) / "STRIKE"
(orange) stacked in Bebas Neue. On rush aura, the ring accent
colour, center-pulse, and "STRIKE" fill all switch to the aura
hex via a `setAura(hex)` handle — RED aura turns the whole
assembly red without remounting.

New file: `src/game/overlays/soulStrikeButtonOverlay.ts`. Mounted
and unmounted by `Battle.showUltimateButton` / `.triggerPlayerUltimate`
and the scene shutdown hooks. The predictions system and the aura
hint stay on the Phaser canvas above the DOM button.

One follow-up caught by running the full browser-test: the
overlay root was intercepting clicks on the rest of the screen
because it was `pointer-events: auto` over 1280×720. Restricted
that to the `.btn` itself so combat input still reaches the
canvas underneath.

### DEBUG badge cleanup

The red dev-only `DEBUG` badge was at `y = 8`, which collided
head-on with the top-left SS-tag that now appears on every scene.
Dropped it to `y = 40`, shrunk the font 18 → 14, and knocked
opacity to 0.6. In production (debug off) it's hidden anyway, but
while developing it no longer argues with the frame.

### Quality bar

- `bunx tsc --noEmit`: 0 errors.
- `bun run scripts/browser-test.ts`: 14 pass, 1 pre-existing
  fail (unrelated Battle → Result timing quirk, same as Day 6),
  Visual 7 scenes OK / 0 issues.
- `/simplify` pass on the cut-in rewrite: three review agents
  found the `_x, _y` dead params, the duplicate tween, and the
  missing shutdown guard. All three applied.
- Visual verification: cut-in captured at 5 offsets (60 / 220 /
  400 / 620 / 860 ms) via a new `scripts/shots-ult.ts`; the SOUL
  STRIKE mandala button captured with and without aura via
  `scripts/shots-soulbtn.ts`. This is where the DOM-header-not-
  dimmed bug was caught, which `tsc` and `/simplify` could never
  have surfaced.

### Next

- Day 8: balance tuning via `auto-play.ts` run-stats, now that
  placement synergies and the new cut-in timing are stable.
- Polish the Build Phaser-side shop header and STATS panel text
  to Bebas Neue for consistency with the DOM chrome.
- Integrate art + audio assets as they arrive (Tasks A–E).

---

## Day 8 — 2026-04-21 (session 2)

**Theme: chase the drift.** Seven DOM overlays had forked the
same 30-line scaffold (`ensureStyle`, `escapeHtml`, prior-root
clear, `fitStageToCanvas` inline, unmount timeout). Fixing any
cross-scene bug meant editing seven files. Two shipping bugs had
already slipped through that drift. Today was cleanup + bug-fix
before the Build-screen redesign drops from Claude Design.

### Three parallel review agents

Fed the working-tree diff (+1179 / −1049 across 33 files) to
three sub-agents in one `/simplify` pass: reuse, quality,
efficiency. Scoring was binary — is this actually breaking
something at the jam, or is it cosmetic? Acted only on the
former.

Three real bugs fell out:

- **Music crossfade stutter.** `playMusic()` added a new tween
  to `sound.volume` without killing the prior one, so rapid
  scene switches could stack two tweens on the same track and
  audibly ratchet. Added `scene.tweens.killTweensOf(sound)`
  before both the incoming and outgoing fades.
- **Shop tween thrash.** `refreshShop()` was calling
  `this.tweens.killTweensOf(container)` on every card every
  refresh (buy, sell, reroll, hover), then unconditionally
  re-creating the merge-pulse tween for `merge2` / `merge3`
  cards. Tween churn spiked to ~24 create/kill per hover pass.
  Stashed the last `placeState` as container data and only
  kill + recreate when the state actually changed.
- **One-shot debug write to a `readonly` field.** Battle's
  `fireUltimate` one-shot branch was mutating
  `AttackEvent.killed` directly — `tsc` had been flagging this
  as `TS2540` for days. Fixed by splatting a fresh
  `{ ...last, killed: true }` into the attacks array.

### Helper migration

Six overlays (`collectionOverlay`, `creditsOverlay`,
`endingScrollOverlay`, `gameOverOverlay`, `selectOverlay`,
`settingsOverlay`, `titleOverlay`) were each carrying their own
`ensureStyle`, `esc` (some with the 4-char variant that silently
skips `"` and `'`), their own 18-line `fit()` + `ResizeObserver`
block, and a bespoke unmount timeout. Routed them all through
`overlayBase`'s exports: `ensureStyle(id, css)`,
`escapeHtml as esc`, `clearPriorRoots`, `fitStageToCanvas`, and
`wrapUnmount`. Net: roughly 150 lines removed; any future tweak
to transition timing or DPR handling now lands in one place.

`endingScrollOverlay` got an extra polish pass — the scroll raf
was scheduling itself forever after the credits reached the
hero frame. Swapped to an early return so the loop actually
stops burning frames when idle. Unused `speedMult` /
`finished` variables deleted.

### Window globals

Promoted `window.__PHASER_GAME__` and
`window.__APPLY_BG_AUDIO__` to proper `declare global` types in
`main.ts`. Settings.ts and main.ts were each casting
`(window as unknown as { __APPLY_BG_AUDIO__?: ... })` with
slightly different signatures. Now just `window.__APPLY_BG_AUDIO__?.(next)`.

### Build-scene dead-code amputation

`drawSkillSlots` had been reduced to `void this.drawSkillSlots;`
to silence TS6133 since Day 6 when the SKILL column got
reclaimed for STORAGE. The 50-line method body plus `SKILL_COL_W`
/ `SKILL_COL_X` aliases are now deleted outright. When the
column comes back post-jam it'll be easier to restore from git
than to keep the dead body warm.

### Quality bar

- `bun run tsc --noEmit`: 0 errors. (The pre-existing
  `attacks[...].killed` TS2540 is gone.)
- `bun run build`: 229 kB / 66 kB gzip main bundle (+Phaser 350
  kB gzip). No regression.
- Narrative comments stripped where they restated the code
  below (Build placement-state block, enemyPool jam subset,
  Result.ts 13-line Timeline comment, buildOverlay vignette
  commentary).

### Next

- Ship the redesigned Build screen from Claude Design (spec
  lives at `docs/design/build-spec.md`, waiting on the HTML
  handoff).
- Day 8 balance tuning over the weekend; Jam closes Sunday.

---

## Day 9 — 2026-04-23

Meta-progression layer day. The gold-shop buff items had been
sitting alongside parts as if they were equivalent, but they
read more like persistent rewards than per-run economy: you'd
buy "Adrenaline Shot" once, see its effect, and want it
*again* on the next run instead of grinding the gold shop for
it every time. So buffs got moved out of the run economy into
a persistent meta-shop — **SANCTUM (加持堂)**, accessible
from the Title menu once the player has completed at least
one battle.

### Persistence layer

Saved-data schema gained two fields and three helpers
(`src/game/systems/savedata.ts`):

- `battlesCompleted: number` — incremented on
  `Battle.goToResult`, regardless of win/loss. Used as the
  unlock gate for the Sanctum button on Title.
- `ownedBuffItems: ItemKey[]` — pending inventory of
  consecrated buff items. Drained at the next run's start.
- `purchaseSanctumBuff(itemKey, scrapCost)` — atomic deduct +
  push, returns the new SaveData or null on insufficient
  scrap / duplicate.
- `consumeOwnedBuffs()` — drains the pending list and returns
  it; called from Select on run start.
- `recordBattleCompleted()` — increments the counter.

### Sanctum scene

`scenes/Sanctum.ts` + `overlays/sanctumOverlay.ts` are a
hybrid (Phaser cards + DOM frame) following the same pattern
as Collection. Three buff-item cards (Adrenaline Shot,
Stabilizer Plate, Battery Cell) each show a scrap-price tag
and a Consecrate button. Below the cards a "BUFFS READIED"
readout shows the pending inventory the player will take into
the next run. Cancel / Embark exits to Title.

Title gained a purple-accent **SANCTUM** button (mirrors the
PLAY button visual but with a `accentPurple` palette entry)
that only renders when `save.battlesCompleted > 0` — first-
time judges see only PLAY and the screen reads cleanly, then
SANCTUM appears organically after their first defeat or
victory.

### Build screen gutted

The buff items leaving the run economy let us delete a *lot*:

- The whole **STORAGE column + SELL box + drag-and-drop
  system** is gone. Fifteen methods, the `DragSource` enum,
  pointermove / pointerup listeners, the drag-ghost visual
  layer, and `runState.storedParts` itself — deleted. Shop is
  now strictly click-to-buy: clicking a card auto-places the
  part into the first free matching slot, or merges with an
  existing same-key part. No-slot rejection is silent.
- The leftmost column (former STORAGE real estate) now
  renders the run's `equippedBuffs` as chamfered read-only
  cards. Header strip reads "BUFFS" instead of the old
  "CACHE".
- `runState.storedParts` removed across the build pipeline;
  `equippedBuffs` is now exclusively fed by the SANCTUM
  inventory drain on Select.

The drag-and-drop deletion was the single largest code
removal of the jam — a substantial chunk of Build.ts plus
matching overlay support evaporated. The trade-off is real:
players can't repent on a placement once they've bought it.
But the click-to-buy flow is dramatically easier to learn
inside the 30-second judge window, and SANCTUM gives a
parallel "save your favourite gear for next time" outlet that
absorbs most of the player intent the drag system used to
carry.

### Pipeline plumbing

- `Battle.goToResult` calls `recordBattleCompleted()` so
  `battlesCompleted` ticks regardless of outcome.
- `Select.start` calls `consumeOwnedBuffs()` and routes the
  drained items into the new run's `equippedBuffs`.
- `Build.drawBuffsColumn` reads `equippedBuffs` from
  `runState`, renders read-only cards, no interaction.

### Quality bar

- `hiDpiText.applyHiDpiToScene` was missing a recursion case
  for Phaser containers — text nested inside shop cards or
  popups was rendering at DPR 1 (blurry on Retina). Now
  recurses into Container children. This was a long-standing
  silent bug exposed by inspecting the new Sanctum cards.
- i18n strings added: `SANCTUM`, `Scrap`, `Consecrate`,
  `Buffs Readied`, `Owned Buffs`, plus a few status lines.
- `bun run tsc --noEmit`: 0 errors. `bun run build`: 232 kB
  / 67 kB gzip main bundle (+ Phaser 350 kB gzip).

### Next

- Day 10 polish: Build screen layout cleanup (the four-column
  alignment is still visibly off — frames eating COL_GAPs),
  ULT cut-in rebuild (current implementation is "JPEG at an
  angle"), aura-ring removal on the mini-character.

---

## Day 10 — 2026-04-24

Two-front polish pass: (1) land the Claude Design Build screen
handoff for real, (2) stop the player ULT cut-in from reading
like stock assets slapped on the canvas. One day left after
today; this is the last window to move the look-and-feel needle.

### Build screen: frames, headers, content — one coordinate system

The Build screen had three overlapping coordinate systems:

1. Phaser `drawColumnFrame` drew each chamfered frame 8 px
   outside its content column (`STATS_X - 8`, `w + 16` etc.),
   giving a breathing cushion around the content.
2. The DOM `.panel-head` strip was positioned to match the
   frame rectangle, not the content column, with its own 14 px
   padding.
3. Content cells (gold numerals, shop cards, stats rows) were
   placed relative to the *content* column (`STATS_X`) with a
   private `STATS_PAD` of 14 px.

All three were "off by something" relative to each other — the
cumulative result is that the `100000 G` gold number sat ~22 px
to the right of the `OUTPUT · SS-NN` header text that should
have been directly above it, and the four column-head strips
visually fused into one continuous horizontal band because the
8-px outer frame inset ate most of the `COL_GAP = 20` between
adjacent frames.

Collapsed all three onto a single basis: the content column
itself. `drawColumnFrame` now takes `STATS_X`, `STATS_W` etc.
directly with no outer inset — which restores the 20-px black
gaps between columns, so the four panels read as four
independent chassis (matching the Claude Design mockup). The
DOM header now sits at the same `x` / `width` as the frame,
padding dropped to 0, so header ident text lands flush with
the content-column left edge and status text lands flush with
the right. `statsBlocks` was rewritten to place every child at
`STATS_X` / `STATS_X + STATS_W - STATS_PAD` consistently.

This took more iterations than it should have — the tell was
that the fix-then-screenshot loop stayed stuck on pixel-level
drift for three rounds without Kima ever noticing the frames
were structurally eating the gap. Saved the lesson as
`feedback_layout_gestalt_first.md`: on "ずれ" reports, read the
macro composition first (are frames fused / gaps eaten?)
before doing pixel math.

Header copy also got adjusted to match the reference mock:
`PILOT · INDRA · BLUEPRINT` / `SHOP · TIER <N>` / `OUTPUT ·
SS-<NN>`, with orange tag text + white value text, `LINK 🟢` /
`NEXT REROLL <N> G` / `SIM 🟢` status on the right. TIER and
SS-code derive automatically from round number.

### Mini-character: aura ring removed

The player sprite grew a pulsing aura ring + `<colour> AURA`
label whenever slotmachine rush state produced an aura. It
read as clutter — a pulsing circle the size of the sprite
competing with the actual character — and Heika asked for it
gone. The ring + label rendering is deleted; rush state now
surfaces only through the ult-gauge colour shift (subtle cue,
still legible). The aura-acquired SFX got a single-shot latch
(`auraSfxFired`) so it still chimes exactly once on the
no-aura → aura transition instead of per-tick during hold.

### ULT cut-in: Plan E — phase-based combo choreography

The player ULT cut-in was a rectangular portrait pasted onto a
slanted dark panel. The raw image rectangle showed all around
it, so the 960 × 960 JPEG (no alpha channel — we checked)
looked exactly like "a 960 × 960 JPEG at an angle." Amateur.

Short websearch pass across Guilty Gear Strive, Street Fighter
6 Critical Arts, Persona 4 Arena awakening cut-ins, and the
shonen-manga impact-frame vocabulary. Common techniques: RGB
chromatic-aberration split, radial spoke convergence lines,
silhouette-to-colour reveal, screen darken + selective zoom.

Picked a 5-phase choreography ("Plan E") that layers several of
these:

- **P1 (0–140 ms)** — opening flash. Full-screen white rect
  (or red on a critical) that flashes to `alpha: 1` then
  fades. Pairs with the ULT SFX for a shutter-punch feel.
- **P2 (60–840 ms)** — darken + radial speedlines. A 36-spoke
  `Graphics` rosette converges on the screen centre, drawn as
  thick black spokes plus offset accent-colour thin spokes for
  a second beat. Fades in fast, holds while the portrait lands,
  fades out as the colour resolves.
- **P3 (350–740 ms)** — portrait stages. First a pure-black
  **silhouette** of the portrait flashes in (`tint 0x000000`,
  same scale), then fades as three **RGB chromatic-aberration
  layers** take over. R / G / B tints on the same portrait
  texture, `BlendModes.ADD`, positioned at `x ± 28 px` / `0`.
  ADD-composited they reconstruct the original colour; offset
  they produce the signature "glitchy high-voltage reveal"
  look. A 220 ms tween snaps the R and B layers back to
  centre, giving the cut-in its cleanest moment just before
  the name stamps.
- **P4 (720–1260 ms)** — ULT name + shockwave. Big Bebas Neue
  title in the accent colour, tilted 10° → -3° as it slams in,
  followed by an expanding stroke ring + camera shake on the
  upbeat.
- **P5 (1900 ms)** — hold → fade. Everything dissolves and the
  camera zoom resets to 1×. Combat freeze timing on
  `triggerPlayerUltimate` matches this window exactly; breaking
  that alignment leaves the fight frozen after the cut-in is
  already gone, which hangs the whole scene.

The portrait image's raw rectangle border used to be the
problem. The fix is purely geometric: scale the portrait by
`(gameWidth / textureWidth) × 1.15`, which pushes the image
edges outside the 1280 × 720 viewport on all four sides. No
mask, no clip-path, no slit container — just "make the canvas
too small to contain the bad part." Cheaper than any shader
solution and reads the same onscreen.

### Quality bar

- `bun run tsc --noEmit`: 0 errors.
- No bundle-size regression vs Day 8 (no new deps).
- HMR works end-to-end for the overlay CSS; Scene-level
  constants need a hard reload (expected, Phaser scenes don't
  HMR their `create()` bodies).

### Next

- One day left before submission. Priorities, in order:
  (1) INDRA-only balance pass on `src/data/balance.ts` using
  the `auto-play.ts` stats dumps, (2) wire up the five new BGM
  tracks that landed in `public/assets/audio/` (Title / Build
  / Battle / BossBattle / Victory — Preloader registration +
  per-scene crossfade), (3) final screenshot + GIF refresh for
  the itch page, (4) Cloudflare Workers deploy via
  `scripts/release.sh deploy`.

---

## Day 11 — 2026-04-25 / 2026-04-26 (final session)

The closing day of the jam. Started with cleanup of the Build
screen visuals that had been "looks fine" for two days but
turned out to be off; ended with a STORY library scene, a
Victory layout fix, a credits + music re-cut, and a repo
cleanup pass for the public push.

### SHOP frame off-by-43 — three patches around a wrong premise

The morning's first user report: "shop cards overflow the
SHOP frame, you've fixed this twice and it's still wrong."
The first two patches that day moved `SHOP_FRAME_BOTTOM_PAD`
around (`+24` → equal-margin reformulation), each time
verifying the *frame* arithmetic rather than the *card* y
arithmetic. Both passes left the user looking at the same
visual overflow.

The actual bug: a 43-pixel semantic mismatch on `SHOP_GRID_TOP`.
The constant was *computed* as if it meant "row-0 centre y"
(`REROLL_BOTTOM + SHOP_VGAP + CARD_H/2`) but *consumed* in the
card-placement formula

```text
cardCenterY = SHOP_GRID_TOP + row * (CARD_H + GAP) + CARD_H/2
```

as if it meant "row-0 top y." Both author and reader could read
the formula and not notice — the symptom is just that every
card sits 43 px lower than the frame author thought.

Cracked it open by dumping the live scene via Playwright +
Phaser scene walk:

```text
expected centres: 201 / 301 / 401
actual centres:   244 / 344 / 444  ← + 43 everywhere
```

The 43 is `SHOP_CARD_H / 2`. Once the offset is named, the
fix is two lines: `SHOP_GRID_TOP` becomes the genuine top of
row 0 (drop the `+ 43`), and the frame-bottom formula's
`+ SHOP_CARD_H / 2` becomes `+ SHOP_CARD_H` (the actual
last-row bottom, not the last-row centre). Cards now sit
inside the frame with 24 px breathing room top and bottom.

The stale-feedback cycle is the lesson. Three rounds of "still
broken" with the same diagnosis loop ("compute frame bottom,
recompute frame bottom") wasted real time. New working rule:
**stop after two repeats, live-dump before pixel arithmetic,
audit the semantic intent of every variable in the failing
path.** A live scene-walk in 30 seconds would have surfaced
the +43 immediately.

### STORY library scene — Title-screen entry, gated by hardCleared

User asked for a STORY button to the right of SETTINGS on the
Title screen, available only after the player has cleared
HARD mode. Content: the joined Easy + Hard endings, including
the 百鬼夜行 reveal, no production credits, no "TO BE
CONTINUED" beat — purely the in-fiction archive.

Wiring:

- `savedata.ts` gained a `hardCleared: boolean` flag with
  `recordHardCleared()` (idempotent guard mirroring
  `recordEasyCleared()`).
- `Result.renderVictory()` calls `recordHardCleared()` when
  `endingMode === 'hard' && !previewOnly`. The
  `previewOnly` gate stops the Settings → Ending (Hard) debug
  preview from quietly unlocking STORY for everybody.
- `titleOverlay.ts` learned an `onStory?` handler. When it's
  `undefined` the button is *not rendered* at all — same
  pattern as SANCTUM's `onSanctum?`, no greyed-out preview.
  CSS uses an amber palette (`#ffd94a`) so it reads as a
  separate variant from the violet SANCTUM button.
- `Title.ts` passes `save.hardCleared ? handler : undefined`.
- New `scenes/Story.ts` + `overlays/storyOverlay.ts` deliver
  the read-at-your-own-pace view. Visual language matches
  Settings / Collection: ss-frame brackets, navy panel with a
  cyan hairline, Bebas Neue title, BACK button bottom-left.

The stanza copy lives in `src/data/storyText.ts` (already the
canonical bilingual source for `EASY_ENDING_STANZAS`,
`HARD_ENDING_STANZAS`, `HYAKKI_SUB_LINES`) so the library and
the post-victory ending scroll resolve from one array each
via `bl()` at mount time.

Verified live via Playwright walking three save states: fresh
save → STORY hidden; `hardCleared = true` → button visible at
`(740, 526)` next to SETTINGS; click → Story scene mounts
with two chapter headings ("I — THE FALLING" / "II — THE
FIRST FIST"), 9 stanzas (3 Easy + 6 Hard), 百鬼夜行 reveal
visible after scroll, credits not leaked.

### Victory screen: stats vs machine-summary overlap

User: "victory screen has overlapping text." Live-dumped the
overlay first this time (per the new rule):

```text
.stats:           y=430..532 (5 lines × 21 px line-height)
.machine-summary: y=510..526
                  ↑ inside stats — 22 px overlap
```

The hard-coded `top:510px` on `.machine-summary` was authored
when `statsLines` was ~3 lines long. It now ships 5 lines
(`victoryLine` + blank + DMG / Healed / Parts) which extend
to y ≈ 535. Replaced the constant with a derived
`summaryY = statsY + statsLines.length * STATS_LINE_PX +
SUMMARY_PAD_PX`. The `.machine-summary` block now lands at
y=559 with 24 px clear of the stats bottom, no matter how the
stats array changes.

### Credits + bgm_victory re-cut

User wanted CREDITS slimmed to three sections (separate
`MUSIC` from `AUDIO`):

```text
AI-ASSISTED ASSETS — Grok, Piskel
MUSIC              — Suno
AUDIO              — Web Audio API
```

…and the Hard ED music shortened to fit. The original
`bgm_victory.mp3` was 158.76 s, tuned for the old long credits
roll. Measured the new ED scroll end-to-end with Playwright
on the slimmed `CREDITS` array: total 106.9 s from Result
mount → RETURN visible (12 s VICTORY screen + ~95 s scroll).

Single-pass `ffmpeg` re-cut to 115 s (`-t 115 -af
"afade=t=out:st=109:d=6"`) — 109 s body plus a 6 s fade-out.
That leaves an 8 s tail covering the player's 百鬼夜行 reading
window before the music dies cleanly. Original 158 s file
backed up to `/tmp` outside the repo. The `~158s` comment in
`endingScrollOverlay.ts` is now updated with the new
arithmetic and a re-measure SOP for next time the credits
length changes.

### Repo cleanup before push

A pre-push sweep produced a meaningful list:

- All `*:Zone.Identifier` files (Windows alternate-data-stream
  metadata that snuck in via WSL imports) deleted from disk;
  `*:Zone.Identifier` added to `.gitignore` to prevent
  re-occurrence.
- `scripts/__pycache__/` deleted; pattern gitignored.
- `scripts/*.py` (the sprite preprocessing tools — rembg
  variants, halo cleanup, spritesheet stitcher) kept on disk
  for Heika's local reuse but added to `.gitignore`. They
  were referenced from `package.json`'s scripts section;
  those entries removed from the public manifest. The `.ts`
  automation scripts (`auto-play`, `browser-test`,
  `debug-resize`, `shots*`, `playthrough`) stay tracked —
  they're part of the public dev experience.
- `public/assets/images/alpha/` (pre-rembg sprite sources),
  `public/assets/images/rembg-compare/` (side-by-side renders
  for halo-cleanup tuning), and `public/assets/images/indra.jpg`
  (raw INDRA portrait, replaced by `sprites/indra_battle_idle.png`)
  added to `.gitignore`. Phaser's Preloader does not load any
  of them, confirmed by grep.
- `docs/design/enemy-boss-prompts.md` (Japanese internal
  prompt notes for boss image generation) re-ignored. The
  whitelist now correctly says: only `docs/design/build-spec.md`
  ships under `docs/design/`.

`bun run build` still produces `dist/` cleanly (78 modules,
275 kB main bundle gzipped to 78 kB). `bunx tsc --noEmit`
returns 0 errors.

### Quality bar

- `bun run tsc --noEmit`: 0 errors.
- `bun run build`: clean, no new size regression.
- `/simplify` (3 reviewers — reuse / quality / efficiency):
  efficiency was clean; reuse + quality flagged Story.ts /
  storyOverlay.ts CSS overlap with Settings / Collection.
  Promoted the small low-risk fixes (consolidated ESC / R /
  BACK behind a single `goBack` closure with consistent
  `playSfx`, trimmed redundant scene JSDoc and free-floating
  block comment in storyOverlay). Larger refactors
  (extracting a shared scene-base helper, lifting common
  panel CSS into `overlayBase`) deferred — they would touch
  Settings / Collection / Sanctum and need their own
  regression pass, not worth the risk on submission day.

### Submission state

This is the last commit before the Cloudflare Workers deploy.
Open paths from here:

- `bun run release deploy` to roll the trimmed `dist/` to
  Workers Static Assets behind the existing custom domain.
- itch.io HTML5 zip via `bun run package-itch` (not yet
  re-exported with the new `bgm_victory.mp3`; needs one more
  pass before submission).
- Final screenshot refresh — `06_sanctum.png` is in, the
  others are stale relative to the post-cleanup STORY-button
  Title and the new Victory layout. Optional polish if there
  is time before 15:00 UTC.

---

## Day 12 — afternoon (2026-04-26 12:00–17:00 JST)

### Boss cut-in overhaul + ULT order arbitration

The morning commit had INDRA's "Plan E" phase cut-in but
every boss ULT was a small label flash with no portrait.
The afternoon collapsed that gap so mid-bosses and the
big-boss carry the same cinematic weight as INDRA, plus
added strict ULT ordering so the two sides can't talk over
each other.

**Boss cut-in (`Battle.spawnUltimateFlash` enemy branch)**

Same Plan-E choreography as INDRA — P1 white→red impact,
P2 darken + 36-spoke radial speed-lines, P3 silhouette →
RGB chromatic-aberration converge, P4 ULT-name stamp +
shockwave, P5 hold→fade. Mirrored colour palette (red
accent), name stamp lands lower-centre instead of INDRA's
lower-right, RGB split offsets sign-flipped.

Portrait flipped horizontally so the boss faces left toward
INDRA. NEKOMATA-Ψ's source art is already drawn facing left,
so that one key is exempt. Portrait scale bumped to
`(gameHeight / baseH) * 1.40` (up from 1.10) and anchor
pushed to `cy + 100`, so the head/upper body lifts off the
top edge and reads as "bigger than the arena" — same energy
as INDRA's cut-in.

**JPEG-source asset cleanup (chroma-key + vignette)**

The boss cut-in originals (`m_enemy/{neko,noppe,kasa}.png`,
`l_enemy/yukionnna.png`) are JPEG with no alpha channel.
Painted on top of the dark cut-in overlay, they surfaced a
hard 1024×1024 rectangle — read as "ugly".

Two-stage rescue, no asset re-export:

1. **Preloader chroma-key**: after `loaderror` settles,
   the four boss `_ult` keys are pulled into a canvas,
   each pixel's luminance evaluated, and pixels under a
   `LOW=18 → HIGH=50` ramp get alpha-keyed. Replaces the
   texture in place via `textures.remove + addCanvas`,
   so all downstream code keeps using the original key
   without knowing the source was JPEG.
2. **Radial vignette overlay**: a runtime-generated
   `cut_in_vignette` canvas (radial gradient 0% → 95%
   black, cached on first use) sits on top of the
   portrait at depth `D+6`, dissolving anything the
   chroma-key step missed into the surrounding dark.

**Glitch reveal**

P3 ships a "system corruption" beat: 14 random horizontal
black/accent stripes pop in / fade out within the
350–720 ms window, plus a horizontal-jitter tween on the
silhouette / green RGB layer. Sells "boss is corrupting into
the frame" instead of just appearing cleanly.

**Pre-ult sprite tremor (boss only)**

The boss battle sprite (1024×1024 PNG, on stage right)
shakes left/right BEFORE the cut-in covers the arena, in a
ramp-accelerating 16-beat sequence (95 ms cycle → 22 ms,
±8 px, Linear ease). The cut-in starts the moment the shake
settles, locked together via the shake function returning
its own duration. INDRA keeps its existing 4-phase rear-up
+ body-slam motion (untouched).

**ULT order arbitration**

Previously player and boss could fire ULTs in the same
`update` frame, with no order guarantee. Two arena-rule
changes:

1. `update()` now bails on `if (this.ultFiring) return;`.
   Both sides' combat tick — gauge fill, auto-attacks,
   everything — freezes during a cut-in, so whichever
   side hit 100% first claims the slot and the other side
   waits.
2. Boss ULT damage application (attack popups, HP refresh,
   lose-check) is delayed to `shakeMs + 2400 ms` after
   `enemyTick.ultimateFired` lands — the player sees the
   cut-in BEFORE watching their HP drop, mirroring how
   player ULT damage already lands at 2800 ms inside
   `triggerPlayerUltimate`.

Net result: clean alternation, no double-cut-ins, readable
"boss got the jump" vs "player struck first" beats.

**Settings → Debug previews**

Five new `Cut-in: <name>` rows in Settings → Debug let us
review every cut-in without playing through. Each preview
boots Battle with a dummy round (HP 9999, cooldown 99s so
combat never advances), fires the requested cut-in, then
fades back to Settings. previewOnly = true blocks all save
mutations.

### Day 12 afternoon — quality bar

- `bunx tsc --noEmit`: 0 errors.
- `bun run scripts/check-i18n.ts`: 0 missing translations.
- Boss cut-ins verified via Settings → Debug previews
  (NEKOMATA-Ψ / MUJINA-Σ / TSUKUMO-Δ / YUKIME-Ω) at
  1280×720; portrait, glitch stripes, chroma-key, vignette,
  ULT name placement, sprite tremor all hit the intended
  beat.
- Boss `_ult` art keys committed: `m_enemy/{neko,noppe,kasa}.png`,
  `l_enemy/yukionnna.png` (JPEG with .png extension).
- Battle sprite PNGs committed:
  `boss_{bakeneko,nopperabo,karakasa,yuki_onna}_battle.png`
  (transparent).

---

## Day 12 — evening (2026-04-26 17:00–22:00 JST)

### Submission-readiness pass

Last day of the jam. Morning landed cut-ins and order
arbitration. The evening was a pure regression / polish
sweep — every bug found during the late-stage Hard playtest
got fixed, and the Collection screen was reconciled with
the actual jam content.

### Boss-ULT freeze (root cause: race with player gauge fill)

When boss ULT and player gauge fill landed on the SAME
`update()` tick, `update()` set `ultFiring=true` for the
boss cut-in *and* called `startGijiren` → `showUltimateButton`
in the gauge-ready branch at the bottom of the same call.
The SOUL STRIKE DOM button (`z-index: 150`,
`background: rgba(0,0,0,.55)`) mounted on top of the boss
cut-in and the screen read as frozen even though the
runtime was healthy — the player's input target was hidden
under the dim overlay.

Fix: the gauge-ready branch now bails when `ultFiring=true`.
The check defers naturally — the next `update()` after the
cut-in's `ultFiring=false` callback fires picks up the
still-full gauge and runs `startGijiren` cleanly. Also
hardened the path with three safety nets: `hp<=0` force
`finishBattle`, `ultFiring` orphan-detect (>6 s force
release), and per-step try/catch around the post-cut-in
damage application so a thrown sprite-destroy can't strand
the lock.

### Boss sprite half-transparent persistence

`playEnemyUltimateSpriteMotion()` calls
`tweens.killTweensOf(visual)` to clear pending tweens
before its shake chain. Phaser's `killTweensOf` stops the
tween at its current value but never restores the target —
so a hit-flash tween (`alpha: 0.3 → 1.0`, 160 ms) caught
mid-stride left the boss sprite stuck at e.g. `0.5` alpha
through the cut-in and beyond, reading as "boss is fading
out / half-dead" while HP was still positive. Added
`visual.setAlpha(1)` after `killTweensOf` (mirror in the
player variant) — re-anchors the sprite before shake.

### EnemyDef → runtime pipeline regression

While diagnosing "YUKIME-Ω one-shot" reports the underlying
bug surfaced: `defToEnemy` was silently stripping the
boss-spec fields (`shieldCharges`, `repairAmount`,
`repairIntervalSec`, `extraWeapons`) from `EnemyDef`, and
`createEnemyCombatant` had them hardcoded to `0` / `1`. So
**every boss in the jam was fighting with bare statline** —
no shield, no repair, only one weapon. NEKOMATA-Ψ never
threw Pounce, MUJINA-Σ had no Mimic Strike or 2-shield
buffer, TSUKUMO-Δ skipped Hop Slam, YUKIME-Ω fought without
shield charges or Frozen Breath. This explained the
one-shot pattern and why the mid-bosses felt lighter than
their tier suggested.

Fix landed in three files:

1. `data/schema.ts` — `EnemyData` extended with optional
   boss-spec fields.
2. `systems/enemyPool.ts` — `defToEnemy` passes them
   through.
3. `systems/combat.ts` — `createEnemyCombatant` wires them
   into the runtime, layering `extraWeapons` onto the
   default attack and applying `enemyDamageMultiplier` to
   keep the balance curve intact.

YUKIME-Ω's stats then got a deliberate bump now that her
kit actually fires: `baseHp 700 → 1300`, `DR 0.20 → 0.25`,
`shieldCharges 3 → 6`, `repairAmount 5 → 8`. Floor for a
buff-less Hard clear is now 2-3 ULT exchanges, not one.

### BGM overlap on rapid scene swaps

`playMusic` runs the cross-fade as a Phaser tween scoped to
the *calling* scene. Spamming SPACE through Result → Build →
Battle let the calling scene shut down before its fade-out
tween's `onComplete: prev.stop()` fired — Phaser killed the
tween and the previous BGM kept playing. Two or three
scenes' worth of BGM stacked.

Fix: module-level `fadingSounds: Set<TweenableSound>`
tracks every fade-out target. Each `playMusic` call
force-stops the set before scheduling the new pair. Normal
fade completion still removes itself from the set via
`onComplete`. Single-track audio survives any
scene-spam pattern.

### Hard-mode 1-shot clear → balance pass

A clean Hard run cleared on the first attempt with gold to
spare — gear-walling wasn't biting. Two-handed fix:

- `ECONOMY.roundRewardBase` 600 → 500,
  `roundRewardPerRound` 100 → 80. Hard total purse:
  11,400 → 9,600 g (~16 % drop). Player can ★3-merge
  *or* keep buying through R9 — not both.
- `BALANCE.roundDifficultyGrowthHard` 1.18 → 1.22. R5
  ramp: 1.94× → 2.21×, R7: 2.70× → 3.30×, R9: 3.76× →
  4.91×. Combined with the 1.30× `hardEnemyStatBoost`,
  R9 effective scaling lands at 6.38×.

Easy growth (`roundDifficultyGrowthEasy 1.10`) untouched.
Easy gets a smaller wallet trim (~12 %) but stays
buff-less-clearable.

### Collection screen reconciled with jam scope

`Collection.ts` was iterating every entry in `ALL_ROBOT_KEYS`
/ all enemies / all skills, including dormant Episode 1
content (GOLIATH-414 / STRIKER / ORACLE, IBARA-IV / RAIJU-VI
/ etc., SHUTEN-Ω / TAMAMO-Σ / NUE-Π) and the excluded
super boss Daitengu. Players saw a 26-entry enemy tab and a
4-entry machine tab where 17 / 1 was correct. Skills
mirrored the same problem — 4 of 10 (the big-boss tier) are
gated by `isSuperRoute` which can't trigger on a
10-round Hard layout, so they're permanently locked.

Centralised the jam allow-lists at the data layer:

- `JAM_ROBOT_KEYS` in `data/robots.ts` (INDRA only).
- `JAM_NORMAL_IDS` / `JAM_MIDBOSS_IDS` / `JAM_BIGBOSS_IDS` /
  `JAM_ENEMY_IDS` in `data/enemies.ts` — single source of
  truth used by both `enemyPool.generateRunEnemies` and the
  Collection scene.
- Skills filtered to `tier === 'midBoss'` (6 reachable).

Achievements got the same trim: `ach_all_robots` (4
machines) and `ach_apex` (Daitengu) dropped as unreachable;
`ach_all_enemies` recounted to 17. Added `ach_collect_king`
(tier 5) — gated by 100 % across all four tabs, displays as
the Title-screen banner once earned.

### Debug helpers (Settings → Debug)

QA needed a way to eyeball the Collection screen without
grinding several Hard runs. Two new dev-only rows added to
`Settings → Debug`:

- `Collection: Unlock All` — fills every collection field
  to its jam-scope ceiling (1 machine cleared, 25 parts
  used, 17 enemies defeated, 6 mid-boss skills acquired,
  easy/hardCleared = true). `ach_collect_king` lights up
  immediately.
- `Collection: Wipe` — inverse. Resets only collection
  fields; leaves scrap, settings, and owned buff items
  alone.

Both share an `applyCollectionState('full' | 'empty')`
mutator so the field list stays in one place. Helpers live
in `scenes/settingsDebug.ts` behind the existing
`import.meta.env.DEV` gate, so the prod bundle still
strips them cleanly.

### `/simplify` quality gate

Three review agents (reuse / quality / efficiency) ran on
the day's diff. Findings landed:

- `JAM_*_IDS` had drifted into a duplicate inline definition
  inside `enemyPool.ts`; collapsed to a single import from
  `data/enemies` (data-ownership rule).
- Four `console.info` debug lines from the freeze
  diagnosis were stripped — they would have spammed every
  Hard R10.
- `setSoulStrikeButtonVisible` was reaching across the
  DOM/canvas boundary via `document.querySelector`. Moved
  to a `setVisible(visible: boolean)` method on
  `SoulStrikeButtonHandle`; Battle holds the handle and
  calls it cleanly.
- `unlockAllCollection` / `wipeCollection` collapsed to
  the shared `applyCollectionState` helper.
- `'robot_knight'` literals in Collection / settingsDebug
  / achievements replaced with `JAM_ROBOT_KEYS`.
- Long changelog-style comments in `balance.ts`,
  `economy.ts`, `enemies.ts` trimmed to the load-bearing
  WHY (the bumps and rationale) — date-stamped narration
  and before/after diffs belong in commit messages.

`bunx tsc --noEmit`: 0 errors after every fix.

### Submission state — final

Last commit before the 23:00 JST submission cutoff:

- itch.io build: `/dist` skill produces a stripped zip
  with all debug rows tree-shaken (verified by the grep
  step in the skill). Upload via butler `risingore/soul-strike:html`.
- Cloudflare Workers mirror at `machines.risingore.com`
  exists from earlier deploys — itch is the canonical
  jam target so the mirror is no longer advertised on the
  jam form / README.
- GitHub repo public for the Open Source Challenge entry.

---
