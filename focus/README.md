# Focus Lens

Focus Lens is a fully static, in-browser weekly action dashboard for a researcher. It persists data in `localStorage` and resets automatically when a new ISO week starts (timezone: `Asia/Beirut`).

## Features

- Six default directions (columns) on first load
- Add tickets by typing and pressing Enter in a direction
- Drag and drop tickets within and across directions
- Reorder directions by dragging column headers
- Mark tickets done; done items collapse under a `Done (N)` section
- Remove tickets with the `Remove` button
- Focus Panel shows top 5 immediate actions (Today first, then oldest first)
- Search filters tickets by title, note, and link
- Export/Import JSON
- Weekly auto-cleanup with archive saved in `localStorage`
- Keyboard shortcuts:
  - `n`: open global quick add
  - `Esc`: close quick add

## Local Development

Open `focus/index.html` in a browser.

If your browser blocks some behaviors for `file://` URLs, run a local static server:

```bash
python3 -m http.server
```

Then visit:

- `http://localhost:8000/focus/`

## Deploy To GitHub Pages

This app is static and is meant to be served from:

- `/focus/`

If GitHub Pages is configured for this repo, the app will be available at:

- `https://moe-zbeeb.github.io/focus/`
