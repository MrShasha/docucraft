import React from 'react';
import type {RepositoryNode, RepositoryNodeKind} from './index.js';
import styles from './styles.module.css';

export type RepositoryIconKind =
  | 'folder'
  | 'implementation'
  | 'interface'
  | 'code'
  | 'dto'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'text'
  | 'markdown'
  | 'image'
  | 'video'
  | 'audio'
  | 'pgm'
  | 'rosMsg'
  | 'config'
  | 'test'
  | 'docs'
  | 'script'
  | 'package'
  | 'project'
  | 'solution'
  | 'lock'
  | 'database'
  | 'archive'
  | 'dependency'
  | 'file';

const kindMap: Record<RepositoryNodeKind, RepositoryIconKind> = {
  folder: 'folder',
  file: 'file',
  interface: 'interface',
  implementation: 'implementation',
  code: 'code',
  dto: 'dto',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  text: 'text',
  markdown: 'markdown',
  image: 'image',
  video: 'video',
  audio: 'audio',
  pgm: 'pgm',
  rosMsg: 'rosMsg',
  config: 'config',
  source: 'implementation',
  dependency: 'dependency',
  test: 'test',
  asset: 'file',
  docs: 'docs',
  script: 'script',
  package: 'package',
  project: 'project',
  solution: 'solution',
  lock: 'lock',
  database: 'database',
  archive: 'archive',
};

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.ico', '.bmp', '.tif', '.tiff']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']);
const audioExtensions = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']);
const archiveExtensions = new Set(['.zip', '.7z', '.rar', '.tar', '.gz']);
const codeExtensions = new Set(['.cs', '.ts', '.tsx', '.js', '.jsx', '.py', '.ps1', '.sh', '.css', '.scss', '.html']);

function getExtension(name: string) {
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot).toLowerCase() : '';
}

export function getRepositoryIconKind(node: RepositoryNode): RepositoryIconKind {
  if (node.type === 'folder') {
    return 'folder';
  }

  if (node.kind && node.kind in kindMap && !['file', 'source', 'asset', 'config', 'script'].includes(node.kind)) {
    return kindMap[node.kind];
  }

  const name = node.name.toLowerCase();
  const path = node.path?.toLowerCase() ?? '';
  const extension = getExtension(path || name);

  if (name.endsWith('.sln') || path.endsWith('.sln')) return 'solution';
  if (name.endsWith('.csproj') || path.endsWith('.csproj')) return 'project';
  if (name.includes('package.json')) return 'package';
  if (name.includes('package-lock') || name.endsWith('.lock')) return 'lock';
  if (name.endsWith('.json') || path.endsWith('.json')) return 'json';
  if (name.endsWith('.xml') || path.endsWith('.xml')) return 'xml';
  if (name.endsWith('.yaml') || name.endsWith('.yml') || path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
  if (name.endsWith('.txt') || path.endsWith('.txt')) return 'text';
  if (name.endsWith('.md') || name.endsWith('.mdx') || path.endsWith('.md') || path.endsWith('.mdx')) return 'markdown';
  if (name.endsWith('.pgm') || path.endsWith('.pgm')) return 'pgm';
  if (name.endsWith('.msg') || path.endsWith('.msg')) return 'rosMsg';
  if (imageExtensions.has(extension)) return 'image';
  if (videoExtensions.has(extension)) return 'video';
  if (audioExtensions.has(extension)) return 'audio';
  if (archiveExtensions.has(extension)) return 'archive';
  if (name.includes('dto') || name.endsWith('messages.cs') || name.endsWith('metadata.cs')) return 'dto';
  if (name.startsWith('i') && name.endsWith('.cs')) return 'interface';
  if (codeExtensions.has(extension)) return node.kind === 'script' ? 'script' : 'code';

  return kindMap[node.kind ?? 'file'];
}

function FileFrame({children}: {children: React.ReactNode}) {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path className={styles.iconPage} d="M6 2.75h8.2L19 7.55v13.7H6z" />
      <path className={styles.iconFold} d="M14.2 2.75v4.8H19z" />
      {children}
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path className={styles.iconFolderBack} d="M2.8 6.4h7.05l1.75 2h9.6v10.9H2.8z" />
      <path className={styles.iconFolderFront} d="M2.8 8.4h18.4l-1.45 10.9H4.25z" />
    </svg>
  );
}

