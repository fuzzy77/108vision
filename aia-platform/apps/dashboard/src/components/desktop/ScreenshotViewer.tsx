import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { X, ZoomIn, ZoomOut, RotateCcw, Columns2, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenshotAnnotation {
  /** Normalized coordinates 0-1 */
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
}

interface ScreenshotViewerProps {
  /** URL or /api path of the screenshot to display */
  src: string;
  /** Optional second screenshot for before/after comparison */
  compareSrc?: string;
  /** Optional annotations to overlay (coordinates are 0-1 normalized) */
  annotations?: ScreenshotAnnotation[];
  title?: string;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ScreenshotViewer({ src, compareSrc, annotations = [], title, onClose }: ScreenshotViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // percent
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Track image natural size for annotation positioning
  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
  }

  // Zoom controls
  function zoomIn() {
    setZoom((z) => Math.min(z + 0.25, 4));
  }
  function zoomOut() {
    setZoom((z) => Math.max(z - 0.25, 0.25));
  }
  function resetZoom() {
    setZoom(1);
  }

  // Split drag handler
  function handleSplitMouseMove(e: React.MouseEvent) {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(5, Math.min(95, relX)));
  }

  const showCompare = compareMode && !!compareSrc;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[90vh] w-[90vw] max-w-6xl flex-col rounded-xl bg-slate-900 shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 bg-slate-800">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm font-medium text-slate-200 truncate max-w-xs">{title}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Compare toggle — only if compareSrc provided */}
            {compareSrc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompareMode((v) => !v)}
                className={cn(
                  'text-slate-400 hover:text-slate-100',
                  showCompare && 'bg-slate-600 text-slate-100',
                )}
                title="Confronto before/after"
              >
                <Columns2 className="h-4 w-4" />
                <span className="ml-1.5 text-xs">Confronto</span>
              </Button>
            )}

            <div className="mx-2 h-4 w-px bg-slate-600" />

            <Button variant="ghost" size="sm" onClick={zoomOut} className="text-slate-400 hover:text-slate-100" title="Riduci">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={zoomIn} className="text-slate-400 hover:text-slate-100" title="Ingrandisci">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetZoom} className="text-slate-400 hover:text-slate-100" title="Reimposta zoom">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            <div className="mx-2 h-4 w-px bg-slate-600" />

            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-slate-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto select-none"
          onMouseMove={handleSplitMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {showCompare ? (
            // Before / after split view
            <div className="relative h-full w-full flex items-start justify-center overflow-auto">
              <div
                className="relative inline-block"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              >
                {/* "After" full image (right side) */}
                <img
                  src={compareSrc}
                  alt="Dopo"
                  className="block max-w-none"
                  style={{ maxWidth: '100%' }}
                />
                {/* "Before" image clipped to left side */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${splitPosition}%` }}
                >
                  <img
                    src={src}
                    alt="Prima"
                    className="block max-w-none"
                    style={{ maxWidth: 'none', width: '100%' }}
                  />
                </div>
                {/* Divider */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md cursor-col-resize"
                  style={{ left: `${splitPosition}%` }}
                  onMouseDown={() => setIsDragging(true)}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg">
                    <ChevronLeft className="h-3 w-3 text-slate-600" />
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  Prima
                </div>
                <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  Dopo
                </div>
              </div>
            </div>
          ) : (
            // Single image view with annotations
            <div className="flex h-full w-full items-start justify-center overflow-auto p-4">
              <div
                className="relative inline-block"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              >
                <img
                  ref={imageRef}
                  src={src}
                  alt="Screenshot"
                  className="block max-w-none rounded shadow-lg"
                  onLoad={handleImageLoad}
                />
                {/* Annotation overlays */}
                {annotations.length > 0 && imgSize && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: imgSize.width, height: imgSize.height }}
                  >
                    {annotations.map((ann, i) => (
                      <div
                        key={i}
                        className="absolute rounded border-2 border-yellow-400"
                        style={{
                          left: `${ann.x * 100}%`,
                          top: `${ann.y * 100}%`,
                          width: `${ann.width * 100}%`,
                          height: `${ann.height * 100}%`,
                          borderColor: ann.color ?? '#facc15',
                          boxShadow: `0 0 0 1px ${ann.color ?? '#facc15'}40`,
                        }}
                      >
                        {ann.label && (
                          <span
                            className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: ann.color ?? '#facc15' }}
                          >
                            {ann.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        {imgSize && (
          <div className="border-t border-slate-700 bg-slate-800 px-4 py-1.5 text-xs text-slate-500">
            {imgSize.width} × {imgSize.height}px
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export { ScreenshotViewer };
