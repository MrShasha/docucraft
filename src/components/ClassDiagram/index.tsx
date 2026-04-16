import React, { memo, useEffect, useMemo, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import dagre from '@dagrejs/dagre';
import {
  Background,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styles from './styles.module.css';

export type ClassDiagramModel = {
  classes: DtoClass[];
};

export type ClassGraphModel = ClassDiagramModel;

export type DtoClass = {
  id: string;
  name: string;
  namespace?: string;
  kind?: 'class' | 'record' | 'enum';
  baseTypeId?: string;
  summary?: string;
  properties: DtoProperty[];
};

export type DtoProperty = {
  name: string;
  typeLabel: string;
  typeId?: string;
  isNullable?: boolean;
  isCollection?: boolean;
  isEnum?: boolean;
  isPrimitive?: boolean;
  isRequired?: boolean;
  summary?: string;
};

export type ClassDiagramProps = {
  data: ClassDiagramModel;
  focus?: string;
  mode?: 'focus' | 'full' | 'inline';
  height?: number;
  maxDepth?: number;
  showPrimitives?: boolean;
  className?: string;
};

export type ClassGraphProps = ClassDiagramProps;

type DtoNodeData = {
  dto: DtoClass;
  visibleProperties: DtoProperty[];
  isFocused: boolean;
  isMatched?: boolean;
  onSelectType: (typeId: string) => void;
};

type DtoGraphNode = Node<DtoNodeData, 'dtoNode'>;

const NODE_WIDTH = 340;
const HEADER_HEIGHT = 58;
const ROW_HEIGHT = 28;
const FOOTER_HEIGHT = 32;

function cn(...tokens: Array<string | false | null | undefined>): string {
  return tokens
    .filter(Boolean)
    .map((token) => styles[token as string] ?? token)
    .join(' ');
}

function getNodeHeight(propertyCount: number): number {
  return HEADER_HEIGHT + Math.max(1, propertyCount) * ROW_HEIGHT + FOOTER_HEIGHT;
}

function getClassIndex(data: ClassDiagramModel): Map<string, DtoClass> {
  return new Map(data.classes.map((dto) => [dto.id, dto]));
}

function getIncomingRefs(data: ClassDiagramModel): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const dto of data.classes) {
    if (dto.baseTypeId) {
      if (!map.has(dto.baseTypeId)) {
        map.set(dto.baseTypeId, new Set<string>());
      }
      map.get(dto.baseTypeId)!.add(dto.id);
    }

    for (const prop of dto.properties) {
      if (!prop.typeId) {
        continue;
      }

      if (!map.has(prop.typeId)) {
        map.set(prop.typeId, new Set<string>());
      }

      map.get(prop.typeId)!.add(dto.id);
    }
  }

  return map;
}

function collectVisibleIds(
  data: ClassDiagramModel,
  focusId: string | undefined,
  mode: 'focus' | 'full' | 'inline',
  maxDepth: number
): Set<string> {
  if (mode === 'full') {
    return new Set(data.classes.map((x) => x.id));
  }

  if (mode === 'inline') {
    return new Set(focusId ? [focusId] : []);
  }

  if (!focusId) {
    return new Set();
  }

  const index = getClassIndex(data);
  const incoming = getIncomingRefs(data);

  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: focusId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) {
      continue;
    }

    visited.add(current.id);

    if (current.depth >= maxDepth) {
      continue;
    }

    const dto = index.get(current.id);
    if (!dto) {
      continue;
    }

    const neighbors = new Set<string>();

    if (dto.baseTypeId) {
      neighbors.add(dto.baseTypeId);
    }

    for (const prop of dto.properties) {
      if (prop.typeId) {
        neighbors.add(prop.typeId);
      }
    }

    for (const referrer of incoming.get(current.id) ?? []) {
      neighbors.add(referrer);
    }

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ id: neighbor, depth: current.depth + 1 });
      }
    }
  }

  return visited;
}

function getVisibleProperties(dto: DtoClass, showPrimitives: boolean): DtoProperty[] {
  return dto.properties.filter((prop) => showPrimitives || !prop.isPrimitive);
}

function getKindBadge(kind?: DtoClass['kind']): string {
  switch (kind) {
    case 'record':
      return 'record';
    case 'enum':
      return 'enum';
    default:
      return 'class';
  }
}

