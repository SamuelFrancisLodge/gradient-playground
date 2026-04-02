# Gradient Playground

Interactive gradient design studio built with Next.js, React, TypeScript, and Tailwind CSS.

Gradient Playground lets you build animated orb-gradient scenes with reusable presets, deterministic seeds, and a layered effects pipeline. It is designed for fast exploration first and precision tuning second.

## Highlights

- Preset groups for Style, Gradient, Seed, Layout, and Motion.
- Deep effect controls grouped by Core FX, Advanced FX, and Depth and Styling.
- Deterministic seed workflow for reproducible outputs.
- Gradient swatch editor with:
  - hex color editing
  - per-swatch enable toggle
  - ratio slider and typed percentage input
  - ratio locks with guardrailed rebalance behavior
- Light and dark control menu tones with smooth transitions and persistence.
- Two-level help UX:
  - tooltips for short action hints
  - optional concept guide side menu for deeper explanations

## Why this project exists

Many gradient tools are either too basic or too technical. This studio bridges that gap:

- fast enough for creative exploration
- precise enough for deterministic visual systems
- structured enough for repeatable team workflows

## Demo workflow

1. Pick a Style preset to establish the visual mood.
2. Select a Gradient preset or build custom swatches.
3. Tune Layout and Motion for composition and energy.
4. Add effects in layers, starting with Core FX.
5. Lock seed and save custom presets for reproducible variants.

## Help model: tooltip vs concept guide

The studio now uses a split help pattern:

- Use tooltips for small, immediate hints.
  - Example: what a single button click does.
- Use the Concept Guide side menu for deeper topics.
  - Example: locked gradient ratios, deterministic seeds, effect stacking strategy, and performance tuning.

This keeps the control surface lightweight while still supporting detailed learning in-context.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- SVG rendering and filter composition

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+ (or compatible package manager)

### Install

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project structure

Main files and folders:

- `src/app/`
  - app shell and global CSS
- `src/components/gradient-sandbox.tsx`
  - primary studio UI and control layout
- `src/components/gradient-studio/constants.ts`
  - preset catalogs and defaults
- `src/components/gradient-studio/hooks/use-gradient-studio.ts`
  - studio state, preset application, palette lock logic
- `src/components/gradient-studio/components/`
  - control primitives and palette editor
- `src/components/orb-gradient-field.tsx`
  - renderer entry for orb scene
- `src/components/orb-field/`
  - low-level shape and filter rendering helpers

## Core concepts

### Preset groups

- Style: high-level visual identity.
- Gradient: palette and color direction.
- Seed: repeatability and token strategy.
- Layout: density and radius structure.
- Motion: animation behavior and speed profile.

### Effect groups

- Core FX: blur, glow, noise.
- Advanced FX: warp, metaball, bloom, posterize, caustic.
- Depth and Styling: depth, fringe, sweep, hue rotate, vignette, palette drift.

### Determinism

When deterministic seed lock is enabled, the same seed token reproduces the same scene geometry and motion pattern for a given configuration. This is useful for versioning, review links, and art direction consistency.

### Gradient ratio locks

Locked swatches keep their ratio while unlocked swatches redistribute the remainder. This makes it easier to protect key anchor colors while iterating on supporting tones.

## Performance notes

- Heavy combinations of blur, warp, metaball, and stylizers can increase render cost.
- Start from lighter presets and scale up selectively.
- Keep circle count and blur values proportionate to target device performance.

## Accessibility and UX notes

- Tooltips are intentionally short and action-specific.
- Concept Guide is optional and can be toggled on demand.
- Light mode uses warm off-white surfaces to reduce visual harshness.
- Status messaging communicates lock and rebalance edge cases clearly.

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run lint and build locally.
4. Open a pull request with screenshots for UI changes.

## License

Add your preferred project license here.