function CodeMark({label}: {label: string}) {
  return (
    <>
      <path className={styles.iconAccentStroke} d="M10 10.1 7.4 12.4 10 14.7M14 10.1l2.6 2.3-2.6 2.3" />
      <text className={styles.iconText} x="12" y="20">
        {label}
      </text>
    </>
  );
}

const iconRenderers: Record<RepositoryIconKind, () => React.ReactNode> = {
  folder: () => <FolderIcon />,
  implementation: () => <FileFrame><CodeMark label="IM" /></FileFrame>,
  interface: () => <FileFrame><CodeMark label="IF" /></FileFrame>,
  code: () => <FileFrame><CodeMark label="C" /></FileFrame>,
  dto: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10h8M8 13h8M8 16h5" /><text className={styles.iconText} x="12" y="20">DTO</text></FileFrame>,
  json: () => <FileFrame><path className={styles.iconAccentStroke} d="M10 9.5H8.8c-.8 0-1.3.5-1.3 1.3v1.1c0 .7-.4 1.1-1 1.1.6 0 1 .4 1 1.1v1.1c0 .8.5 1.3 1.3 1.3H10M14 9.5h1.2c.8 0 1.3.5 1.3 1.3v1.1c0 .7.4 1.1 1 1.1-.6 0-1 .4-1 1.1v1.1c0 .8-.5 1.3-1.3 1.3H14" /><text className={styles.iconText} x="12" y="20">JSON</text></FileFrame>,
  xml: () => <FileFrame><path className={styles.iconAccentStroke} d="M10.2 9.8 7.5 12.5l2.7 2.7M13.8 9.8l2.7 2.7-2.7 2.7" /><text className={styles.iconText} x="12" y="20">XML</text></FileFrame>,
  yaml: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10h8M8 13h5M8 16h7" /><text className={styles.iconText} x="12" y="20">YML</text></FileFrame>,
  text: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10h8M8 12.8h8M8 15.6h6" /><text className={styles.iconText} x="12" y="20">TXT</text></FileFrame>,
  markdown: () => <FileFrame><path className={styles.iconAccentStroke} d="M7.5 15.5v-5l2.1 2.4 2.1-2.4v5M14 10.5v5M14 15.5l2-2M14 15.5l-2-2" /><text className={styles.iconText} x="12" y="20">MD</text></FileFrame>,
  image: () => <FileFrame><circle className={styles.iconAccentFill} cx="9.1" cy="10.2" r="1.2" /><path className={styles.iconAccentStroke} d="M7.5 16.5 10.4 13l1.8 2 1.5-1.7 2.8 3.2z" /><text className={styles.iconText} x="12" y="20">IMG</text></FileFrame>,
  video: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10h5.6v5H8zM13.6 11.3l2.9-1.5v5.4l-2.9-1.5z" /><text className={styles.iconText} x="12" y="20">VID</text></FileFrame>,
  audio: () => <FileFrame><path className={styles.iconAccentStroke} d="M9.1 15.8a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM10.8 14.1V9.4l4.6-.9v4.6" /><text className={styles.iconText} x="12" y="20">AUD</text></FileFrame>,
  pgm: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 16V9h3.2c1.6 0 2.6 1 2.6 2.3S12.8 13.6 11.2 13.6H8M14.2 13.3h2.3v2.2c-.5.4-1.2.6-2 .6-1.9 0-3.1-1.4-3.1-3.3" /><text className={styles.iconText} x="12" y="20">PGM</text></FileFrame>,
  rosMsg: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10.3h8M8 13h8M8 15.7h8" /><circle className={styles.iconAccentFill} cx="7" cy="10.3" r=".7" /><circle className={styles.iconAccentFill} cx="7" cy="13" r=".7" /><circle className={styles.iconAccentFill} cx="7" cy="15.7" r=".7" /><text className={styles.iconText} x="12" y="20">MSG</text></FileFrame>,
  config: () => <FileFrame><path className={styles.iconAccentStroke} d="M12 9.2v1.3M12 15.5v1.3M9.3 10.7l.9.9M13.8 15.2l.9.9M8.2 13h1.3M14.5 13h1.3M9.3 15.3l.9-.9M13.8 10.8l.9-.9" /><circle className={styles.iconAccentStrokeOnly} cx="12" cy="13" r="2.1" /><text className={styles.iconText} x="12" y="20">CFG</text></FileFrame>,
  test: () => <FileFrame><path className={styles.iconAccentStroke} d="M9.3 9.3v3.2l-2.1 3.8h9.6l-2.1-3.8V9.3M8.5 9.3h7" /><text className={styles.iconText} x="12" y="20">TST</text></FileFrame>,
  docs: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 9.5h8M8 12h8M8 14.5h5" /><text className={styles.iconText} x="12" y="20">DOC</text></FileFrame>,
  script: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10.5 10.8 13 8 15.5M12 15.5h4" /><text className={styles.iconText} x="12" y="20">RUN</text></FileFrame>,
  package: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10.5 12 8.4l4 2.1v4.9l-4 2.1-4-2.1zM8 10.5l4 2.1 4-2.1M12 12.6v4.9" /><text className={styles.iconText} x="12" y="20">PKG</text></FileFrame>,
  project: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 9.5h8v7H8zM10 11.5h4M10 14h4" /><text className={styles.iconText} x="12" y="20">PRJ</text></FileFrame>,
  solution: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 9.5h3v3H8zM13 9.5h3v3h-3zM8 14h3v3H8zM13 14h3v3h-3z" /><text className={styles.iconText} x="12" y="20">SLN</text></FileFrame>,
  lock: () => <FileFrame><path className={styles.iconAccentStroke} d="M8.5 12h7v4.8h-7zM10 12v-1.6a2 2 0 0 1 4 0V12" /><text className={styles.iconText} x="12" y="20">LCK</text></FileFrame>,
  database: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10.2c0-1 1.8-1.8 4-1.8s4 .8 4 1.8v5.1c0 1-1.8 1.8-4 1.8s-4-.8-4-1.8zM8 10.2c0 1 1.8 1.8 4 1.8s4-.8 4-1.8M8 12.8c0 1 1.8 1.8 4 1.8s4-.8 4-1.8" /><text className={styles.iconText} x="12" y="20">DB</text></FileFrame>,
  archive: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 9h8v8H8zM10 9v8M8 11h2M8 13h2M8 15h2" /><text className={styles.iconText} x="12" y="20">ZIP</text></FileFrame>,
  dependency: () => <FileFrame><circle className={styles.iconAccentStrokeOnly} cx="9" cy="10.5" r="1.5" /><circle className={styles.iconAccentStrokeOnly} cx="15" cy="15.5" r="1.5" /><path className={styles.iconAccentStroke} d="M10.3 11.5 13.7 14.5" /><text className={styles.iconText} x="12" y="20">DEP</text></FileFrame>,
  file: () => <FileFrame><path className={styles.iconAccentStroke} d="M8 10h8M8 13h8M8 16h5" /></FileFrame>,
};

export default function RepositoryIcon({node}: {node: RepositoryNode}) {
  const iconKind = getRepositoryIconKind(node);
  return <span className={`${styles.icon} ${styles[`icon-${iconKind}`]}`}>{iconRenderers[iconKind]()}</span>;
}
