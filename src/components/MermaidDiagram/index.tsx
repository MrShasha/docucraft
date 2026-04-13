import React, {type ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Mermaid from '@theme/Mermaid';
import styles from './styles.module.css';

type TransformState = {
  scale: number;
  x: number;
  y: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
};

type CanvgModule = {
  Canvg: {
    fromString: (
      context: CanvasRenderingContext2D,
      svg: string,
      options: {ignoreAnimation: boolean; ignoreMouse: boolean},
    ) => {
      render: () => Promise<void>;
    };
  };
};

export type MermaidDiagramProps = {
  definition: string;
  className?: string;
  ariaLabel?: string;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  showHint?: boolean;
  hintText?: string;
  exportFileName?: string;
  enableFullscreen?: boolean;
  enableExport?: boolean;
};

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function copyComputedStyles(source: Element, target: Element): void {
  const computed = window.getComputedStyle(source as HTMLElement);
  const targetStyle = (target as HTMLElement).style;

  const safeProperties = [
    'color',
    'fill',
    'fill-opacity',
    'stroke',
    'stroke-opacity',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-dasharray',
    'opacity',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'letter-spacing',
    'word-spacing',
    'text-anchor',
    'dominant-baseline',
    'visibility',
    'display',
  ];

  for (const propertyName of safeProperties) {
    targetStyle.setProperty(
      propertyName,
      computed.getPropertyValue(propertyName),
      computed.getPropertyPriority(propertyName),
    );
  }
}

function inlineComputedStylesIntoClone(sourceSvg: SVGSVGElement, targetSvg: SVGSVGElement): void {
  const sourceElements: Element[] = [sourceSvg, ...Array.from(sourceSvg.querySelectorAll('*'))];
  const targetElements: Element[] = [targetSvg, ...Array.from(targetSvg.querySelectorAll('*'))];
  const limit = Math.min(sourceElements.length, targetElements.length);

  for (let index = 0; index < limit; index += 1) {
    copyComputedStyles(sourceElements[index], targetElements[index]);
  }
}

function convertForeignObjectLabelsToSvgText(svg: SVGSVGElement): void {
  const namespace = 'http://www.w3.org/2000/svg';
  const foreignObjects = Array.from(svg.querySelectorAll('foreignObject'));

  foreignObjects.forEach((foreignObject) => {
    const rawText = (foreignObject.textContent ?? '').trim();
    if (!rawText) {
      foreignObject.remove();
      return;
    }

    const x = Number.parseFloat(foreignObject.getAttribute('x') ?? '0') || 0;
    const y = Number.parseFloat(foreignObject.getAttribute('y') ?? '0') || 0;
    const width = Number.parseFloat(foreignObject.getAttribute('width') ?? '0') || 0;
    const height = Number.parseFloat(foreignObject.getAttribute('height') ?? '0') || 0;

    const textNode = svg.ownerDocument.createElementNS(namespace, 'text');
    const labelX = x + width / 2;
    const labelY = y + height / 2;

    textNode.setAttribute('x', String(labelX));
    textNode.setAttribute('y', String(labelY));
    textNode.setAttribute('text-anchor', 'middle');
    textNode.setAttribute('dominant-baseline', 'middle');
    textNode.setAttribute('font-family', 'Arial, sans-serif');
    textNode.setAttribute('font-size', '14');
    textNode.setAttribute('fill', 'currentColor');

    const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) {
      textNode.textContent = rawText;
    } else {
      const lineHeight = 16;
      const firstLineOffset = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        const tspan = svg.ownerDocument.createElementNS(namespace, 'tspan');
        tspan.setAttribute('x', String(labelX));
        tspan.setAttribute('dy', index === 0 ? String(firstLineOffset) : String(lineHeight));
        tspan.textContent = line;
        textNode.appendChild(tspan);
      });
    }

    foreignObject.replaceWith(textNode);
  });
}

function getSvgExportSize(sourceSvg: SVGSVGElement): {width: number; height: number} {
  const widthAttr = Number.parseFloat(sourceSvg.getAttribute('width') ?? '');
  const heightAttr = Number.parseFloat(sourceSvg.getAttribute('height') ?? '');

  if (Number.isFinite(widthAttr) && widthAttr > 0 && Number.isFinite(heightAttr) && heightAttr > 0) {
    return {width: Math.ceil(widthAttr), height: Math.ceil(heightAttr)};
  }

  const viewBox = sourceSvg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return {width: Math.ceil(viewBox.width), height: Math.ceil(viewBox.height)};
  }

  return {
    width: Math.max(1, Math.ceil(sourceSvg.clientWidth || 1200)),
    height: Math.max(1, Math.ceil(sourceSvg.clientHeight || 800)),
  };
}

