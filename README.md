# SOUL STRIKE

Assemble your soul. Press the button. Strike.

Cyborg humans augmented with mechanical weapons fight in an ultimate-only combat system. No normal attacks — survive enemy fire while your soul gauge charges, then press SOUL STRIKE and unleash a devastating one-hit kill powered by a pachislot-inspired hit system.

Built with **Phaser 4 + TypeScript + Vite + Bun**.

## Play Now

[machines.risingore.com](https://machines.risingore.com)

## Features

- **Ultimate-only combat** — no normal attacks. Survive, charge, and fire your SOUL STRIKE
- **Pachislot hit system** — rush mechanic determines critical hits and aura bonuses
- **4 cyborg fighters** — INDRA, GOLIATH-414, LILITH, MUMEI — each with a distinct blueprint and soul strike ability
- **25 parts** across 5 categories (module, implant, charger, booster, soul) that power up your strike
- **Modules = strike power** — each equipped module adds strikes to your soul strike attack
- **5 consumable items** — heal mid-run or buff your next battle
- **10 skills** — earned from boss rewards, permanent for the run
- **10 rounds** with escalating difficulty, mid-bosses, and a final boss
- **Achievements and collection** — track unlocked cyborgs, discovered parts, defeated enemies, earned titles, and acquired skills
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

MIT
