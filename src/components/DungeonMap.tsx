import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Swords, Skull, Flame, Gift, Crown } from 'lucide-react';
import { MapNode } from '../types';
import { soundManager } from '../utils/audio';

interface DungeonMapProps {
  nodes: MapNode[];
  currentFloor: number;
  currentNodeId: string | null;
  visitedPath: string[]; // Requirement 2.3: 선택하여 클리어한 노드 경로
  onSelectNode: (node: MapNode) => void;
}

export const DungeonMap: React.FC<DungeonMapProps> = ({
  nodes,
  currentFloor,
  currentNodeId,
  visitedPath,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [nodeCoords, setNodeCoords] = useState<Record<string, { x: number; y: number }>>({});

  // Group nodes by floor (1 to 10)
  const floorMap = new Map<number, MapNode[]>();
  for (let f = 1; f <= 10; f++) {
    floorMap.set(f, []);
  }
  nodes.forEach((node) => {
    const list = floorMap.get(node.floor) || [];
    list.push(node);
    floorMap.set(node.floor, list);
  });

  // Calculate coordinates of all node buttons to draw lines
  const updateCoords = useCallback(() => {
    if (!contentRef.current) return;
    const containerRect = contentRef.current.getBoundingClientRect();
    const coords: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node) => {
      const el = document.getElementById(`node-btn-${node.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        coords[node.id] = {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      }
    });

    setNodeCoords(coords);
  }, [nodes]);

  useEffect(() => {
    updateCoords();
    const timeout = setTimeout(updateCoords, 80);
    window.addEventListener('resize', updateCoords);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateCoords);
    };
  }, [updateCoords, currentFloor, visitedPath]);

  // Auto-scroll to current active floor
  useEffect(() => {
    const activeEl = document.getElementById(`floor-row-${currentFloor}`);
    if (activeEl && containerRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentFloor]);

  const getNodeIcon = (type: MapNode['type'], emoji?: string) => {
    switch (type) {
      case 'boss':
        return <Crown className="w-5 h-5 text-amber-300" />;
      case 'elite':
        return <Skull className="w-4 h-4 text-rose-400" />;
      case 'treasure':
        return <Gift className="w-4 h-4 text-emerald-400" />;
      case 'rest':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'battle':
      default:
        return emoji ? <span className="text-base">{emoji}</span> : <Swords className="w-4 h-4 text-sky-400" />;
    }
  };

  const getNodeLabel = (node: MapNode) => {
    switch (node.type) {
      case 'boss':
        return '최종 보스';
      case 'elite':
        return '엘리트';
      case 'treasure':
        return '보물 상자';
      case 'rest':
        return '모닥불 휴식';
      case 'battle':
      default:
        return '단어 몬스터';
    }
  };

  // Helper to build smooth curved line between two coordinates
  const createCurvedPath = (posA: { x: number; y: number }, posB: { x: number; y: number }) => {
    const midY = (posA.y + posB.y) / 2;
    return `M ${posA.x} ${posA.y} C ${posA.x} ${midY}, ${posB.x} ${midY}, ${posB.x} ${posB.y}`;
  };

  const floorsAscending = Array.from({ length: 10 }, (_, i) => i + 1);
  const lastVisitedId = visitedPath.length > 0 ? visitedPath[visitedPath.length - 1] : null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full overflow-y-auto px-4 py-8 flex flex-col items-center bg-slate-950 select-none"
    >
      {/* Background Grid & Atmospheric Fog */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div
        ref={contentRef}
        className="w-full max-w-md relative flex flex-col gap-10 pb-16"
      >
        {/* SVG Connection Layer (Requirement 2.3: 선택한 것을 선으로 잇기) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="visitedGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* 1. Base Graph Connections (Subtle gray dashed lines) */}
          {nodes.map((node) => {
            const posA = nodeCoords[node.id];
            if (!posA) return null;

            return node.nextConnectedIds.map((targetId) => {
              const posB = nodeCoords[targetId];
              if (!posB) return null;
              const pathD = createCurvedPath(posA, posB);

              return (
                <path
                  key={`base-conn-${node.id}-${targetId}`}
                  d={pathD}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                  opacity="0.45"
                />
              );
            });
          })}

          {/* 2. Active Branch from last visited node to next available nodes */}
          {lastVisitedId &&
            nodes
              .filter((n) => n.isAvailable && !n.visited)
              .map((targetNode) => {
                const posA = nodeCoords[lastVisitedId];
                const posB = nodeCoords[targetNode.id];
                if (!posA || !posB) return null;
                const pathD = createCurvedPath(posA, posB);

                return (
                  <path
                    key={`active-avail-${lastVisitedId}-${targetNode.id}`}
                    d={pathD}
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    fill="none"
                    opacity="0.85"
                    className="animate-pulse"
                  />
                );
              })}

          {/* 3. Visited Path (선택한 노드들을 선으로 연결 - Requirement 2.3) */}
          {visitedPath.map((fromId, idx) => {
            if (idx >= visitedPath.length - 1) return null;
            const toId = visitedPath[idx + 1];
            const posA = nodeCoords[fromId];
            const posB = nodeCoords[toId];
            if (!posA || !posB) return null;
            const pathD = createCurvedPath(posA, posB);

            return (
              <g key={`visited-line-${fromId}-${toId}`}>
                {/* Glowing Outer Line */}
                <path
                  d={pathD}
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.5"
                  filter="url(#glow-emerald)"
                />
                {/* Core Vibrant Line */}
                <path
                  d={pathD}
                  stroke="url(#visitedGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Animated Inner Dash */}
                <path
                  d={pathD}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.75"
                />
              </g>
            );
          })}
        </svg>

        {/* Render Floors 10 down to 1 so Floor 10 (Boss) is at top and Floor 1 is at bottom */}
        {floorsAscending
          .slice()
          .reverse()
          .map((floor) => {
            const floorNodes = floorMap.get(floor) || [];
            const isCurrentFloor = currentFloor === floor;

            return (
              <div
                key={`floor-${floor}`}
                id={`floor-row-${floor}`}
                className={`relative flex flex-col items-center transition-all z-10 ${
                  isCurrentFloor ? 'opacity-100' : 'opacity-85'
                }`}
              >
                {/* Floor Label Badge */}
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                      floor === 10
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                        : isCurrentFloor
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                    }`}
                  >
                    {floor === 10 ? '👑 10층 (FINAL)' : `${floor}층`}
                  </span>
                </div>

                {/* Tree Choice Buttons on this floor */}
                <div className="flex items-center justify-center gap-6 sm:gap-8 w-full">
                  {floorNodes.map((node) => {
                    const isAvailable = node.isAvailable && !node.visited;
                    const isVisited = node.visited;
                    const isSelectedInPath = visitedPath.includes(node.id);

                    return (
                      <div key={node.id} className="relative flex flex-col items-center">
                        <motion.button
                          id={`node-btn-${node.id}`}
                          onClick={() => {
                            if (isAvailable) {
                              soundManager.playClick();
                              onSelectNode(node);
                            }
                          }}
                          disabled={!isAvailable}
                          whileHover={isAvailable ? { scale: 1.08 } : {}}
                          whileTap={isAvailable ? { scale: 0.95 } : {}}
                          className={`relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all shadow-lg ${
                            isSelectedInPath || isVisited
                              ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-emerald-950/60 ring-2 ring-emerald-500/40'
                              : isAvailable
                              ? 'bg-linear-to-b from-amber-500/20 via-slate-900 to-slate-900 border-amber-400 text-amber-300 shadow-amber-500/30 cursor-pointer ring-4 ring-amber-400/30 animate-pulse'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {/* Inner Icon */}
                          <div className="flex items-center justify-center">
                            {isSelectedInPath || isVisited ? (
                              <Check className="w-6 h-6 text-emerald-400 stroke-[3]" />
                            ) : isAvailable ? (
                              getNodeIcon(node.type, node.monsterEmoji)
                            ) : (
                              <Lock className="w-4 h-4 text-slate-600" />
                            )}
                          </div>

                          {/* Node Type Subtitle */}
                          <span
                            className={`text-[9px] font-bold tracking-tight text-center truncate max-w-[54px] ${
                              isSelectedInPath || isVisited
                                ? 'text-emerald-400'
                                : isAvailable
                                ? 'text-amber-200'
                                : 'text-slate-600'
                            }`}
                          >
                            {isSelectedInPath || isVisited ? '클리어' : getNodeLabel(node)}
                          </span>

                          {/* Pulsing indicator if ready to choose */}
                          {isAvailable && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                            </span>
                          )}
                        </motion.button>

                        {/* Node Monster/Event Name Caption */}
                        <span
                          className={`mt-1.5 text-[11px] font-medium text-center truncate max-w-[80px] ${
                            isAvailable
                              ? 'text-amber-300 font-bold'
                              : isSelectedInPath || isVisited
                              ? 'text-emerald-400/90 font-medium'
                              : 'text-slate-600'
                          }`}
                        >
                          {node.monsterName || node.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
