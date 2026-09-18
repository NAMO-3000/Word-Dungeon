import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Lock, Swords, Skull, Flame, Gift, Crown } from 'lucide-react';
import { MapNode } from '../types';
import { soundManager } from '../utils/audio';

interface DungeonMapProps {
  nodes: MapNode[];
  currentFloor: number;
  currentNodeId: string | null;
  onSelectNode: (node: MapNode) => void;
}

export const DungeonMap: React.FC<DungeonMapProps> = ({
  nodes,
  currentFloor,
  currentNodeId,
  onSelectNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
        return '엘리트 퀴즈';
      case 'treasure':
        return '보물 상자';
      case 'rest':
        return '모닥불 휴식';
      case 'battle':
      default:
        return '단어 몬스터';
    }
  };

  // SVG Connections calculation helper
  // Floors are rendered 1 -> 10 from bottom to top or top to bottom.
  // Let's render Floor 1 at bottom and Floor 10 at top (classic Slay the Spire tower climbing),
  // OR Floor 1 at top and Floor 10 at bottom (descending into dungeon).
  // Ascending 1 -> 10 (floor 1 at bottom, boss at top) is the classic roguelike feel!
  const floorsAscending = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full overflow-y-auto px-4 py-8 flex flex-col items-center bg-slate-950 select-none"
    >
      {/* Background Grid & Atmospheric Fog */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md relative flex flex-col gap-9 pb-12">
        {/* Render Floors 10 down to 1 so Floor 10 (Boss) is at the top and Floor 1 is at the bottom */}
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
                className={`relative flex flex-col items-center transition-all ${
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
                    const isCurrent = currentNodeId === node.id;

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
                            isVisited
                              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                              : isAvailable
                              ? 'bg-linear-to-b from-amber-500/20 via-slate-900 to-slate-900 border-amber-400 text-amber-300 shadow-amber-500/30 cursor-pointer ring-4 ring-amber-400/30 animate-pulse'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {/* Inner Icon */}
                          <div className="flex items-center justify-center">
                            {isVisited ? (
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
                              isVisited
                                ? 'text-emerald-400'
                                : isAvailable
                                ? 'text-amber-200'
                                : 'text-slate-600'
                            }`}
                          >
                            {isVisited ? '클리어' : getNodeLabel(node)}
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
                              : isVisited
                              ? 'text-slate-400 line-through'
                              : 'text-slate-600'
                          }`}
                        >
                          {node.monsterName || node.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Downward connecting branch arrows indicating path flow */}
                {floor > 1 && (
                  <div className="w-full flex justify-center my-1 pointer-events-none opacity-40">
                    <div className="h-4 w-0.5 bg-linear-to-b from-slate-600 to-slate-800" />
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
