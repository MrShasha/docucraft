# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-04-16

### Added
- New `ClassGraph` component for interactive DTO/class relationship visualization.
- Public exports for `ClassGraph` and related types from the package root.
- Subpath export `docucraft/class-graph`.
- Runtime dependencies for ClassGraph rendering and layout:
  - `@xyflow/react`
  - `@dagrejs/dagre`

### Changed
- Bumped package version to `1.1.0`.
- Updated README with ClassGraph usage examples, project structure, and API documentation.
- Updated type declarations to support `@docusaurus/BrowserOnly` and side-effect CSS imports.

### Fixed
- ClassGraph styling now uses CSS Modules correctly.
- ClassGraph UI fallback and empty-state texts are in English.