function layoutGraph(nodes: DtoGraphNode[], edges: Edge[], direction: 'LR' | 'TB' = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // In TB mode siblings sit side-by-side horizontally – give them generous
  // horizontal gaps (nodesep) and enough vertical runway (ranksep) so that
  // edges from a wide sibling row can fan out without crossing each other.
  // In LR mode nodes stack vertically so the vertical gap (nodesep) matters.
  const nodesep = direction === 'TB' ? 90 : 60;
  const ranksep = direction === 'TB' ? 160 : 130;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
    marginx: 32,
    marginy: 32,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: getNodeHeight(node.data.visibleProperties.length),
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const isHorizontal = direction === 'LR';

  const layoutedNodes = nodes.map((node) => {
    const graphNode = dagreGraph.node(node.id);
    const height = getNodeHeight(node.data.visibleProperties.length);

    return {
      ...node,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      position: {
        x: graphNode.x - NODE_WIDTH / 2,
        y: graphNode.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function buildFlowElements(
  data: ClassDiagramModel,
  focusId: string | undefined,
  mode: 'focus' | 'full',
  maxDepth: number,
  showPrimitives: boolean,
  onSelectType: (typeId: string) => void
) {
  const visibleIds = collectVisibleIds(data, focusId, mode, maxDepth);
  const visibleDtos = data.classes.filter((dto) => visibleIds.has(dto.id));

  const nodes: DtoGraphNode[] = visibleDtos.map((dto) => ({
    id: dto.id,
    type: 'dtoNode',
    position: { x: 0, y: 0 },
    data: {
      dto,
      visibleProperties: getVisibleProperties(dto, showPrimitives),
      isFocused: dto.id === focusId,
      onSelectType,
    },
  }));

  const edges: Edge[] = [];

  for (const dto of visibleDtos) {
    if (dto.baseTypeId && visibleIds.has(dto.baseTypeId)) {
      edges.push({
        id: `${dto.id}__base__${dto.baseTypeId}`,
        source: dto.id,
        target: dto.baseTypeId,
        type: 'smoothstep',
        label: 'base',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: 'var(--ifm-color-primary)',
        },
        style: {
          stroke: 'var(--ifm-color-primary)',
          strokeDasharray: '6 4',
          strokeWidth: 2,
        },
        labelStyle: { fontSize: 11, fontWeight: 700 },
      });
    }

    for (const prop of dto.properties) {
      if (!prop.typeId || !visibleIds.has(prop.typeId)) {
        continue;
      }

      const label =
        prop.isCollection
          ? `${prop.name} []`
          : prop.isNullable
          ? `${prop.name} ?`
          : prop.name;

      edges.push({
        id: `${dto.id}__${prop.name}__${prop.typeId}`,
        source: dto.id,
        target: prop.typeId,
        type: 'smoothstep',
        label,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: 'var(--ifm-color-primary)',
        },
        style: {
          stroke: 'var(--ifm-color-primary)',
          strokeWidth: prop.isCollection ? 2.5 : 2,
          strokeDasharray: prop.isCollection ? '4 4' : undefined,
        },
        labelStyle: { fontSize: 11, fontWeight: 600 },
      });
    }
  }

  return layoutGraph(nodes, edges, mode === 'full' ? 'TB' : 'LR');
}

const DtoNodeCard = memo(function DtoNodeCard({
  data,
  selected,
  sourcePosition,
  targetPosition,
}: NodeProps<DtoGraphNode>) {
  const { dto, visibleProperties, isFocused, isMatched, onSelectType } = data;

  return (
    <div
      className={cn(
        'dto-node',
        isMatched ? 'dto-node--matched' : '',
        selected ? 'dto-node--selected' : '',
        isFocused ? 'dto-node--focused' : '',
      )}
    >
      <Handle
        type="target"
        position={targetPosition ?? Position.Left}
        className={cn('dto-node__handle')}
      />
      <Handle
        type="source"
        position={sourcePosition ?? Position.Right}
        className={cn('dto-node__handle')}
      />

      <div className={cn('dto-node__header')}>
        <div>
          <div className={cn('dto-node__titleRow')}>
            <span className={cn('dto-node__title')}>{dto.name}</span>
            <span className={cn('dto-node__kind')}>{getKindBadge(dto.kind)}</span>
          </div>

          {dto.namespace ? (
            <div className={cn('dto-node__namespace')}>{dto.namespace}</div>
          ) : null}
        </div>
      </div>

      <div className={cn('dto-node__body')}>
        {visibleProperties.length === 0 ? (
          <div className={cn('dto-node__empty')}>No properties to display</div>
        ) : (
          visibleProperties.map((prop) => {
            const canSelect = !!prop.typeId;

            return (
              <div
                key={`${dto.id}_${prop.name}`}
                className={cn('dto-node__property')}
                title={prop.summary || ''}
              >
                <span className={cn('dto-node__propertyName')}>{prop.name}</span>

                <div className={cn('dto-node__propertyRight')}>
                  {prop.isRequired ? <span className={cn('dto-badge')}>required</span> : null}
                  {prop.isNullable ? <span className={cn('dto-badge')}>?</span> : null}
                  {prop.isCollection ? <span className={cn('dto-badge')}>[]</span> : null}
                  {prop.isEnum ? <span className={cn('dto-badge')}>enum</span> : null}

                  {canSelect ? (
                    <button
                      type="button"
                      className={cn('dto-node__typeLink', 'nodrag', 'nopan')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectType(prop.typeId!);
                      }}
                    >
                      {prop.typeLabel}
                    </button>
                  ) : (
                    <span className={cn('dto-node__type')}>{prop.typeLabel}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={cn('dto-node__footer')}>
        <span>{dto.properties.length} properties</span>
        {dto.summary ? <span className={cn('dto-node__summaryMark')}>i</span> : null}
      </div>
    </div>
  );
});

const nodeTypes = {
  dtoNode: DtoNodeCard,
} satisfies NodeTypes;

function DtoInlineCard({
  dto,
  showPrimitives,
  onSelectType,
}: {
  dto?: DtoClass;
  showPrimitives: boolean;
  onSelectType: (typeId: string) => void;
}) {
  if (!dto) {
    return <div className={cn('dto-inline')}>DTO was not found.</div>;
  }

  const properties = getVisibleProperties(dto, showPrimitives);

  return (
    <div className={cn('dto-inline')}>
      <div className={cn('dto-node', 'dto-node--focused')}>
        <div className={cn('dto-node__header')}>
          <div>
            <div className={cn('dto-node__titleRow')}>
              <span className={cn('dto-node__title')}>{dto.name}</span>
              <span className={cn('dto-node__kind')}>{getKindBadge(dto.kind)}</span>
            </div>
            {dto.namespace ? <div className={cn('dto-node__namespace')}>{dto.namespace}</div> : null}
          </div>
        </div>

        <div className={cn('dto-node__body')}>
          {properties.map((prop) => (
            <div key={`${dto.id}_${prop.name}`} className={cn('dto-node__property')}>
              <span className={cn('dto-node__propertyName')}>{prop.name}</span>

              <div className={cn('dto-node__propertyRight')}>
                {prop.isRequired ? <span className={cn('dto-badge')}>required</span> : null}
                {prop.isNullable ? <span className={cn('dto-badge')}>?</span> : null}
                {prop.isCollection ? <span className={cn('dto-badge')}>[]</span> : null}
                {prop.isEnum ? <span className={cn('dto-badge')}>enum</span> : null}

                {prop.typeId ? (
                  <button
                    type="button"
                    className={cn('dto-node__typeLink')}
                    onClick={() => onSelectType(prop.typeId!)}
                  >
                    {prop.typeLabel}
                  </button>
                ) : (
                  <span className={cn('dto-node__type')}>{prop.typeLabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DtoSelectionBar({
  dto,
  focusTypeId,
  onFocusSelected,
}: {
  dto?: DtoClass;
  focusTypeId?: string;
  onFocusSelected: () => void;
}) {
  if (!dto) {
    return (
      <div className={cn('dto-graph__selectionBar')}>
        Click a DTO node to show a brief detail below.
      </div>
    );
  }

  const isFocusRoot = dto.id === focusTypeId;

  return (
    <div className={cn('dto-graph__selectionBar')}>
      <div className={cn('dto-graph__selectionMain')}>
        <span className={cn('dto-graph__selectionTitle')}>{dto.name}</span>
        <span className={cn('dto-node__kind')}>{getKindBadge(dto.kind)}</span>
        <span className={cn('dto-graph__selectionMeta')}>{dto.properties.length} properties</span>
        {dto.baseTypeId ? (
          <span className={cn('dto-graph__selectionMeta')}>inherits</span>
        ) : null}
        {isFocusRoot ? (
          <span className={cn('dto-graph__focusChip')}>focus root</span>
        ) : (
          <button
            type="button"
            className={cn('dto-graph__smallButton')}
            onClick={onFocusSelected}
          >
            Focus selected
          </button>
        )}
      </div>

      {dto.namespace ? (
        <div className={cn('dto-graph__selectionSub')}>{dto.namespace}</div>
      ) : null}

      {dto.summary ? (
        <div className={cn('dto-graph__selectionSub')}>{dto.summary}</div>
      ) : null}
    </div>
  );
}

function ClassDiagramClient({
  data,
  focus,
  mode = 'focus',
  height = 620,
  maxDepth = 1,
  showPrimitives = true,
  className,
}: ClassDiagramProps) {
  const initialId = focus ?? data.classes[0]?.id;
  const [focusTypeId, setFocusTypeId] = useState<string | undefined>(initialId);
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(initialId);
  const [query, setQuery] = useState('');
  const [includePrimitives, setIncludePrimitives] = useState(showPrimitives);
  const [viewMode, setViewMode] = useState<'focus' | 'full' | 'inline'>(
    mode === 'inline' ? 'inline' : mode
  );

  const reactFlow = useReactFlow();

  useEffect(() => {
    if (focus) {
      setFocusTypeId(focus);
      setSelectedTypeId(focus);
    }
  }, [focus]);

  const index = useMemo(() => getClassIndex(data), [data]);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const q = query.trim().toLowerCase();

    const match = data.classes.find((dto) => {
      if (dto.name.toLowerCase().includes(q)) {
        return true;
      }

      return dto.properties.some(
        (prop) =>
          prop.name.toLowerCase().includes(q) ||
          prop.typeLabel.toLowerCase().includes(q)
      );
    });

    if (match) {
      setSelectedTypeId(match.id);

      if (viewMode === 'focus') {
        setFocusTypeId(match.id);
      }
    }
  }, [query, data.classes, viewMode]);

  const matchedIds = useMemo(() => {
    if (!query.trim()) return new Set<string>();
    const q = query.trim().toLowerCase();
    return new Set(
      data.classes
        .filter(
          (dto) =>
            dto.name.toLowerCase().includes(q) ||
            dto.properties.some(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.typeLabel.toLowerCase().includes(q)
            )
        )
        .map((dto) => dto.id)
    );
  }, [query, data.classes]);

  const graph = useMemo(() => {
    const graphMode = viewMode === 'full' ? 'full' : 'focus';

    return buildFlowElements(
      data,
      focusTypeId,
      graphMode,
      maxDepth,
      includePrimitives,
      (typeId) => {
        setSelectedTypeId(typeId);
      }
    );
  }, [data, focusTypeId, viewMode, maxDepth, includePrimitives]);

  const [nodes, setNodes, onNodesChange] = useNodesState<DtoGraphNode>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph.nodes, graph.edges, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isMatched: matchedIds.has(n.id),
        },
      }))
    );
  }, [matchedIds, setNodes]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.18, duration: 250 });
    });

    return () => cancelAnimationFrame(raf);
  }, [graph.nodes, graph.edges, reactFlow]);

  const selectedDto = selectedTypeId ? index.get(selectedTypeId) : undefined;
  const inlineDto = selectedTypeId ? index.get(selectedTypeId) : undefined;

  if (viewMode === 'inline') {
    return (
      <DtoInlineCard
        dto={inlineDto}
        showPrimitives={includePrimitives}
        onSelectType={(typeId) => setSelectedTypeId(typeId)}
      />
    );
  }

  return (
    <div className={cn('dto-graph-shell', className)}>
      <div className={cn('dto-graph')} style={{ height }}>
        <div className={cn('dto-graph__toolbar')}>
          <div className={cn('dto-graph__modeGroup')}>
            <button
              type="button"
              className={cn('dto-graph__modeBtn', viewMode === 'focus' && 'is-active')}
              onClick={() => setViewMode('focus')}
            >
              Focus view
            </button>
            <button
              type="button"
              className={cn('dto-graph__modeBtn', viewMode === 'full' && 'is-active')}
              onClick={() => setViewMode('full')}
            >
              Full graph
            </button>
          </div>

          <input
            className={cn('dto-graph__search')}
            type="text"
            placeholder="Find DTO or property..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label className={cn('dto-graph__checkbox')}>
            <input
              type="checkbox"
              checked={includePrimitives}
              onChange={(e) => setIncludePrimitives(e.target.checked)}
            />
            primitives
          </label>

          {focusTypeId ? (
            <span className={cn('dto-graph__rootChip')}>
              root: {index.get(focusTypeId)?.name ?? focusTypeId}
            </span>
          ) : null}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          minZoom={0.2}
          maxZoom={1.8}
          onlyRenderVisibleElements
          nodesDraggable
          elementsSelectable
          fitView
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node: DtoGraphNode) => {
            setSelectedTypeId(node.id);
          }}
          proOptions={{ hideAttribution: true }}
          fitViewOptions={{ padding: 0.18 }}
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      <DtoSelectionBar
        dto={selectedDto}
        focusTypeId={focusTypeId}
        onFocusSelected={() => {
          if (selectedTypeId) {
            setFocusTypeId(selectedTypeId);
            setViewMode('focus');
          }
        }}
      />
    </div>
  );
}

export default function ClassDiagram(props: ClassDiagramProps) {
  const fallbackHeight = props.height ?? 620;

  return (
    <BrowserOnly fallback={<div style={{ height: fallbackHeight }}>Loading DTO graph...</div>}>
      {() => (
        <ReactFlowProvider>
          <ClassDiagramClient {...props} />
        </ReactFlowProvider>
      )}
    </BrowserOnly>
  );
}