# Docucraft

![Docucraft banner](./banner.png)

**An open-source React component library for technical documentation built with Docusaurus.**

The goal is simple: keep docs readable for humans while still making complex systems explorable.

---

## Why Docucraft Exists

I'm [Jiří Šašek](https://github.com/MrShasha), a software developer from the Czech Republic working in system design, integrations, fullstack, and game development.

I learn best when there are visuals. Sites like [Refactoring Guru](https://refactoring.guru) are a masterclass in technical writing — they prove that even the most abstract patterns become clear once you pair them with a good diagram. Plain-text-only documentation makes me work significantly harder just to build a mental model that a single interactive graph could hand me in seconds.

That frustration is what started this project. I wanted Docusaurus docs that go beyond Markdown — docs with zoomable diagrams, explorable class graphs, and navigable repository maps — without requiring a separate diagramming tool or manual image exports for every update.

Docucraft gives you that. You describe your data, and the components do the rendering.

---

## What You Get

| Component | What it does |
|-----------|-------------|
| [`MermaidDiagram`](src/components/MermaidDiagram/README.md) | Docusaurus Mermaid wrapper with zoom, pan, fullscreen, SVG export, and PNG export. |
| [`ClassDiagram`](src/components/ClassDiagram/README.md) | Interactive DTO/class relationship graph with focus, full, and inline modes. |
| [`RepositoryExplorer`](src/components/RepositoryExplorer/README.md) | Compact repository tree with file/folder icons, a detail panel, and optional relation graph. |

---

## Quick Start

```bash
npm install docucraft
```

Docucraft expects React and Docusaurus in your project. Most Docusaurus projects already have these.

```bash
npm install react react-dom @docusaurus/core @docusaurus/theme-mermaid
```

Enable Mermaid in `docusaurus.config.ts`:

```ts
export default {
  markdown: {mermaid: true},
  themes: ['@docusaurus/theme-mermaid'],
};
```

Then drop a component into any `.mdx` page:

```mdx
import {MermaidDiagram, ClassDiagram, RepositoryExplorer} from 'docucraft';

<MermaidDiagram
  definition={String.raw`flowchart LR
    API --> Service --> Database
  `}
  ariaLabel="Service layer overview"
/>
```

Subpath imports work too:

```ts
import MermaidDiagram from 'docucraft/mermaid';
import ClassDiagram from 'docucraft/class-diagram';
import RepositoryExplorer from 'docucraft/repository-explorer';
```

---

## Component Docs

Each component has its own README with full props, model shapes, and examples:

- [MermaidDiagram →](src/components/MermaidDiagram/README.md)
- [ClassDiagram →](src/components/ClassDiagram/README.md)
- [RepositoryExplorer →](src/components/RepositoryExplorer/README.md)

---

## Project Structure

```text
src/
  index.ts
  components/
    ClassDiagram/
    MermaidDiagram/
    RepositoryExplorer/
```

- Every component lives in `src/components/<ComponentName>/`.
- Public exports are centralized in `src/index.ts`.
- CSS modules are copied into `dist` during build.
- Import from package entrypoints, not from `dist/...` deep paths.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run pack:check
```

Build output is written to `dist/`.

## Adding a Component

1. Create `src/components/YourComponent/`.
2. Add `index.tsx` and, if needed, `styles.module.css`.
3. Export the component and its public types from `src/index.ts`.
4. Add a package subpath export in `package.json` if direct imports should be supported.
5. Add a `README.md` inside the component folder with props, model shapes, and an example.
6. Run the full prepublish checks.

## Prepublish Checklist

```bash
npm run typecheck
npm run build
npm run pack:check
git diff --check
git status --short
```

Also verify:

- `package.json` version is new and matches the intended release.
- `CHANGELOG.md` describes the release.
- `npm pack --dry-run` includes the expected files only.
- No generated tarball or local test artifact is committed.

Publish:

```bash
npm login
npm publish --access public
git tag vX.Y.Z
git push origin main --tags
```

---

## Get Involved

Good documentation tooling is a community effort. If you find Docucraft useful, have an idea for a new component, or just want to share how you're using it:

- **Open an issue** to report a bug or suggest a feature.
- **Start a discussion** on the GitHub Discussions tab — I'd love to hear what kinds of docs you're building and what's missing.
- **Open a pull request** — contributions are very welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT. See [LICENSE](./LICENSE).

Copyright (c) Jiří Šašek.
