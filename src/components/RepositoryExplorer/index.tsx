import React, {useEffect, useMemo, useState} from 'react';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import RepositoryIcon from './RepositoryIcon.js';
import styles from './styles.module.css';

export type RepositoryNodeType = 'folder' | 'file';

export type RepositoryNodeKind =
  | 'folder'
  | 'file'
  | 'interface'
  | 'implementation'
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
  | 'source'
  | 'dependency'
  | 'test'
  | 'asset'
  | 'docs'
  | 'script'
  | 'package'
  | 'project'
  | 'solution'
  | 'lock'
  | 'database'
  | 'archive';

export type RepositoryRelationType =
  | 'implements'
  | 'calls'
  | 'depends-on'
  | 'uses'
  | 'publishes'
  | 'reads'
  | 'hosts'
  | 'configures'
  | 'tests';

export type RepositoryRelation = {
  target: string;
  label: string;
  type?: RepositoryRelationType;
  description?: string;
  external?: boolean;
};

export type RepositoryNode = {
  id?: string;
  name: string;
  type: RepositoryNodeType;
  kind?: RepositoryNodeKind;
  shortDescription: string;
  longDescription?: string;
  path?: string;
  children?: RepositoryNode[];
  relations?: RepositoryRelation[];
  defaultExpanded?: boolean;
};

export type RepositorySection = {
  title: string;
  description?: string;
  root: RepositoryNode;
};

export type RepositoryExplorerLabels = {
  collapseNode: (name: string) => string;
  expandNode: (name: string) => string;
  emptySelection: string;
  graphFallback: string;
  noRelations: string;
  relationsTitle: string;
  sectionItemCount: (count: number) => string;
};

export type RepositoryExplorerProps = {
  sections?: RepositorySection[];
  root?: RepositoryNode;
  initialExpandedDepth?: number;
  showSectionDescriptions?: boolean;
  labels?: Partial<RepositoryExplorerLabels>;
};

type NodeIndex = Map<string, RepositoryNode>;

const defaultLabels: RepositoryExplorerLabels = {
  collapseNode: (name) => `Sbalit ${name}`,
  expandNode: (name) => `Rozbalit ${name}`,
  emptySelection: 'Vyber položku ve stromu repozitáře.',
  graphFallback: 'Graf vztahů se načte v prohlížeči.',
  noRelations: 'Tato položka nemá popsané vztahy.',
  relationsTitle: 'Vztahy',
  sectionItemCount: (count) => `${count} položek`,
};

function nodeKey(node: RepositoryNode, parentKey = 'root'): string {
  return node.id ?? `${parentKey}/${node.name}`;
}

function collectNodes(node: RepositoryNode, index: NodeIndex, parentKey?: string) {
  const key = nodeKey(node, parentKey);
  index.set(key, node);
  index.set(node.name, node);
  if (node.path) {
    index.set(node.path.replace(/\/$/, ''), node);
    index.set(node.path, node);
  }
  node.children?.forEach((child) => collectNodes(child, index, key));
}

function buildInitialExpanded(node: RepositoryNode, depth: number, parentKey?: string) {
  const expanded: Record<string, boolean> = {};
  const key = nodeKey(node, parentKey);
  expanded[key] = node.defaultExpanded ?? depth > 0;

  node.children?.forEach((child) => {
    Object.assign(expanded, buildInitialExpanded(child, depth - 1, key));
  });

  return expanded;
}

