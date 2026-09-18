import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Trophy, Volume2, VolumeX, Sparkles, Swords, Compass, Lock, Zap, Check, ChevronRight } from 'lucide-react';
import { DungeonTheme, GameDifficulty, PlayerStats, AvatarId } from '../types';
import { DUNGEON_THEMES } from '../data/dungeonThemes';
import { INITIAL_AVATARS } from '../data/avatars';
import { soundManager } from '../utils/audio';
import { AvatarModal } from './AvatarModal';

interface StartScreenProps {
  stats: PlayerStats;
  selectedTheme: DungeonTheme;
  difficulty: GameDifficulty;
  onSelectTheme: (theme: DungeonTheme) => void;
  onSelectDifficulty: (diff: GameDifficulty) => void;
  onEquipAvatar: (avatarId: AvatarId) => void;
  onBuyAvatar: (avatarId: AvatarId, price: number) => void;
  onStartGame: () => void;
  onOpenNotebook: () => void;
  onOpenAchievements: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  stats,
  selectedTheme,
  difficulty,
  onSelectTheme,
  onSelectDifficulty,
  onEquipAvatar,
  onBuyAvatar,
  onStartGame,
  onOpenNotebook,
  onOpenAchievements,
  isMuted,
  onToggleMute,
}) => {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const equippedAvatarInfo = INITIAL_AVATARS[stats.equippedAvatarId] || INITIAL_AVATARS.adventurer;
  const equippedAvatarStats = stats.avatars[stats.equippedAvatarId] || { level: 1, exp: 0 };

  const isHardUnlocked = !!stats.clearedThemes?.[selectedTheme.id]?.easy;

  const handleStart = () => {
    soundManager.playClick();
    onStartGame();
  };

  const handleNotebook = () => {
    soundManager.playClick();
    onOpenNotebook();
  };

  const handleAchievements = () => {
    soundManager.playClick();
    onOpenAchievements();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-5 text-white overflow-y-auto no-scrollbar select-none bg-radial from-slate-900 via-slate-950 to-black">
      {/* Background Ambience particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Top Bar: Sound & Stats */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-inner text-xs font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>골드: <strong className="text-amber-400">{stats.gold}</strong>G</span>
          <span className="text-slate-600">|</span>
          <span>수집 단어: <strong className="text-sky-400">{stats.discoveredWordIds.length}</strong></span>
          <span className="text-slate-600">|</span>
          <span>클리어: <strong className="text-emerald-400">{stats.totalCleared}</strong>회</span>
        </div>

        <button
          id="sound-toggle-btn"
          onClick={onToggleMute}
          className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-300 transition-all border border-slate-700/60 shadow-md"
          title={isMuted ? '소리 켜기' : '소리 끄기'}
          aria-label="소리 설정"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Center Section: Logo, Avatar, Theme & Start Button */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center px-2 py-3">
        {/* Title Logo */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-3"
        >
          <div className="inline-block px-3 py-1 mb-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold tracking-wider">
            중학교 1학년 영단어 & 기초 문법 로그라이크 RPG
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-game tracking-tight text-transparent bg-clip-text bg-linear-to-r from-amber-200 via-amber-400 to-orange-400 drop-shadow-lg">
            워드 던전
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-0.5">
            10개 테마 300단어 정복! 보스의 5가지 시련을 극복하라!
          </p>
        </motion.div>

        {/* Selected Avatar Banner & Change Button */}
        <div className="w-full max-w-xs mb-3">
          <button
            id="avatar-select-btn"
            onClick={() => {
              soundManager.playClick();
              setShowAvatarModal(true);
            }}
            className="w-full bg-slate-900/90 hover:bg-slate-850 border border-indigo-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 text-left transition-all active:scale-[0.98] shadow-md group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 rounded-xl bg-indigo-950 border border-indigo-700/60 shrink-0">
                {equippedAvatarInfo.emoji}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {equippedAvatarInfo.name}
                  </span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.2 rounded border border-indigo-800">
                    Lv.{equippedAvatarStats.level}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                  {equippedAvatarInfo.perkText}
                </div>
              </div>
            </div>

            <div className="flex items-center text-[11px] text-indigo-300 gap-0.5 bg-indigo-950/80 px-2 py-1 rounded-lg border border-indigo-800/80">
              <span>아바타</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Current Theme Selector */}
        <div className="w-full max-w-xs mb-3">
          <button
            id="theme-select-btn"
            onClick={() => {
              soundManager.playClick();
              setShowThemeModal(true);
            }}
            className="w-full bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.98] shadow-md group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
                {selectedTheme.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-amber-400 font-semibold tracking-wide truncate">
                    {selectedTheme.englishName}
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                    단어 {selectedTheme.words.length}개
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                  {selectedTheme.name}
                </div>
              </div>
            </div>
            <div className="flex items-center text-xs text-slate-400 gap-1 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/50 shrink-0">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>테마 (10개)</span>
            </div>
          </button>
        </div>

        {/* Easy vs Hard Difficulty Selector (Requirements 5, 6, 7) */}
        <div className="w-full max-w-xs mb-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            {/* Easy Mode */}
            <button
              onClick={() => {
                soundManager.playClick();
                onSelectDifficulty('easy');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                difficulty === 'easy'
                  ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1">
                <span>EASY 모드</span>
                {stats.clearedThemes?.[selectedTheme.id]?.easy && (
                  <Check className="w-3 h-3 text-emerald-300 stroke-[3]" />
                )}
              </div>
              <span className="text-[10px] font-normal opacity-90">단어 뜻 위주</span>
            </button>

            {/* Hard Mode (Locked until Easy is cleared) */}
            <button
              onClick={() => {
                if (isHardUnlocked) {
                  soundManager.playClick();
                  onSelectDifficulty('hard');
                } else {
                  soundManager.playWrong();
                }
              }}
              disabled={!isHardUnlocked}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 relative ${
                !isHardUnlocked
                  ? 'text-slate-600 bg-slate-900/50 cursor-not-allowed border border-slate-800/40'
                  : difficulty === 'hard'
                  ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1">
                {!isHardUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                <span>HARD 모드</span>
                {stats.clearedThemes?.[selectedTheme.id]?.hard && (
                  <Check className="w-3 h-3 text-purple-300 stroke-[3]" />
                )}
              </div>
              <span className="text-[10px] font-normal opacity-90">
                {!isHardUnlocked ? 'Easy 클리어 시 해금' : '문법 위주'}
              </span>
            </button>
          </div>
        </div>

        {/* Central Big Start Button - strictly per spec [게임 시작] (중앙, 큰 글씨) */}
        <motion.button
          id="game-start-btn"
          onClick={handleStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="w-full max-w-xs py-3.5 px-8 rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black font-game text-xl sm:text-2xl tracking-wide shadow-xl shadow-orange-500/30 border-2 border-amber-300/60 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Swords className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          <span>게임 시작</span>
        </motion.button>
      </div>

      {/* Bottom Row - strictly per spec: [노트] (좌측 하단, 중간 글씨), [업적] (우측 하단, 중간 글씨) */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 max-w-md mx-auto w-full shrink-0">
        {/* Left Bottom: [노트] */}
        <button
          id="notebook-btn"
          onClick={handleNotebook}
          className="py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 active:scale-95 text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all group"
        >
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span>노트</span>
          {stats.discoveredWordIds.length > 0 && (
            <span className="text-[11px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
              {stats.discoveredWordIds.length}
            </span>
          )}
        </button>

        {/* Right Bottom: [업적] */}
        <button
          id="achievements-btn"
          onClick={handleAchievements}
          className="py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 active:scale-95 text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all group"
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>업적</span>
          {stats.unlockedAchievementIds.length > 0 && (
            <span className="text-[11px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
              {stats.unlockedAchievementIds.length}
            </span>
          )}
        </button>
      </div>

      {/* 10 Themes Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 shrink-0">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Compass className="w-5 h-5" />
                던전 테마 선택 (총 10개)
              </h2>
              <button
                onClick={() => setShowThemeModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                닫기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {DUNGEON_THEMES.map((theme) => {
                const isSelected = theme.id === selectedTheme.id;
                const isClearedEasy = !!stats.clearedThemes?.[theme.id]?.easy;
                const isClearedHard = !!stats.clearedThemes?.[theme.id]?.hard;

                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectTheme(theme);
                      setShowThemeModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/70 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl p-2 rounded-xl bg-slate-900/80 border border-slate-700 shrink-0">
                      {theme.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-100 truncate">{theme.name}</h3>
                          {isSelected && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded shrink-0">
                              선택됨
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isClearedEasy && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 rounded">
                              Easy 클리어
                            </span>
                          )}
                          {isClearedHard && (
                            <span className="text-[9px] bg-purple-950 text-purple-400 border border-purple-800 px-1 rounded">
                              Hard 클리어
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-400/90 font-medium">{theme.englishName} (단어 {theme.words.length}개)</p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {theme.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Avatar Shop/Selection Modal */}
      {showAvatarModal && (
        <AvatarModal
          stats={stats}
          onEquipAvatar={onEquipAvatar}
          onBuyAvatar={onBuyAvatar}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
};
