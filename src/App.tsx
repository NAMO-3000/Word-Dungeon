/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AvatarId, DungeonTheme, GameDifficulty, MapNode, PlayerStats, ScreenType, WordItem } from './types';
import { DUNGEON_THEMES, INITIAL_ACHIEVEMENTS } from './data/dungeonThemes';
import { INITIAL_AVATARS, getMaxExp } from './data/avatars';
import { generateDungeonMap } from './utils/mapGenerator';
import { soundManager } from './utils/audio';

import { StartScreen } from './components/StartScreen';
import { DungeonHeader } from './components/DungeonHeader';
import { DungeonMap } from './components/DungeonMap';
import { BattleQuizModal } from './components/BattleQuizModal';
import { EventModal } from './components/EventModal';
import { ResultScreen } from './components/ResultScreen';
import { NotebookModal } from './components/NotebookModal';
import { AchievementModal } from './components/AchievementModal';

const STATS_STORAGE_KEY = 'word_dungeon_player_stats_v2';

export default function App() {
  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Current screen state
  const [screen, setScreen] = useState<ScreenType>('START');

  // Selected dungeon theme & difficulty
  const [selectedTheme, setSelectedTheme] = useState<DungeonTheme>(DUNGEON_THEMES[0]);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

  // Player persistent stats
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          hp: 3,
          maxHp: 3,
          gold: parsed.gold ?? 0,
          currentFloor: 1,
          currentNodeId: null,
          consecutiveCorrect: 0,
          discoveredWordIds: parsed.discoveredWordIds ?? [],
          masteredWordIds: parsed.masteredWordIds ?? [],
          wrongWordIds: parsed.wrongWordIds ?? [],
          totalGamesPlayed: parsed.totalGamesPlayed ?? 0,
          totalCleared: parsed.totalCleared ?? 0,
          unlockedAchievementIds: parsed.unlockedAchievementIds ?? [],
          equippedAvatarId: parsed.equippedAvatarId ?? 'adventurer',
          avatars: parsed.avatars ?? {
            adventurer: { isUnlocked: true, level: 1, exp: 0 },
            knight: { isUnlocked: false, level: 1, exp: 0 },
            mage: { isUnlocked: false, level: 1, exp: 0 },
            rogue: { isUnlocked: false, level: 1, exp: 0 },
            pirate: { isUnlocked: false, level: 1, exp: 0 },
          },
          clearedThemes: parsed.clearedThemes ?? {},
        };
      }
    } catch {
      // fallback
    }

    return {
      hp: 3,
      maxHp: 3,
      gold: 0,
      currentFloor: 1,
      currentNodeId: null,
      consecutiveCorrect: 0,
      discoveredWordIds: [],
      masteredWordIds: [],
      wrongWordIds: [],
      totalGamesPlayed: 0,
      totalCleared: 0,
      unlockedAchievementIds: [],
      equippedAvatarId: 'adventurer',
      avatars: {
        adventurer: { isUnlocked: true, level: 1, exp: 0 },
        knight: { isUnlocked: false, level: 1, exp: 0 },
        mage: { isUnlocked: false, level: 1, exp: 0 },
        rogue: { isUnlocked: false, level: 1, exp: 0 },
        pirate: { isUnlocked: false, level: 1, exp: 0 },
      },
      clearedThemes: {},
    };
  });

  // Current dungeon run state
  const [dungeonNodes, setDungeonNodes] = useState<MapNode[]>([]);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);
  const [runLearnedWords, setRunLearnedWords] = useState<WordItem[]>([]);
  const [runGoldEarned, setRunGoldEarned] = useState<number>(0);

  // Modals overlay
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState<boolean>(false);

  // Sync stats to localStorage
  useEffect(() => {
    try {
      const persistData = {
        gold: stats.gold,
        discoveredWordIds: stats.discoveredWordIds,
        masteredWordIds: stats.masteredWordIds,
        wrongWordIds: stats.wrongWordIds,
        totalGamesPlayed: stats.totalGamesPlayed,
        totalCleared: stats.totalCleared,
        unlockedAchievementIds: stats.unlockedAchievementIds,
        equippedAvatarId: stats.equippedAvatarId,
        avatars: stats.avatars,
        clearedThemes: stats.clearedThemes,
      };
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(persistData));
    } catch {
      // ignore
    }
  }, [stats]);

  // Check achievements trigger
  const checkAchievements = useCallback((newStats: PlayerStats, triggerType: string) => {
    const newlyUnlocked: string[] = [];

    INITIAL_ACHIEVEMENTS.forEach((ach) => {
      if (newStats.unlockedAchievementIds.includes(ach.id)) return;

      let isUnlocked = false;
      if (ach.id === 'first_blood' && newStats.discoveredWordIds.length >= 1) {
        isUnlocked = true;
      } else if (ach.id === 'streak_5' && newStats.consecutiveCorrect >= 5) {
        isUnlocked = true;
      } else if (ach.id === 'dungeon_clear' && newStats.totalCleared >= 1) {
        isUnlocked = true;
      } else if (ach.id === 'flawless_victory' && triggerType === 'clear' && newStats.hp === newStats.maxHp) {
        isUnlocked = true;
      } else if (ach.id === 'survivor' && triggerType === 'clear' && newStats.hp === 1) {
        isUnlocked = true;
      } else if (ach.id === 'scholar_10' && newStats.discoveredWordIds.length >= 10) {
        isUnlocked = true;
      } else if (ach.id === 'scholar_30' && newStats.discoveredWordIds.length >= 30) {
        isUnlocked = true;
      } else if (ach.id === 'boss_slayer' && newStats.totalCleared >= 3) {
        isUnlocked = true;
      }

      if (isUnlocked) {
        newlyUnlocked.push(ach.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      setStats((prev) => ({
        ...prev,
        unlockedAchievementIds: [...prev.unlockedAchievementIds, ...newlyUnlocked],
      }));
    }
  }, []);

  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  // Avatar equips & purchase
  const handleEquipAvatar = (avatarId: AvatarId) => {
    setStats((prev) => ({
      ...prev,
      equippedAvatarId: avatarId,
    }));
  };

  const handleBuyAvatar = (avatarId: AvatarId, price: number) => {
    setStats((prev) => {
      if (prev.gold < price) return prev;
      return {
        ...prev,
        gold: prev.gold - price,
        equippedAvatarId: avatarId,
        avatars: {
          ...prev.avatars,
          [avatarId]: {
            ...prev.avatars[avatarId],
            isUnlocked: true,
          },
        },
      };
    });
  };

  // Start a new dungeon run
  const handleStartGame = (themeToUse: DungeonTheme = selectedTheme, diffToUse: GameDifficulty = difficulty) => {
    const generatedNodes = generateDungeonMap(themeToUse, diffToUse);
    setDungeonNodes(generatedNodes);
    setActiveNode(null);
    setRunLearnedWords([]);
    setRunGoldEarned(0);

    // Avatar perk: Knight starts with +1 Max HP (4 HP instead of 3)
    const baseHp = stats.equippedAvatarId === 'knight' ? 4 : 3;

    setStats((prev) => ({
      ...prev,
      hp: baseHp,
      maxHp: baseHp,
      currentFloor: 1,
      currentNodeId: null,
      consecutiveCorrect: 0,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));

    setScreen('MAP');
  };

  // When player clicks a node on the tree map
  const handleSelectNode = (node: MapNode) => {
    setActiveNode(node);
  };

  // Answered quiz correctly
  const handleAnswerCorrect = (word: WordItem, goldEarned: number) => {
    // Avatar perk: Mage gets +1 extra gold per correct answer
    const finalGold = stats.equippedAvatarId === 'mage' ? goldEarned + 1 : goldEarned;

    setRunLearnedWords((prev) => {
      if (prev.some((w) => w.id === word.id)) return prev;
      return [...prev, word];
    });
    setRunGoldEarned((prev) => prev + finalGold);

    // Update player stats
    setStats((prev) => {
      const nextDiscovered = prev.discoveredWordIds.includes(word.id)
        ? prev.discoveredWordIds
        : [...prev.discoveredWordIds, word.id];

      const nextStreak = prev.consecutiveCorrect + 1;
      const updated: PlayerStats = {
        ...prev,
        gold: prev.gold + finalGold,
        consecutiveCorrect: nextStreak,
        discoveredWordIds: nextDiscovered,
      };
      checkAchievements(updated, 'quiz_correct');
      return updated;
    });

    // Advance dungeon tree state
    advanceDungeonNode(activeNode!);
    setActiveNode(null);
  };

  // Answered quiz wrong (Requirement 8: 기록되어 노트에서 빨간색으로 강조)
  const handleAnswerWrong = (word: WordItem) => {
    setStats((prev) => {
      const newHp = Math.max(0, prev.hp - 1);
      const nextWrong = prev.wrongWordIds.includes(word.id)
        ? prev.wrongWordIds
        : [...prev.wrongWordIds, word.id];

      const updated: PlayerStats = {
        ...prev,
        hp: newHp,
        consecutiveCorrect: 0,
        wrongWordIds: nextWrong,
      };

      if (newHp <= 0) {
        // Game Over
        setTimeout(() => {
          setActiveNode(null);
          setScreen('RESULT_GAMEOVER');
        }, 1200);
      }

      return updated;
    });
  };

  // Close quiz modal after wrong answer review and proceed if still alive
  const handleCloseBattleModal = () => {
    if (activeNode) {
      if (stats.hp > 0) {
        advanceDungeonNode(activeNode);
      } else {
        setScreen('RESULT_GAMEOVER');
      }
    }
    setActiveNode(null);
  };

  // Move forward through the dungeon tree
  const advanceDungeonNode = (clearedNode: MapNode) => {
    // Check if this was the Floor 10 Boss!
    if (clearedNode.floor === 10) {
      // Dungeon Cleared!
      // Avatar Experience and Leveling Progression (Requirement 13)
      setStats((prev) => {
        const currentAvatarId = prev.equippedAvatarId;
        const currentAvatarData = prev.avatars[currentAvatarId] || { isUnlocked: true, level: 1, exp: 0 };
        
        let earnedExp = difficulty === 'hard' ? 80 : 50;
        // Adventurer perk: +20% EXP
        if (currentAvatarId === 'adventurer') {
          earnedExp = Math.round(earnedExp * 1.2);
        }

        let newExp = currentAvatarData.exp + earnedExp;
        let newLevel = currentAvatarData.level;
        let maxExpForLevel = getMaxExp(newLevel);

        while (newExp >= maxExpForLevel) {
          newExp -= maxExpForLevel;
          newLevel += 1;
          maxExpForLevel = getMaxExp(newLevel);
        }

        // Avatar perk: Pirate earns +50 clear bonus gold
        let clearBonusGold = 100;
        if (currentAvatarId === 'pirate') {
          clearBonusGold += 50;
        }

        // Mark cleared theme for difficulty unlock (Requirement 7)
        const currentThemeClears = prev.clearedThemes[selectedTheme.id] || { easy: false, hard: false };
        const nextThemeClears = {
          ...currentThemeClears,
          [difficulty]: true,
        };

        const updated: PlayerStats = {
          ...prev,
          gold: prev.gold + clearBonusGold,
          totalCleared: prev.totalCleared + 1,
          avatars: {
            ...prev.avatars,
            [currentAvatarId]: {
              ...currentAvatarData,
              level: newLevel,
              exp: newExp,
            },
          },
          clearedThemes: {
            ...prev.clearedThemes,
            [selectedTheme.id]: nextThemeClears,
          },
        };

        checkAchievements(updated, 'clear');
        return updated;
      });

      setScreen('RESULT_CLEAR');
      return;
    }

    const nextFloorNum = clearedNode.floor + 1;

    setDungeonNodes((prevNodes) => {
      return prevNodes.map((n) => {
        if (n.id === clearedNode.id) {
          return { ...n, visited: true, isAvailable: false };
        }
        if (n.floor === nextFloorNum) {
          const isConnected = clearedNode.nextConnectedIds.includes(n.id);
          return { ...n, isAvailable: isConnected };
        }
        return { ...n, isAvailable: false };
      });
    });

    setStats((prev) => ({
      ...prev,
      currentFloor: nextFloorNum,
      currentNodeId: clearedNode.id,
    }));
  };

  // Rest site heal
  const handleHeal = () => {
    setStats((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + 1),
    }));
    if (activeNode) {
      advanceDungeonNode(activeNode);
    }
    setActiveNode(null);
  };

  // Skip rest site (Requirement 4 & 9: 소량의 골드 지급 + 다음 층으로 넘어가기)
  const handleSkipRest = (rewardGold: number) => {
    // Avatar perk: Rogue gets +25% extra gold from rest skips
    const finalGold = stats.equippedAvatarId === 'rogue' ? Math.round(rewardGold * 1.25) : rewardGold;

    setRunGoldEarned((prev) => prev + finalGold);
    setStats((prev) => ({
      ...prev,
      gold: prev.gold + finalGold,
    }));

    if (activeNode) {
      advanceDungeonNode(activeNode);
    }
    setActiveNode(null);
  };

  // Treasure chest collect
  const handleCollectChest = (gold: number, bonusWord?: WordItem) => {
    // Avatar perk: Rogue gets +25% gold from chests
    const finalGold = stats.equippedAvatarId === 'rogue' ? Math.round(gold * 1.25) : gold;

    setRunGoldEarned((prev) => prev + finalGold);

    if (bonusWord) {
      setRunLearnedWords((prev) => {
        if (prev.some((w) => w.id === bonusWord.id)) return prev;
        return [...prev, bonusWord];
      });
      setStats((prev) => ({
        ...prev,
        gold: prev.gold + finalGold,
        discoveredWordIds: prev.discoveredWordIds.includes(bonusWord.id)
          ? prev.discoveredWordIds
          : [...prev.discoveredWordIds, bonusWord.id],
      }));
    } else {
      setStats((prev) => ({
        ...prev,
        gold: prev.gold + finalGold,
      }));
    }

    if (activeNode) {
      advanceDungeonNode(activeNode);
    }
    setActiveNode(null);
  };

  // Toggle mastered status in notebook
  const handleToggleMastered = (wordId: string) => {
    soundManager.playClick();
    setStats((prev) => {
      const isMastered = prev.masteredWordIds.includes(wordId);
      const next = isMastered
        ? prev.masteredWordIds.filter((id) => id !== wordId)
        : [...prev.masteredWordIds, wordId];
      return { ...prev, masteredWordIds: next };
    });
  };

  // Continue to next theme dungeon from Result screen
  const handleContinueNextDungeon = () => {
    const currentIndex = DUNGEON_THEMES.findIndex((t) => t.id === selectedTheme.id);
    const nextIndex = (currentIndex + 1) % DUNGEON_THEMES.length;
    const nextTheme = DUNGEON_THEMES[nextIndex];
    setSelectedTheme(nextTheme);
    handleStartGame(nextTheme, difficulty);
  };

  // Exit from Result screen to Start screen
  const handleExitToStart = () => {
    setScreen('START');
    setActiveNode(null);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 overflow-hidden font-sans text-slate-100">
      {/* Smartphone Portrait Container */}
      <div className="w-full h-full sm:max-w-md sm:h-[94vh] sm:rounded-[36px] sm:border-4 sm:border-slate-800 bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden sm:ring-1 sm:ring-slate-700/50">
        {/* START SCREEN */}
        {screen === 'START' && (
          <StartScreen
            stats={stats}
            selectedTheme={selectedTheme}
            difficulty={difficulty}
            onSelectTheme={setSelectedTheme}
            onSelectDifficulty={setDifficulty}
            onEquipAvatar={handleEquipAvatar}
            onBuyAvatar={handleBuyAvatar}
            onStartGame={() => handleStartGame(selectedTheme, difficulty)}
            onOpenNotebook={() => setIsNotebookOpen(true)}
            onOpenAchievements={() => setIsAchievementOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* DUNGEON MAP & GAMEPLAY SCREEN */}
        {screen === 'MAP' && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <DungeonHeader
              theme={selectedTheme}
              stats={stats}
              onExitDungeon={() => setScreen('START')}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />

            <DungeonMap
              nodes={dungeonNodes}
              currentFloor={stats.currentFloor}
              currentNodeId={stats.currentNodeId}
              onSelectNode={handleSelectNode}
            />
          </div>
        )}

        {/* RESULT SCREEN (CLEAR or GAMEOVER) */}
        {(screen === 'RESULT_CLEAR' || screen === 'RESULT_GAMEOVER') && (
          <ResultScreen
            isClear={screen === 'RESULT_CLEAR'}
            theme={selectedTheme}
            hp={stats.hp}
            maxHp={stats.maxHp}
            learnedWords={runLearnedWords}
            goldEarned={runGoldEarned}
            onContinue={
              screen === 'RESULT_CLEAR'
                ? handleContinueNextDungeon
                : () => handleStartGame(selectedTheme, difficulty)
            }
            onExit={handleExitToStart}
          />
        )}

        {/* Active Node Quiz Modal (Monster Encounter) */}
        {activeNode && (activeNode.type === 'battle' || activeNode.type === 'elite' || activeNode.type === 'boss') && (
          <BattleQuizModal
            node={activeNode}
            currentHp={stats.hp}
            maxHp={stats.maxHp}
            onAnswerCorrect={handleAnswerCorrect}
            onAnswerWrong={handleAnswerWrong}
            onClose={handleCloseBattleModal}
          />
        )}

        {/* Active Node Event Modal (Rest or Treasure) */}
        {activeNode && (activeNode.type === 'rest' || activeNode.type === 'treasure') && (
          <EventModal
            node={activeNode}
            currentHp={stats.hp}
            maxHp={stats.maxHp}
            bonusWord={selectedTheme.words[stats.currentFloor % selectedTheme.words.length]}
            onHeal={handleHeal}
            onCollectChest={handleCollectChest}
            onSkipRest={handleSkipRest}
            onClose={() => setActiveNode(null)}
          />
        )}

        {/* Notebook / Wordbook Modal */}
        {isNotebookOpen && (
          <NotebookModal
            discoveredWordIds={stats.discoveredWordIds}
            masteredWordIds={stats.masteredWordIds}
            wrongWordIds={stats.wrongWordIds}
            onToggleMastered={handleToggleMastered}
            onClose={() => setIsNotebookOpen(false)}
          />
        )}

        {/* Achievement Hall Modal */}
        {isAchievementOpen && (
          <AchievementModal
            achievements={INITIAL_ACHIEVEMENTS}
            stats={stats}
            onClose={() => setIsAchievementOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
