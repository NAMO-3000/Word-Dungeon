import React from 'react';
import { Heart, Coins, ArrowLeft, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { DungeonTheme, PlayerStats } from '../types';
import { soundManager } from '../utils/audio';

interface DungeonHeaderProps {
  theme: DungeonTheme;
  stats: PlayerStats;
  onExitDungeon: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const DungeonHeader: React.FC<DungeonHeaderProps> = ({
  theme,
  stats,
  onExitDungeon,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Back / Theme info */}
      <div className="flex items-center gap-2.5">
        <button
          id="dungeon-quit-btn"
          onClick={() => {
            soundManager.playClick();
            if (window.confirm('정말 던전 탐험을 중단하고 메인으로 돌아가시겠습니까?')) {
              onExitDungeon();
            }
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
          title="던전 나가기"
          aria-label="던전 나가기"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">{theme.icon}</span>
          <div>
            <div className="text-xs font-bold text-slate-200 leading-tight">
              {theme.name}
            </div>
            <div className="text-[10px] text-amber-400/90 font-medium">
              층수: <span className="text-white font-bold">{stats.currentFloor}</span> / 10
            </div>
          </div>
        </div>
      </div>

      {/* Center/Right: Gold & Strictly required "남은 목숨 2/3 형식 (오른쪽 위, 작은 글씨)" */}
      <div className="flex items-center gap-2.5">
        {/* Gold */}
        <div className="flex items-center gap-1 bg-slate-800/70 border border-amber-500/30 px-2 py-1 rounded-full text-xs font-semibold text-amber-300">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{stats.gold}</span>
        </div>

        {/* Audio */}
        <button
          id="dungeon-sound-btn"
          onClick={onToggleMute}
          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 transition-all"
          aria-label="소리 토글"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Strictly per user spec: 남은 목숨 2/3 형식 (오른쪽 위, 작은 글씨) */}
        <div
          id="player-hp-display"
          className="flex items-center gap-1.5 bg-rose-950/50 border border-rose-500/40 px-2.5 py-1 rounded-full shadow-sm"
        >
          <Heart className={`w-3.5 h-3.5 ${stats.hp <= 1 ? 'text-rose-500 animate-ping' : 'text-rose-400 fill-rose-500'}`} />
          <span className="text-xs font-bold tracking-tight text-rose-200">
            남은 목숨 {stats.hp}/{stats.maxHp}
          </span>
        </div>
      </div>
    </header>
  );
};
