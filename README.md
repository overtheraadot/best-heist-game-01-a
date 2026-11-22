# The Gilded Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/overtheraadot/best-heist-game-01-a/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/overtheraadot/best-heist-game-01-a/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist in a night museum. You are **Rook**, a thief in a
purple cloak. Cross the gallery under sweeping security cameras and
patrolling guards, read their vision cones, steal the **Star Sapphire** from
its locked case in the Vault, and vanish through the skylight.

## How to play

- **WASD / arrows** — move (click the floor to walk there too)
- **Shift** — sneak (slower, harder to spot)
- **E** — pick the sapphire case (2s) or open it at once with a lockpick
- **1** — smoke bomb (blocks vision, 2 uses)
- **2** — EMP (blinds all cameras for 8s, 1 use)
- **P** — pause · **R** — restart · **M** — mute

Getting spotted raises the **alarm meter**; break line of sight and it falls
again. At 100 you are caught — unless you vanish in the 0.9s grace window.
There are several routes to the Vault: the guarded main door, the side
gallery, or the air-vent crawl.

## Run it

Serve `game/` with any static server and open `index.html` in desktop
Chrome. No network requests, no build step — vanilla canvas JavaScript and
WebAudio oscillator sounds only.

```sh
python3 -m http.server -d game 8080
```

## Layout

- `game/main.js` — state, loop, alarm and win/lose rules
- `game/levels.js` — the museum: rooms, walls, loot, patrols, cameras
- `game/guards.js` — patrols, vision cones, line of sight, spotting
- `game/cameras.js` — sweeping cameras and the EMP
- `game/loot.js` — loot, the locked sapphire case, tools
- `game/player.js` — movement and wall collision
- `game/input.js` — keyboard and mouse
- `game/audio.js` — WebAudio oscillator sounds
- `game/render.js` — all drawing, HUD and screens
- `main.ts` — the make.fun hand-in program

Built for the make.fun competition
[best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559).
MIT licensed.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8bg6hn2r&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
