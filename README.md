# OUR

A calm, map-first Intelligent Navigation Assistant for exploring San Francisco. Built with React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, Lucide, and Framer Motion.

## Run

```sh
npm install
npm run dev
```

## Verify

```sh
npm run build
npx tsc --noEmit
npx playwright install --with-deps chromium
npx playwright test
```

The Playwright configuration starts the development server automatically when needed.

## Publishing

Two ways to take this live. Both build to the same self-contained `dist/` folder.

### Option A — push the source to a Git host

Version control only. Anyone can clone and run it locally.

```sh
# 1. Create an empty repo on github.com, then connect it (done once)
git remote add origin https://github.com/<you>/our.git
git push -u origin main

# 2. Everyday workflow
git add -A && git commit -m "Describe the change" && git push
```

Tip: use the SSH remote (`git@github.com:<you>/our.git`) if you have an SSH key set up, so pushes do not ask for a token.

### Option B — publish the site to GitHub Pages

A live URL, updated automatically whenever `main` changes. The included workflow at
`.github/workflows/deploy.yml` does the build and deploy.

1. Push the source using Option A.
2. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The site appears at `https://<you>.github.io/our/`.

No further config is needed: the build emits relative asset paths, so it works at a domain
root and under a project subpath. To deploy manually instead, run `npm run build` and upload
the whole `dist/` folder to any static host — Netlify, Vercel, Cloudflare Pages, or S3.

## Experience

- Search eight curated destinations with keyboard-accessible suggestions.
- Compare real street geometries and estimated travel times across four travel modes.
- Discover nearby coffee, food, and parks on a pannable, zoomable map.
- Save places, navigation preferences, and completed preview journeys on this device.
- Step through a navigation simulation, with optional browser voice directions.
- Share links that retain the destination, route, travel mode, and direction.
- Switch between the planner and map on small screens.
- Use satellite imagery, recentering, and a zoom-responsive map scale.

## Demo Scope

This is a fully interactive front-end demo, not a live GPS navigation service. The origin is a sample location in Pacific Heights. Street geometry was prepared with OSRM and is bundled in `src/data/routes.json`. Travel times are estimates, weather is illustrative, and non-driving modes use road-based previews rather than dedicated pedestrian, bicycle, or transit routing. Reversed routes are previews and do not account for one-way restrictions.

Avoidance preferences are saved but do not change the curated route geometry. Voice directions depend on browser speech-synthesis support. Satellite imagery and map areas beyond the bundled San Francisco tiles need a network connection. No API key or account is needed to run the demo.

## Structure

- `src/App.tsx`: workspace state, route planner, collections, previews, and dialogs.
- `src/components/MapView.tsx`: map layers, routes, markers, and map controls.
- `src/components/UI.tsx`: accessible dialogs, switches, and persistence helpers.
- `src/data/places.ts`: destinations, data types, and distance/time formatting.
- `src/assets/`: bundled Manrope variable font and its license, inlined at build time.
- `.github/workflows/deploy.yml`: GitHub Pages build and publish pipeline.
- `src/index.css`: responsive visual system and reduced-motion support.
- `tests/our.spec.ts`: end-to-end interaction coverage.

## Credits

- Map tiles: Esri World Light Gray Canvas, Esri, HERE, Garmin, OpenStreetMap contributors, and the GIS User Community. The bundled demo tiles use a subtle custom palette; satellite imagery is provided by Esri.
- Routing geometry: OpenStreetMap data via the OSRM demonstration service.
- Manrope: Mikhail Sharanda and the Manrope Project Authors, SIL Open Font License. License included in `src/assets/OFL.txt`; the font is inlined into the build.
- Ferry Building photograph: Nkem Ukoha, Pexels photo 12523667.
- Palace of Fine Arts photograph: Maria Charizani, Pexels photo 5322891.
- Dolores Park photograph: Oli, Pexels photo 6376520.
- Coffee photograph: Du Tu Mong, Pexels photo 2226091.
