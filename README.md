# smart-foundation.github.io

Source for the Smart Foundation website, published at:

**https://smart-foundation.github.io**

## Development

```bash
bun install
bun run dev
```

## Build & deploy

```bash
bun run build
```

The build is a single self-contained `docs/index.html` (Vite + `vite-plugin-singlefile`).
GitHub Pages serves the `main` branch from the `/docs` folder, so committing the
regenerated `docs/` directory is all that is needed to deploy.
