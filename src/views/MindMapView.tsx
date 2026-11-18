import React, { useState, useRef } from 'react';
import { useStudy } from '../context/StudyContext';
import { MindMapNode } from '../types/study';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Printer,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Network,
  Headphones,
  Briefcase,
} from 'lucide-react';

export const MindMapView: React.FC = () => {
  const { currentPack, openPodcastForContext, openCaseStudyForContext } = useStudy();
  const rootNode = currentPack.mindMap;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
    setCollapsedNodes({});
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('mindmap-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPack.title.toLowerCase().replace(/\s+/g, '_')}_mindmap.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const serializeBranch = (node: MindMapNode, prefix = ''): string => {
    const line = `${prefix}- ${node.label}${node.description ? `: ${node.description}` : ''}`;
    const childrenText = (node.children || [])
      .map((child) => serializeBranch(child, `${prefix}  `))
      .join('\n');
    return childrenText ? `${line}\n${childrenText}` : line;
  };

  // Recursive Tree Node Renderer for the visual interactive graph
  const renderTree = (node: MindMapNode, depth: number = 0) => {
    const isCollapsed = collapsedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    // Color themes based on depth
    const depthColors = [
      'bg-indigo-600 text-white border-indigo-700 shadow-md', // Root
      'bg-blue-500 text-white border-blue-600 shadow-sm',     // Level 1
      'bg-purple-50 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800', // Level 2
      'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',         // Level 3+
    ];

    const currentStyle = depthColors[Math.min(depth, depthColors.length - 1)];

    return (
      <div key={node.id} className="flex items-center space-x-6 my-3">
        {/* Node Box */}
        <div
          onClick={(e) => hasChildren && toggleNode(node.id, e)}
          className={`px-4 py-2.5 rounded-xl border font-sans-academic transition-all flex items-center gap-2 ${currentStyle} ${
            hasChildren ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
          }`}
        >
          {hasChildren && (
            <span className="p-0.5 rounded-md hover:bg-black/10 transition-colors">
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </span>
          )}

          <div>
            <div className={`font-bold ${depth === 0 ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}>
              {node.label}
            </div>
            {node.description && (
              <div
                className={`text-[11px] max-w-xs line-clamp-2 mt-0.5 ${
                  depth < 2 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {node.description}
              </div>
            )}
          </div>

          {hasChildren && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                depth < 2
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {node.children?.length}
            </span>
          )}

          {depth === 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPodcastForContext({
                  topic: `${currentPack.title}: ${node.label}`,
                  subject: currentPack.subject,
                  sourceType: 'mindmap',
                  sourceBranchLabel: node.label,
                  sourceContent: serializeBranch(node),
                });
              }}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer ml-1"
              title={`Create podcast focused on "${node.label}" branch`}
            >
              <Headphones className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Children branches */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col border-l-2 border-indigo-200 dark:border-indigo-900/60 pl-6 space-y-2 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-6 before:h-0.5 before:bg-indigo-200 dark:before:bg-indigo-900/60">
            {node.children!.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Toolbar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-600" />
            <span>Interactive Mind Map</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pan, zoom, or click on nodes to expand and collapse conceptual branches
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-600 dark:text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 ml-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Mind Map</span>
          </button>
          {rootNode && (
            <button
              onClick={() =>
                openPodcastForContext({
                  topic: currentPack.title,
                  subject: currentPack.subject,
                  sourceType: 'mindmap',
                  sourceBranchLabel: rootNode.label,
                  sourceContent: serializeBranch(rootNode),
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer whitespace-nowrap"
              title="Convert this mind map into an educational podcast episode"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Podcast from Map</span>
            </button>
          )}
          <button
            onClick={() =>
              openCaseStudyForContext({
                topic: currentPack.title,
                subject: currentPack.subject,
                learningObjective: `Analyze relationships mapped in ${currentPack.title} inside a real-world scenario`,
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/50 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Practice Case</span>
          </button>
        </div>
      </div>

      {/* Interactive Mind Map Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[650px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 overflow-hidden relative select-none cursor-grab active:cursor-grabbing shadow-inner"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="absolute origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {rootNode ? (
            <div className="p-8 inline-block min-w-max">{renderTree(rootNode, 0)}</div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              No mind map data available for this study pack.
            </div>
          )}
        </div>

        {/* Floating Helper Pill */}
        <div className="no-print absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 backdrop-blur-xs text-[11px] font-medium text-slate-500 dark:text-slate-400 shadow-md">
          💡 Drag to pan canvas • Click nodes to expand/collapse
        </div>
      </div>
    </div>
  );
};
