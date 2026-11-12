# Genesis Town · landing page

The landing page for [Genesis Town](https://gentown.my.id/), a pixel-art market-town life sim on NEAR testnet.
Plain HTML, CSS and JS, no build step. Deployed on Vercel.

- `index.html` the page; `world.js` the hero's live 2.5D Homeland, built from the game's own files in `game/`
  (copied from the game repo's `client/`: `vendor/three.js`, the sprite art, the village and Homeland generators and
  the 3D kit in `js/three/`).
- Live numbers (prices, the clock, the settled day) come from the game's API: `vercel.json` rewrites `/api/*` to
  `https://gentown.my.id/api/*`, so the page only ever calls its own origin.
- Every Play button goes to https://gentown.my.id/.

## Run it locally

```bash
node dev.mjs
```

Opens on http://localhost:4321 and passes `/api/*` to the live game server, as Vercel does.

## Deploy

Import the repo in Vercel (framework preset: Other, no build command, output directory: the repo root).