function finalizeSvgClone(clone: SVGSVGElement, width: number, height: number): void {
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  if (!clone.getAttribute('xmlns:xlink')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }
}

function buildExportSvgMarkup(sourceSvg: SVGSVGElement): string {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  clone.style.transform = '';
  clone.style.transformOrigin = '';
  inlineComputedStylesIntoClone(sourceSvg, clone);

  const {width, height} = getSvgExportSize(sourceSvg);
  finalizeSvgClone(clone, width, height);
  return new XMLSerializer().serializeToString(clone);
}

function buildRasterExportSvgMarkup(sourceSvg: SVGSVGElement): string {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  clone.style.transform = '';
  clone.style.transformOrigin = '';
  inlineComputedStylesIntoClone(sourceSvg, clone);
  convertForeignObjectLabelsToSvgText(clone);

  const {width, height} = getSvgExportSize(sourceSvg);
  finalizeSvgClone(clone, width, height);
  return new XMLSerializer().serializeToString(clone);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function MermaidDiagram({
  definition,
  className,
  ariaLabel = 'Interactive Mermaid diagram',
  minScale = 0.6,
  maxScale = 4,
  zoomStep = 0.12,
  showHint = true,
  hintText = 'Zoom: mouse wheel. Pan: mouse drag. Reset: double click.',
  exportFileName = 'diagram',
  enableFullscreen = true,
  enableExport = true,
}: MermaidDiagramProps): ReactElement {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const transformRef = useRef<TransformState>({
    scale: 1,
    x: 0,
    y: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const mermaidElement = useMemo(() => <Mermaid value={definition} />, [definition]);

  const applyTransform = useCallback((svg: SVGSVGElement, state: TransformState): void => {
    svg.style.transformOrigin = '0 0';
    svg.style.transform = `matrix(${state.scale}, 0, 0, ${state.scale}, ${state.x}, ${state.y})`;
    setScale(state.scale);
  }, []);

  const resetTransform = useCallback((): void => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const state = transformRef.current;
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    applyTransform(svg, state);
  }, [applyTransform]);

  const zoomBy = useCallback(
    (direction: 1 | -1): void => {
      const viewport = viewportRef.current;
      const svg = svgRef.current;
      if (!viewport || !svg) {
        return;
      }

      const state = transformRef.current;
      const previousScale = state.scale;
      const nextScale = clamp(previousScale * (1 + direction * zoomStep), minScale, maxScale);
      if (nextScale === previousScale) {
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const anchorX = rect.width / 2;
      const anchorY = rect.height / 2;
      const ratio = nextScale / previousScale;

      state.x = anchorX - (anchorX - state.x) * ratio;
      state.y = anchorY - (anchorY - state.y) * ratio;
      state.scale = nextScale;
      applyTransform(svg, state);
    },
    [applyTransform, maxScale, minScale, zoomStep],
  );

  const bindInteractions = useCallback((): boolean => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return false;
    }

    const renderedSvg =
      viewport.querySelector<SVGSVGElement>('.docusaurus-mermaid-container svg') ??
      viewport.querySelector<SVGSVGElement>('svg');
    if (!renderedSvg) {
      return false;
    }

    if (svgRef.current === renderedSvg) {
      return true;
    }

    cleanupRef.current?.();
    svgRef.current = renderedSvg;

    const state = transformRef.current;
    state.dragging = false;
    applyTransform(renderedSvg, state);

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();

      const previousScale = state.scale;
      const delta = event.deltaY > 0 ? -zoomStep : zoomStep;
      const nextScale = clamp(previousScale * (1 + delta), minScale, maxScale);
      if (nextScale === previousScale) {
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const ratio = nextScale / previousScale;

      state.x = pointerX - (pointerX - state.x) * ratio;
      state.y = pointerY - (pointerY - state.y) * ratio;
      state.scale = nextScale;
      applyTransform(renderedSvg, state);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      viewport.classList.add(styles.isDragging);
      viewport.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (!state.dragging) {
        return;
      }

      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;

      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.x += dx;
      state.y += dy;
      applyTransform(renderedSvg, state);
    };

    const stopDragging = (event: PointerEvent): void => {
      if (!state.dragging) {
        return;
      }

      state.dragging = false;
      viewport.classList.remove(styles.isDragging);
      viewport.releasePointerCapture(event.pointerId);
    };

    const onDoubleClick = (): void => {
      resetTransform();
    };

    viewport.addEventListener('wheel', onWheel, {passive: false});
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', stopDragging);
    viewport.addEventListener('pointercancel', stopDragging);
    viewport.addEventListener('dblclick', onDoubleClick);

    cleanupRef.current = () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', stopDragging);
      viewport.removeEventListener('pointercancel', stopDragging);
      viewport.removeEventListener('dblclick', onDoubleClick);
    };

    return true;
  }, [applyTransform, maxScale, minScale, resetTransform, zoomStep]);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    if (document.fullscreenElement === wrapper) {
      await document.exitFullscreen();
      return;
    }

    await wrapper.requestFullscreen();
  }, []);

  const exportSvg = useCallback((): void => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const svgMarkup = buildExportSvgMarkup(svg);
    const blob = new Blob([svgMarkup], {type: 'image/svg+xml;charset=utf-8'});
    downloadBlob(blob, `${exportFileName}.svg`);
  }, [exportFileName]);

  const exportPng = useCallback(async (): Promise<void> => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    try {
      const rasterSvgMarkup = buildRasterExportSvgMarkup(svg);
      const {width, height} = getSvgExportSize(svg);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context is unavailable.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);

      const canvgModule = (await import('canvg')) as unknown as CanvgModule;
      const canvg = canvgModule.Canvg.fromString(context, rasterSvgMarkup, {
        ignoreAnimation: true,
        ignoreMouse: true,
      });
      await canvg.render();

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob(resolve, 'image/png');
        } catch {
          resolve(null);
        }
      });

      if (!pngBlob) {
        throw new Error('Failed to convert canvas to PNG blob.');
      }

      downloadBlob(pngBlob, `${exportFileName}.png`);
    } catch (error) {
      console.error('PNG export failed', error);
    }
  }, [exportFileName]);

  useEffect(() => {
    bindInteractions();

    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      bindInteractions();
    });

    observer.observe(viewport, {childList: true, subtree: true});

    return () => {
      observer.disconnect();
      cleanupRef.current?.();
      cleanupRef.current = null;
      svgRef.current = null;
    };
  }, [bindInteractions, definition]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return undefined;
    }

    const onDocumentPointerDown = (event: PointerEvent): void => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [isExportMenuOpen]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return undefined;
    }

    const onFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === wrapper);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={[styles.wrapper, isFullscreen ? styles.fullscreen : '', className ?? ''].join(' ').trim()}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className="button button--secondary button--sm"
          onClick={() => zoomBy(1)}
          disabled={scale >= maxScale}
          aria-label="Zoom in"
          title="Zoom in">
          +
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          onClick={() => zoomBy(-1)}
          disabled={scale <= minScale}
          aria-label="Zoom out"
          title="Zoom out">
          -
        </button>
        <button
          type="button"
          className="button button--secondary button--sm"
          onClick={resetTransform}
          aria-label="Reset view"
          title="Reset view">
          Reset
        </button>
        <span className={styles.zoomValue}>{Math.round(scale * 100)}%</span>
        <span className={styles.toolbarSpacer} />
        <div className={styles.actions}>
          {enableExport ? (
            <div ref={exportMenuRef} className={styles.menuWrapper}>
              <button
                type="button"
                className={`button button--secondary button--sm ${styles.iconButton}`}
                onClick={() => {
                  setIsExportMenuOpen((open) => !open);
                }}
                aria-label="Export diagram"
                title="Export diagram"
                aria-expanded={isExportMenuOpen}
                aria-haspopup="menu">
                <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
                  <path
                    d="M12 3v10m0 0l-4-4m4 4l4-4M5 14v5h14v-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {isExportMenuOpen ? (
                <div className={styles.menu} role="menu" aria-label="Export format">
                  <button
                    type="button"
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={() => {
                      exportSvg();
                      setIsExportMenuOpen(false);
                    }}>
                    SVG
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={() => {
                      void exportPng();
                      setIsExportMenuOpen(false);
                    }}>
                    PNG
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {enableFullscreen ? (
            <button
              type="button"
              className={`button button--secondary button--sm ${styles.iconButton}`}
              onClick={() => {
                void toggleFullscreen();
              }}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
                {isFullscreen ? (
                  <path
                    d="M9 9H5V5m10 0h4v4m0 6v4h-4M9 19H5v-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M9 5H5v4m10-4h4v4M5 15v4h4m10-4v4h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      <div ref={viewportRef} className={styles.viewport} role="img" aria-label={ariaLabel}>
        {mermaidElement}
      </div>

      {showHint ? <p className={styles.hint}>{hintText}</p> : null}
    </div>
  );
}
