# GEAR ARENA

Slot-based retro-mecha auto-battler roguelite built for **Gamedev.js Jam 2026** (theme: *Machines*).

- **Play**: [machines.risingore.com](https://machines.risingore.com)
- **Engine**: Phaser 4.0 / Vite 6 / TypeScript / Bun
- **Jam**: Gamedev.js Jam 2026 (deadline 2026-04-26 15:00 JST)

## What it is

Pick one of 4 mechas, fill its blueprint with weapons / armor / engines / gears / specials, then watch it auto-battle through 5 rounds (boss on round 5). Each blueprint has a unique slot layout — the robot you pick is the strategy you play. One run is 3–5 minutes. Press R at any time to restart.

## Core gimmick: data-as-code

All parameters (parts, robots, rounds, shop economy, synergies) live in `src/data/*.ts` as `const satisfies` objects with template literal typed IDs and discriminated unions. Game code imports from `@/data` and never contains magic numbers. Balance can be tuned by editing the data files directly — Vite HMR reflects changes in seconds, TypeScript catches mistakes at save time, and there is zero runtime validation overhead.

Why not spreadsheets or JSON? Because the editor (game designer) and the engineer (me + Claude Code) use the same VS Code project on the same commits, and `as const satisfies` gives full type completion, `goto definition`, and inline errors without pulling in Zod or a CSV pipeline.

## Commands

```bash
bun install        # install dependencies
bun dev            # dev server on localhost:8080
bun run build      # production build (dist/)
bun test           # run unit tests (stats + combat)
bun run package-itch  # create machines-itch.zip
bunx wrangler deploy  # deploy to Cloudflare Workers
```

## Architecture

```
src/
├── main.ts                     Entry (DOM-ready, then boots Phaser.Game)
├── data/                       Single source of truth for numbers + names
│   ├── schema.ts               Type definitions (template literal IDs, discriminated unions)
│   ├── parts.ts                15 parts (weapons / armor / engines / gears / specials)
│   ├── robots.ts               4 blueprints with slot layouts
│   ├── rounds.ts               5 rounds of enemies including boss
│   ├── economy.ts              Shop, gold, rewards
│   ├── synergies.ts            Cross-part combos
│   └── index.ts                Public re-exports
├── game/
│   ├── main.ts                 Phaser.Game scene registration
│   ├── helper/gameOptions.ts   Screen size, colors, text styles
│   ├── systems/                Pure logic, zero Phaser dependency where possible
│   │   ├── palette.ts          Placeholder colors
│   │   ├── runState.ts         Shared state via Phaser Registry
│   │   ├── stats.ts            Loadout aggregation
│   │   ├── combat.ts           Battle simulation
│   │   ├── shop.ts             Shop rolls
│   │   ├── loadout.ts          Buy / sell / reroll
│   │   ├── audio.ts            Web Audio API SFX synthesis (zero asset files)
│   │   ├── savedata.ts         localStorage best-run tracking
│   │   └── transition.ts       Scene fade helper
│   └── scenes/                 Boot → Preloader → Title → Select → Build → Battle → Result → GameOver
└── vite-env.d.ts

tests/
├── stats.test.ts               bun test
└── combat.test.ts              bun test
```

## Controls

- **Arrow keys / click**: navigate menus, select robot
- **Click shop cards or press 1-5**: buy parts
- **Click equipped slots**: sell parts (50% refund)
- **Space**: confirm / ready / toggle battle speed (×1 / ×2 / ×4)
- **Enter**: confirm robot selection
- **R**: restart from any scene

## Jam submission

- itch.io HTML5: upload `machines-itch.zip`, set entry to `index.html`, resolution 1280×720
- Mirror: [machines.risingore.com](https://machines.risingore.com) (Cloudflare Workers Static Assets)

## Made with

- **Cursor + Claude Code** — primary development environment
- **Phaser 4** — 2026-04-10 stable release
- **Bun** as the runtime and test runner

## License

Source code: MIT.
Generated placeholder art and sound: see `docs/asset-provenance.md` for per-asset provenance.
