# RepositoryExplorer

Reusable compact repository map for Docusaurus and Docucraft.
A project passes a tree of folders/files and optional relations, and the component renders:

- compact solution-explorer style tree,
- detail panel for the selected node,
- SVG file/folder icons inferred from `kind` or file extension,
- optional relation graph and relation list.

## Public API

```tsx
import {RepositoryExplorer, type RepositorySection} from 'docucraft';

const sections: RepositorySection[] = [
  {
    title: 'Application',
    root: {
      name: 'src',
      type: 'folder',
      shortDescription: 'Source code.',
      children: [
        {
          name: 'IClient.ts',
          type: 'file',
          kind: 'interface',
          shortDescription: 'Client contract.',
          relations: [{target: 'src/Client.ts', label: 'implemented by', type: 'implements'}],
        },
        {
          name: 'Client.ts',
          type: 'file',
          kind: 'implementation',
          shortDescription: 'Client implementation.',
        },
      ],
    },
  },
];

export default function RepositoryPage() {
  return <RepositoryExplorer sections={sections} initialExpandedDepth={2} />;
}
```

## Node Shape

```ts
type RepositoryNode = {
  id?: string;
  name: string;
  type: 'folder' | 'file';
  kind?: RepositoryNodeKind;
  shortDescription: string;
  longDescription?: string;
  path?: string;
  children?: RepositoryNode[];
  relations?: RepositoryRelation[];
  defaultExpanded?: boolean;
};
```

Use `path` when possible. Relation targets can point to `id`, `path`, normalized `path` without a trailing slash, or `name`. For reusable docs, `path` is the clearest target because it stays readable and unique.

## Intuitive Defaults

- Use `sections` for larger repositories.
- Use `root` for a single small repository tree.
- Keep the tree concise: put descriptions in `shortDescription` and `longDescription`, not in node names.
- Add only important relations, usually 2-5 per node.
- Override `labels` when the documentation is not Czech.

```tsx
<RepositoryExplorer
  sections={sections}
  labels={{
    relationsTitle: 'Relations',
    noRelations: 'No relations described.',
    emptySelection: 'Select a file or folder.',
    sectionItemCount: (count) => `${count} items`,
  }}
/>
```