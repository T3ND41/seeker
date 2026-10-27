import React, { useState, useRef, useEffect } from 'react';
import { InteractiveElement, VisualFilter } from '../types';
import { Target, Search, ZoomIn, ZoomOut, Eye, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audioCues';

interface ScreenViewerProps {
  imageSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isLiveScreenShare: boolean;
  interactiveElements: InteractiveElement[];
  targetCoordinates?: [number, number, number, number];
  targetInstruction?: string;
  visualFilter: VisualFilter;
  showBoundingBoxes: boolean;
  highlightTarget: boolean;
  magnifierZoom: number;
  onElementSelect?: (element: InteractiveElement) => void;
}

export const ScreenViewer: React.FC<ScreenViewerProps> = ({
  imageSrc,
  videoRef,
  isLiveScreenShare,
  interactiveElements,
  targetCoordinates,
  targetInstruction,
  visualFilter,
  showBoundingBoxes,
  highlightTarget,
  magnifierZoom,
  onElementSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<InteractiveElement | null>(null);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, relX: 0, relY: 0 });

  // Filter styles
  const getFilterStyle = (): React.CSSProperties => {
    switch (visualFilter) {
      case 'high-contrast':
        return { filter: 'contrast(1.6) brightness(1.05)' };
      case 'invert':
        return { filter: 'invert(1) hue-rotate(180deg)' };
      case 'grayscale':
        return { filter: 'grayscale(1) contrast(1.4)' };
      case 'night-amber':
        return { filter: 'sepia(0.85) hue-rotate(330deg) saturate(2) contrast(1.2)' };
      default:
        return {};
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const relY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setMagnifierPos({ x, y, relX, relY });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'button':
        return 'bg-blue-600 text-white border-blue-400';
      case 'input':
        return 'bg-emerald-600 text-white border-emerald-400';
      case 'link':
        return 'bg-purple-600 text-white border-purple-400';
      case 'alert':
        return 'bg-rose-600 text-white border-rose-400 animate-pulse';
      case 'checkbox':
        return 'bg-amber-600 text-white border-amber-400';
      default:
        return 'bg-slate-700 text-slate-100 border-slate-500';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top HUD Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLiveScreenShare ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
              {isLiveScreenShare ? 'Live Screen Stream' : 'Screen Viewport'}
            </span>
          </div>

          {targetInstruction && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full text-xs text-amber-300 font-medium">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-xs">{targetInstruction}</span>
            </div>
          )}
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsMagnifierActive(!isMagnifierActive);
              soundManager.playScanStart();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isMagnifierActive
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Magnifier Loupe (Zoom on hover)"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Magnifier {isMagnifierActive ? 'ON' : 'OFF'}</span>
          </button>

          {hoveredElement && (
            <div className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700 max-w-xs truncate">
              {hoveredElement.role}: <span className="font-semibold text-white">{hoveredElement.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Screen Frame Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => isMagnifierActive}
        className="relative flex-1 w-full h-full min-h-[360px] flex items-center justify-center overflow-hidden cursor-crosshair select-none bg-slate-900/50"
      >
        {/* Live video feed if live screen share is active */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={getFilterStyle()}
          className={`w-full h-full object-contain ${isLiveScreenShare ? 'block' : 'hidden'}`}
        />

        {/* Captured image or sample screen preview */}
        {!isLiveScreenShare && imageSrc && (
          <img
            src={imageSrc}
            alt="Current captured screen"
            style={getFilterStyle()}
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {!isLiveScreenShare && !imageSrc && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Eye className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
            <p className="text-base font-semibold text-slate-200">No screen connected</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Click &quot;Start Live Screen Capture&quot; or choose a sample screen from the toolbar below to begin real-time navigation assistance.
            </p>
          </div>
        )}

        {/* Bounding Box Overlays */}
        {showBoundingBoxes &&
          interactiveElements.map((el) => {
            const [ymin, xmin, ymax, xmax] = el.boundingBox;
            const top = `${(ymin / 1000) * 100}%`;
            const left = `${(xmin / 1000) * 100}%`;
            const width = `${Math.max(2, ((xmax - xmin) / 1000) * 100)}%`;
            const height = `${Math.max(2, ((ymax - ymin) / 1000) * 100)}%`;

            const isHovered = hoveredElement?.id === el.id;

            return (
              <div
                key={el.id}
                style={{ top, left, width, height }}
                onMouseEnter={() => {
                  setHoveredElement(el);
                  soundManager.playTargetLocated();
                }}
                onMouseLeave={() => setHoveredElement(null)}
                onClick={() => onElementSelect?.(el)}
                className={`absolute transition-all duration-150 rounded border-2 z-10 cursor-pointer ${
                  isHovered
                    ? 'border-amber-400 bg-amber-400/25 ring-4 ring-amber-400/40 shadow-lg'
                    : 'border-blue-400/70 bg-blue-500/10 hover:border-blue-300'
                }`}
              >
                {/* Element Badge */}
                <div
                  className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap shadow-md pointer-events-none ${getRoleBadgeColor(
                    el.role
                  )}`}
                >
                  {el.label || el.role}
                </div>
              </div>
            );
          })}

        {/* Target Spotlight Pointer (Step Navigation) */}
        {highlightTarget && targetCoordinates && targetCoordinates.length === 4 && (
          (() => {
            const [ymin, xmin, ymax, xmax] = targetCoordinates;
            const top = `${(ymin / 1000) * 100}%`;
            const left = `${(xmin / 1000) * 100}%`;
            const width = `${Math.max(3, ((xmax - xmin) / 1000) * 100)}%`;
            const height = `${Math.max(3, ((ymax - ymin) / 1000) * 100)}%`;

            return (
              <div
                style={{ top, left, width, height }}
                className="absolute z-20 pointer-events-none"
              >
                {/* Pulsing Target Highlight Ring */}
                <div className="absolute inset-0 rounded-lg border-3 border-amber-400 bg-amber-400/20 ring-4 ring-amber-400/60 animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.8)]" />

                {/* Animated Directional Pointer Badge */}
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-extrabold text-xs shadow-xl animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NEXT STEP HERE</span>
                </div>
              </div>
            );
          })()
        )}

        {/* Interactive Magnifier Loupe */}
        {isMagnifierActive && (imageSrc || isLiveScreenShare) && (
          <div
            style={{
              top: `${magnifierPos.y - 80}px`,
              left: `${magnifierPos.x - 80}px`,
              width: '160px',
              height: '160px',
            }}
            className="absolute rounded-full border-4 border-amber-400 shadow-2xl overflow-hidden pointer-events-none z-30 bg-slate-900 ring-4 ring-black/80"
          >
            {imageSrc && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${imageSrc})`,
                  backgroundPosition: `${magnifierPos.relX}% ${magnifierPos.relY}%`,
                  backgroundSize: `${magnifierZoom * 100}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-950" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Status Bar */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Elements Found:{' '}
            <strong className="text-slate-200">{interactiveElements.length}</strong>
          </span>
          {hoveredElement ? (
            <span className="text-amber-300 font-medium truncate max-w-md">
              Suggested Action: {hoveredElement.suggestedAction}
            </span>
          ) : (
            <span className="text-slate-400">Hover or focus any element on screen to inspect details</span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Visual Zoom: {magnifierZoom}x
        </div>
      </div>
    </div>
  );
};
