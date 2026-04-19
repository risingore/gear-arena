# SOUL STRIKE

Assemble your soul. Press the button. Strike.

Cyborg humans augmented with mechanical weapons fight in an ultimate-only combat system. No normal attacks — survive enemy fire while your soul gauge charges, then press SOUL STRIKE and unleash a devastating one-hit kill. A hidden probability system, layered aura states, and prediction glyphs decide whether the blow lands as a critical.

Episode 0 of the planned **CIRCLE OF SAMSARA** trilogy. Built with **Phaser 4 + TypeScript + Vite + Bun**.

## Play Now

[machines.risingore.com](https://machines.risingore.com)

## Features

- **Ultimate-only combat** — no normal attacks. Survive, charge, and fire your SOUL STRIKE
- **Hidden probability hit system** — rush states, layered aura colors (green → blue → red → rainbow), and prediction glyphs shape each critical decision
- **4 cyborg fighters** — INDRA, GOLIATH-414, LILITH, MUMEI — each with a distinct blueprint and soul strike ability
- **25 parts** across 5 categories (module, implant, charger, booster, soul) that power up your strike
- **Buddhist mandala lore** — character names (Indra, Goliath, Lilith/Rakshasa, Mumei/Shunya) and ultimate names (Vajra, Karuna, Raksha, Nirvana) are drawn from the Kongō-kai and Taizō-kai mandala systems
- **5 consumable items** — heal mid-run or buff your next battle
- **10 skills** — earned from boss rewards, permanent for the run
- **10 rounds** with escalating difficulty, mid-bosses, and a final boss
- **Achievements and collection** — track unlocked cyborgs, discovered parts, defeated enemies, earned titles, and acquired skills
- **HTML DOM Title overlay** — the Title screen is a native SVG + CSS layer riding on top of the Phaser canvas, so text and vector art render at full device resolution on Retina / 4K
- **Trilogy tease** — defeat the final boss to glimpse the next chapter: `HYAKKI YAKOU — STANDING BY` and `TO BE CONTINUED: SOUL BREAKER`
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

- **Click shop cards or press 1-5**: buy parts
- **Click equipped slots**: sell parts (50% refund)
- **Drag parts** from shop to specific slots
- **Space / Click**: fire SOUL STRIKE when gauge is full
- **S**: cycle battle speed (x1 / x2 / x4 / x6)
- **R**: restart from any scene

## License

Dual-licensed:

- **Source code** (everything under `src/`, configs, scripts, and documentation prose) — [MIT License](LICENSE). Free to reuse, modify, and redistribute with attribution.
- **Visual and audio assets** (everything under `public/assets/`) — [CC BY-NC 4.0](LICENSE-ASSETS). Attribution required, non-commercial use only.

Runtime-synthesized sound effects generated via the Web Audio API (`src/game/systems/audio.ts`) are considered source code and fall under MIT.
