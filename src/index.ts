export {default as MermaidDiagram} from './components/MermaidDiagram/index.js';
export type {MermaidDiagramProps} from './components/MermaidDiagram/index.js';
export {default as ClassDiagram} from './components/ClassDiagram/index.js';
export type {
	ClassDiagramProps,
	ClassDiagramModel,
	DtoClass,
	DtoProperty,
} from './components/ClassDiagram/index.js';

// Backward-compatible aliases for previously published naming.
export {default as ClassGraph} from './components/ClassDiagram/index.js';
export type {
	ClassDiagramProps as ClassGraphProps,
	ClassDiagramModel as ClassGraphModel,
} from './components/ClassDiagram/index.js';
