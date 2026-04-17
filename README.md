# GEAR ARENA

Build your ultimate. Press the button. Destroy everything.

Cyborg humans augmented with mechanical weapons battle in an ultimate-only combat system. No normal attacks — survive enemy fire while your ultimate gauge charges, then unleash devastating strikes powered by a pachislot-inspired hit system.

Built with **Phaser 4 + TypeScript + Vite + Bun**.

## Play Now

[machines.risingore.com](https://machines.risingore.com)

## Features

- **Ultimate-only combat** — no normal attacks. Survive, charge, and fire your ultimate
- **Pachislot hit system** — timing-based rush mechanic determines critical hits and aura bonuses
- **4 unique cyborgs** — KNIGHT, GOLIATH, STRIKER, ORACLE — each with a distinct blueprint and ultimate ability
- **25 parts** across 5 categories (weapons, armor, engines, gears, specials) that power up your ultimate
- **Weapons = ultimate modules** — each equipped weapon adds strikes to your ultimate attack
- **5 consumable items** — heal mid-run or buff your next battle
- **10 skills** — earned from boss rewards, permanent for the run
- **10 rounds** with escalating difficulty, mid-bosses, and a final boss
- **Achievements and collection** — track unlocked cyborgs, discovered parts, defeated enemies, earned titles, and acquired skills
- **Zero-byte audio** — all SFX synthesized at runtime via Web Audio API
- **Japanese localization** — auto-detected from browser language
- **PWA support** — installable as a standalone app

## Built for Gamedev.js Jam 2026 — Theme: Machines

Every mechanic ties back to "assembling a machine from parts." Equip weapon modules to add strikes to your ultimate, stack armor to survive until it charges, tune engines for faster gauge fill. All game parameters live in `src/data/*.ts` as typed constants — balance is tuned by editing data files directly.

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
- **Space / Click**: fire ultimate when gauge is full
- **S**: cycle battle speed (x1 / x2 / x4 / x6)
- **R**: restart from any scene

## License

MIT
