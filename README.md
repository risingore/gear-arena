# SOUL STRIKE

Assemble your soul. Press the button. Strike.

Pilots ride forbidden Machines in an ultimate-only combat system. No normal attacks — survive enemy fire while your soul gauge charges, then press SOUL STRIKE and unleash a devastating one-hit kill. A hidden probability system, layered aura states, and prediction glyphs decide whether the blow lands as a critical.

Episode 0 of the planned **CIRCLE OF SAMSARA** trilogy. Built with **Phaser 4 + TypeScript + Vite + Bun**.

Beneath the surface runs an **[Echo Theory](https://note.com/risingore/n/nbff78bf31a50)** layer: residual signals threaded across Title, Select, broadcasts, and endings. The transmitter is dead; the signal kept ringing.

## Play Now

[risingore.itch.io/soul-strike](https://risingore.itch.io/soul-strike)

## Features

- **Ultimate-only combat** — no normal attacks. Survive, charge, and fire your SOUL STRIKE
- **Hidden probability hit system** — rush states, layered aura colours (white → blue → yellow → green → red → rainbow) shown by the mandala button glow, and prediction glyphs (rainbow cycle, mandala flash, red flash, lightning, screen glitch) shape each critical decision
- **Cinematic ULT cut-ins** — INDRA's SOUL STRIKE and every boss (NEKOMATA-Ψ, MUJINA-Σ, TSUKUMO-Δ, YUKIME-Ω) get a full Plan-E phase choreography: impact flash → radial speed-lines → silhouette → RGB chromatic-aberration converge → ULT name stamp → shockwave. Bosses add a pre-ult tremor that accelerates into the unleash, plus glitch-stripe reveal and a chroma-keyed portrait that floats over the arena
- **One-at-a-time ULT order** — when both gauges fill, whichever side hits 100% first claims the cut-in slot; the other side's combat tick (gauge fill + auto-attacks) freezes until the cut-in finishes and damage lands
- **Tiered synergy halo** — active synergies (placement + category) layer a halo around your machine in battle: **3+** white ring, **5+** gold mandala, **7+** orange storm
- **4 Machines** planned — INDRA (playable in Ep0), GOLIATH-414, LILITH, MUMEI (COMING SOON teasers)
- **25 parts** across 5 categories (module, implant, charger, booster, soul) that power up your strike. Buy duplicates to ★-merge into higher tiers
- **Buddhist mandala lore** — character names (Indra, Goliath, Lilith/Rakshasa, Mumei/Shunya) and ultimate names (Vajra, Karuna, Raksha, Nirvana) are drawn from the Kongō-kai and Taizō-kai mandala systems
- **9 consumable buff items** — earn at SANCTUM (加持堂) for permanent run-to-run loadout buffs
- **10 skills** — earned from boss rewards, permanent for the run
- **Two campaign lengths** — Easy (5 rounds, mid-boss climax) or Hard (10 rounds, big-boss climax with HYAKKI YAKOU tease)
- **SANCTUM (加持堂) meta-progression** — bank scrap from each run, consecrate buffs that auto-equip on the next
- **Achievements and collection** — track unlocked Machines, discovered parts, defeated enemies, earned titles, and acquired skills
- **HTML DOM Title overlay** — the Title screen is a native SVG + CSS layer riding on top of the Phaser canvas, so text and vector art render at full device resolution on Retina / 4K
- **Trilogy tease** — defeat the final boss to glimpse the next chapter: `HYAKKI YAKOU — STANDING BY` and `TO BE CONTINUED: SOUL BREAKER`
- **Echo Theory layer** — residual signals stitched into Title, Select, broadcasts, and endings. ([source article](https://note.com/risingore/n/nbff78bf31a50))
- **Zero-byte audio** — all SFX synthesized at runtime via Web Audio API
- **Japanese localization** — auto-detected from browser language
- **PWA support** — installable as a standalone app

## Built for Gamedev.js Jam 2026 — Theme: Machines

Every mechanic ties back to "assembling a machine from parts." Equip modules to add strikes to your soul strike, stack implants to survive until it charges, tune chargers for faster gauge fill. All game parameters live in `src/data/*.ts` as typed constants — balance is tuned by editing data files directly.

## Commands

```bash
bun install           # install dependencies
bun dev               # dev server on localhost:8080
bun run build         # production build (dist/)
bun test              # run unit tests
bun run package-itch  # create machines-itch.zip for itch.io
```

## Controls

- **Click shop cards**: buy parts (auto-equipped into the first matching slot; duplicates ★-merge into a higher tier)
- **Space / Click**: fire SOUL STRIKE when the mandala button appears
- **S**: cycle battle speed (×1 / ×1.5 / ×2)
- **R**: restart from any scene

## License

Dual-licensed:

- **Source code** (everything under `src/`, configs, scripts, and documentation prose) — [MIT License](LICENSE). Free to reuse, modify, and redistribute with attribution.
- **Visual and audio assets** (everything under `public/assets/`) — [CC BY-NC 4.0](LICENSE-ASSETS). Attribution required, non-commercial use only.

Runtime-synthesized sound effects generated via the Web Audio API (`src/game/systems/audio.ts`) are considered source code and fall under MIT.
