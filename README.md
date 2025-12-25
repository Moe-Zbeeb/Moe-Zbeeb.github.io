# EECE490 Course Page Maintenance

This repository hosts the deployed static output for the EECE490 course page under `community/eece490/`. The editable React/Tailwind source now lives inside this repo at `community/eece490-src/`.

## Edit the course content
- Open `community/eece490-src/src` to update components, text, or assets.
- Background images live in `community/eece490-src/background/`; add or replace files there.

## Build the static site
From `community/eece490-src`:
1) Install dependencies (only once): `npm install`
2) Build (base path is preconfigured): `npm run build`

## Deploy the build here
From the repo root (`Moe-Zbeeb.github.io`):
1) Clear the old build: `rm -rf community/eece490/*`
2) Copy the new build output: `cp -R community/eece490-src/dist/* community/eece490/`
3) Copy backgrounds alongside it: `cp -R community/eece490-src/background community/eece490/background`

After these steps, visiting `/community/eece490/` will serve the updated course page.
