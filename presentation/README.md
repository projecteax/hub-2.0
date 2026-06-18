# Hub 2.0 Case Study Presentation

Interactive deck for the NewtonX Staff PM final-round case study.

## Quick start

From the **repo root**:

```bash
npm run presentation:dev
```

Or from this folder:

```bash
npm install
npm run dev
```

Open **http://localhost:5173/presentation/**

## Production URL

Shipped with the Hub app on Vercel:

**https://hub-2-0.vercel.app/presentation/**

The root `npm run build` builds the deck into `public/presentation/` before Next.js.

Optional env (set in Vercel at build time):

```env
VITE_POC_URL=https://hub-2-0.vercel.app
```

## Screenshots

Drop PNGs into `public/screenshots/` — see that folder's README.

## Controls

| Key | Action |
|-----|--------|
| `→` / `Space` | Next |
| `←` | Previous |
| `F` | Fullscreen |

## Slides (20)

Feedback synthesis · product plan · roadmap · cross-functional · prototype.

Edit content in `src/slides.ts`.
