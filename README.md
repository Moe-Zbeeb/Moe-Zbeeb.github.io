# EECE490 Course Page Maintenance

This repository hosts the deployed static output for the EECE490 course page under `lab/eece490/`. The editable source lives in the React/Tailwind project located at `../EECEwebsite`.

## Edit the course content
- Open `../EECEwebsite/src` to update components, text, or assets.
- Background images live in `../EECEwebsite/background/`; add or replace files there.

## Build the static site
From the `../EECEwebsite` directory:
1) Install dependencies (only once): `npm install`
2) Build with the correct base path: `npm run build -- --base=/lab/eece490/`

## Deploy the build here
From this repo root (`Moe-Zbeeb.github.io`):
1) Clear the old build: `rm -rf lab/eece490/*`
2) Copy the new build output: `cp -R ../EECEwebsite/dist/* lab/eece490/`
3) Copy backgrounds alongside it: `cp -R ../EECEwebsite/background lab/eece490/background`
4) Update asset references so backgrounds load from the scoped path:
   `node -e "const p='lab/eece490/assets/index-DNNJmlx5.js';const fs=require('fs');fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/\\/background\\//g,'/lab/eece490/background/'));"`

After these steps, visiting `/lab/eece490/` will serve the updated course page.
