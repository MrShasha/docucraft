import type {RepositorySection} from './index.js';

export const repositoryExplorerExampleSections: RepositorySection[] = [
  {
    title: 'Example project',
    description: 'A small language-agnostic example for RepositoryExplorer.',
    root: {
      id: 'example-project',
      name: 'example-project',
      type: 'folder',
      kind: 'folder',
      path: 'example-project/',
      shortDescription: 'Example repository root.',
      longDescription: 'This root node shows how to describe a repository without coupling the component to a specific language or framework.',
      defaultExpanded: true,
      children: [
        {
          name: 'src',
          type: 'folder',
          kind: 'folder',
          path: 'example-project/src/',
          shortDescription: 'Application source code.',
          longDescription: 'The source folder groups implementation code, interfaces and DTOs that make up the application runtime.',
          children: [
            {
              name: 'IMessageBus.ts',
              type: 'file',
              kind: 'interface',
              path: 'example-project/src/IMessageBus.ts',
              shortDescription: 'Message bus contract.',
              longDescription: 'Defines the public contract used by services that publish or subscribe to application messages.',
              relations: [
                {
                  target: 'example-project/src/MessageBus.ts',
                  label: 'implemented by',
                  type: 'implements',
                },
              ],
            },
            {
              name: 'MessageBus.ts',
              type: 'file',
              kind: 'implementation',
              path: 'example-project/src/MessageBus.ts',
              shortDescription: 'Message bus implementation.',
              longDescription: 'Implements the message bus contract and coordinates message delivery between independent modules.',
              relations: [
                {
                  target: 'example-project/src/IMessageBus.ts',
                  label: 'implements',
                  type: 'implements',
                },
                {
                  target: 'example-project/src/dto/MessageDto.ts',
                  label: 'uses DTO',
                  type: 'uses',
                },
              ],
            },
            {
              name: 'dto',
              type: 'folder',
              kind: 'dto',
              path: 'example-project/src/dto/',
              shortDescription: 'Data transfer objects.',
              longDescription: 'DTOs describe the shape of data exchanged between modules and integration boundaries.',
              children: [
                {
                  name: 'MessageDto.ts',
                  type: 'file',
                  kind: 'dto',
                  path: 'example-project/src/dto/MessageDto.ts',
                  shortDescription: 'Message payload DTO.',
                  longDescription: 'A small data object used by the message bus and API layer.',
                },
              ],
            },
          ],
        },
        {
          name: 'package.json',
          type: 'file',
          kind: 'package',
          path: 'example-project/package.json',
          shortDescription: 'Package manifest.',
          longDescription: 'Defines scripts and runtime dependencies for the example project.',
          relations: [
            {
              target: 'example-project/src/MessageBus.ts',
              label: 'builds source code',
              type: 'configures',
            },
          ],
        },
      ],
    },
  },
];