function TreeNode({
  node,
  depth,
  parentKey,
  expanded,
  selectedKey,
  onToggle,
  onSelect,
  labels,
}: {
  node: RepositoryNode;
  depth: number;
  parentKey?: string;
  expanded: Record<string, boolean>;
  selectedKey?: string;
  onToggle: (key: string) => void;
  onSelect: (key: string) => void;
  labels: RepositoryExplorerLabels;
}) {
  const key = nodeKey(node, parentKey);
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded[key] ?? false;

  return (
    <li className={styles.treeItem}>
      <div
        className={`${styles.nodeRow} ${selectedKey === key ? styles.nodeRowActive : ''}`}
        style={{'--node-depth': depth} as React.CSSProperties}>
        <button
          className={styles.toggle}
          type="button"
          onClick={() => hasChildren && onToggle(key)}
          disabled={!hasChildren}
          aria-label={isExpanded ? labels.collapseNode(node.name) : labels.expandNode(node.name)}>
          {hasChildren ? (isExpanded ? '-' : '+') : ''}
        </button>
        <RepositoryIcon node={node} />
        <button className={styles.nodeTitle} type="button" title={node.shortDescription} onClick={() => onSelect(key)}>
          {node.name}
        </button>
      </div>

      {hasChildren && (
        <div className={`${styles.childrenWrap} ${isExpanded ? styles.childrenWrapOpen : ''}`}>
          <ul className={styles.treeList}>
            {node.children?.map((child) => (
              <TreeNode
                key={nodeKey(child, key)}
                node={child}
                depth={depth + 1}
                parentKey={key}
                expanded={expanded}
                selectedKey={selectedKey}
                onToggle={onToggle}
                onSelect={onSelect}
                labels={labels}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function RelationGraph({selected, index, labels}: {selected?: RepositoryNode; index: NodeIndex; labels: RepositoryExplorerLabels}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {nodes, edges} = useMemo(() => {
    if (!selected?.relations?.length) {
      return {nodes: [], edges: []};
    }

    const center: Node = {
      id: 'selected',
      position: {x: 0, y: 110},
      data: {label: selected.name},
      type: 'default',
      className: styles.flowNodeSelected,
    };

    const relationNodes: Node[] = selected.relations.map((relation, indexOfRelation) => {
      const targetNode = index.get(relation.target);
      return {
        id: `target-${indexOfRelation}`,
        position: {x: 270, y: indexOfRelation * 92},
        data: {label: targetNode?.name ?? relation.target},
        type: 'default',
        className: relation.external ? styles.flowNodeExternal : styles.flowNode,
      };
    });

    const relationEdges: Edge[] = selected.relations.map((relation, indexOfRelation) => ({
      id: `edge-${indexOfRelation}`,
      source: 'selected',
      target: `target-${indexOfRelation}`,
      label: relation.label,
      type: 'smoothstep',
      markerEnd: {type: MarkerType.ArrowClosed},
      className: styles.flowEdge,
    }));

    return {nodes: [center, ...relationNodes], edges: relationEdges};
  }, [index, selected]);

  if (!selected?.relations?.length) {
    return <div className={styles.emptyRelations}>{labels.noRelations}</div>;
  }

  return (
    <div className={styles.relationsBlock}>
      <h3>{labels.relationsTitle}</h3>
      {isClient ? (
        <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.35} maxZoom={1.5} nodesDraggable={false}>
          <Background gap={18} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      ) : (
        <div className={styles.emptyGraph}>{labels.graphFallback}</div>
      )}
      <ul className={styles.relationList}>
        {selected.relations.map((relation) => (
          <li key={`${selected.name}-${relation.target}-${relation.label}`}>
            <strong>{relation.label}</strong>
            <span>{relation.target}</span>
            {relation.description && <p>{relation.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailPanel({selected, index, labels}: {selected?: RepositoryNode; index: NodeIndex; labels: RepositoryExplorerLabels}) {
  if (!selected) {
    return (
      <aside className={styles.detailPanel}>
        <div className={styles.emptyRelations}>{labels.emptySelection}</div>
      </aside>
    );
  }

  return (
    <aside className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <RepositoryIcon node={selected} />
        <div>
          <h2>{selected.name}</h2>
          <p>{selected.shortDescription}</p>
        </div>
      </div>
      {selected.path && <code className={styles.path}>{selected.path}</code>}
      {selected.longDescription && <p className={styles.detailText}>{selected.longDescription}</p>}
      <RelationGraph selected={selected} index={index} labels={labels} />
    </aside>
  );
}

export function RepositoryExplorer({
  sections,
  root,
  initialExpandedDepth = 1,
  showSectionDescriptions = true,
  labels: customLabels,
}: RepositoryExplorerProps) {
  const labels = useMemo(() => ({...defaultLabels, ...customLabels}), [customLabels]);

  const normalizedSections = useMemo<RepositorySection[]>(() => {
    if (sections?.length) {
      return sections;
    }

    if (root) {
      return [{title: root.name, root}];
    }

    return [];
  }, [root, sections]);

  const nodeIndex = useMemo(() => {
    const index: NodeIndex = new Map();
    normalizedSections.forEach((section) => collectNodes(section.root, index));
    return index;
  }, [normalizedSections]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    normalizedSections.reduce<Record<string, boolean>>((state, section) => {
      Object.assign(state, buildInitialExpanded(section.root, initialExpandedDepth));
      return state;
    }, {}),
  );

  const [selectedKey, setSelectedKey] = useState<string | undefined>(() =>
    normalizedSections[0] ? nodeKey(normalizedSections[0].root) : undefined,
  );

  const selectedNode = selectedKey ? nodeIndex.get(selectedKey) : undefined;

  const toggle = (key: string) => {
    setExpanded((current) => ({...current, [key]: !current[key]}));
  };

  return (
    <div className={styles.repositoryExplorer}>
      <div className={styles.sections}>
        {normalizedSections.map((section) => (
          <section key={section.title} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{section.title}</h2>
              {showSectionDescriptions && section.description && (
                <span title={section.description}>{labels.sectionItemCount(section.root.children?.length ?? 0)}</span>
              )}
            </div>
            <ul className={styles.treeList}>
              <TreeNode
                node={section.root}
                depth={0}
                expanded={expanded}
                selectedKey={selectedKey}
                onToggle={toggle}
                onSelect={setSelectedKey}
                labels={labels}
              />
            </ul>
          </section>
        ))}
      </div>
      <DetailPanel selected={selectedNode} index={nodeIndex} labels={labels} />
    </div>
  );
}

export default RepositoryExplorer;
