# Docucraft

![Docucraft](/banner.png)

Docucraft is an open source React component library focused on reusable UI building blocks for Docusaurus projects.

Created and maintained by Jiří Šašek.

## Current components

- `MermaidDiagram`: interactive Mermaid wrapper with zoom, pan, fullscreen, SVG export, and PNG export.

## Project structure

```text
src/
  index.ts
  components/
    MermaidDiagram/
      index.tsx
      styles.module.css
```

Conventions:

- Every component lives in its own folder under `src/components/<ComponentName>/`.
- Component folder contains `index.tsx` and optional `styles.module.css`.
- Public exports are centralized in `src/index.ts`.
- Consumers should only import from package entrypoints, not from `dist/...` deep paths.

## Why Docucraft

- Built specifically for Docusaurus workflows.
- Designed for long-term reuse across multiple documentation projects.
- Includes type-safe APIs and publish-ready npm packaging.

## Installation

```bash
npm install docucraft
```

## Docusaurus setup

In `docusaurus.config.ts` ensure Mermaid support is enabled:

```ts
export default {
  markdown: { mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],
};
```

## Usage

```mdx
import {MermaidDiagram} from 'docucraft';

<MermaidDiagram
  definition={String.raw`flowchart TB
A[Start] --> B[Done]`}
  exportFileName="my-diagram"
  hintText="Zoom: wheel. Pan: drag. Reset: double click."
/>
```

## Adding a new component

1. Create folder: `src/components/YourComponent/`.
2. Add implementation: `src/components/YourComponent/index.tsx`.
3. Add local styles (optional): `src/components/YourComponent/styles.module.css`.
4. Export component from `src/index.ts`.
5. Update README with API and usage snippet.
6. Run:

```bash
npm run typecheck
npm run build
npm run pack:check
```

## API

### MermaidDiagram props

- `definition: string` Mermaid source code.
- `className?: string` Additional class on the root wrapper.
- `ariaLabel?: string` Accessibility label for viewport.
- `minScale?: number` Minimum zoom (default `0.6`).
- `maxScale?: number` Maximum zoom (default `4`).
- `zoomStep?: number` Zoom increment (default `0.12`).
- `showHint?: boolean` Show or hide hint row (default `true`).
- `hintText?: string` Custom hint text.
- `exportFileName?: string` File name prefix for exports (default `diagram`).
- `enableFullscreen?: boolean` Show fullscreen action (default `true`).
- `enableExport?: boolean` Show export action (default `true`).

## Development

```bash
npm install
npm run typecheck
npm run build
npm run pack:check
```

## Publish checklist

1. Update `version` in `package.json`.
2. Run `npm run typecheck`.
3. Run `npm run build`.
4. Run `npm run pack:check`.
5. Push to GitHub repository.
6. Log in to npm: `npm login`.
7. Publish: `npm publish --access public`.

## Licensing and attribution

This project is licensed under the MIT License.

Copyright (c) Jiří Šašek.

When redistributing this software, keep the copyright notice and license text.
