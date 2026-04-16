# GEAR ARENA

Slot-based retro-mecha auto-battler roguelite — assemble a robot on a blueprint grid, then watch it fight.

Built with **Phaser 4 + TypeScript + Vite + Bun**.

## Play Now

[machines.risingore.com](https://machines.risingore.com)

## Features

- **4 unique robots** — KNIGHT, GOLIATH, STRIKER, ORACLE — each with a distinct blueprint and slot layout
- **25 parts** across 5 categories (weapons, armor, engines, gears, specials)
- **5 consumable items** — heal mid-run or buff your next battle
- **10 skills** — earned from boss rewards, permanent for the run
- **4 ultimate abilities** — one per robot, charged by taking damage
- **10 rounds** with escalating difficulty, mid-bosses, and a final boss
- **Achievements and collection** — track unlocked robots, discovered parts, defeated enemies, earned titles, and acquired skills
- **HP carry-over** between rounds for added tension
- **Zero-byte audio** — all SFX synthesized at runtime via Web Audio API
- **Japanese localization** — auto-detected from browser language
- **PWA support** — installable as a standalone app

## Built for Gamedev.js Jam 2026 — Theme: Machines

Every mechanic ties back to "assembling a machine from parts." All game parameters live in `src/data/*.ts` as typed constants — balance is tuned by editing data files directly.

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
- **Space**: confirm / ready / toggle battle speed
- **R**: restart from any scene

## License

MIT
