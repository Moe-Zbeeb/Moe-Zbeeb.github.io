# EECE490 Course Page Maintenance

This repository hosts the deployed static output for the EECE490 course page under `lab/eece490/`. The editable React/Tailwind source now lives inside this repo at `lab/eece490-src/`.

## Edit the course content
- Open `lab/eece490-src/src` to update components, text, or assets.
- Background images live in `lab/eece490-src/background/`; add or replace files there.

## Build the static site
From `lab/eece490-src`:
1) Install dependencies (only once): `npm install`
2) Build (base path is preconfigured): `npm run build`

## Deploy the build here
From the repo root (`Moe-Zbeeb.github.io`):
1) Clear the old build: `rm -rf lab/eece490/*`
2) Copy the new build output: `cp -R lab/eece490-src/dist/* lab/eece490/`
3) Copy backgrounds alongside it: `cp -R lab/eece490-src/background lab/eece490/background`

After these steps, visiting `/lab/eece490/` will serve the updated course page.
