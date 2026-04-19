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
- Wrote full individual stories for all four cyborgs (INDRA / GOLIATH-414 / LILITH / MUMEI) that fit the Kongō-kai / Taizō-kai mandala metaphor. GOLIATH remains deliberately opaque: the only in-game hint is the ultimate name "Compassion Engine."

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
of `tasks/todo.md`.

- **Title scanlines + holographic glitch tear.** Added `::before` /
  `::after` layers on the Title overlay stage for CRT-style scanline
  repeating-linear-gradient (2.4s step animation) and a rare (every 7.3s)
  orange/blue tear streak that skews across the frame. Same Post-cyberpunk
  palette, zero extra bundle weight.
- **Pachislot audio depth.** Audio bus was doing a single `ultimate`
  voicing for all four cyborgs, and the seven prediction-cue visual
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

Placement synergy log-wiring (`tasks/todo.md` L305) was scoped out:
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
