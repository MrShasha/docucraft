# Contributing to Docucraft

Thanks for your interest in contributing.

## Development workflow

1. Fork the repository.
2. Create a feature branch.
3. Run:

```bash
npm install
npm run typecheck
npm run build
npm run pack:check
```

4. Open a pull request with a clear summary.

## Scope

Docucraft accepts reusable React components focused on Docusaurus ecosystems.

## Coding guidelines

- TypeScript strict mode.
- Keep public props documented.
- Include accessibility labels for interactive controls.
- Avoid project-specific business logic.

## Component library conventions

- Create each component in `src/components/<ComponentName>/`.
- Use `index.tsx` as the component entry file.
- Keep styles local in `styles.module.css` when possible.
- Export every public component and type from `src/index.ts`.
- Do not rely on internal deep imports from `dist/...`.

## Pull request checklist

1. New component follows folder convention.
2. Public exports were updated in `src/index.ts`.
3. README includes usage/API updates.
4. `npm run typecheck` passes.
5. `npm run build` passes.
6. `npm run pack:check` confirms expected publish files.

## Attribution

Please do not remove author and license attribution from existing files.
