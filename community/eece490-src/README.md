# AUB Introduction to Machine Learning — Landing Page

React + Tailwind single-page landing site for the American University of Beirut course, inspired by MIT's 6.S191 page.

## Structure
- `src/App.jsx` — page composition and data wiring
- `src/components/` — modular UI sections (Hero, Navbar, Overview, Schedule, Team, FAQ)
- `src/data/` — editable content for schedule, team, and FAQs
- `background/` — provided assets (hero rotation + logo)

## Getting Started
1. Install dependencies: `npm install`
2. Run locally: `npm run dev` (base path is configured for `/community/eece490/`)
3. Build for production: `npm run build`

Update the image list in `src/App.jsx` if you add or rename background images. Team photos are optional; when omitted, initials render automatically.
