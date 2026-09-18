export type ScreenType =
  | 'START'
  | 'MAP'
  | 'NOTE'
  | 'ACHIEVEMENT'
  | 'AVATAR_SHOP'
  | 'RESULT_CLEAR'
  | 'RESULT_GAMEOVER';

export type NodeType = 'battle' | 'elite' | 'treasure' | 'rest' | 'boss';

export type GameDifficulty = 'easy' | 'hard';

export type AvatarId = 'adventurer' | 'knight' | 'mage' | 'rogue' | 'pirate';

export interface Avatar {
  id: AvatarId;
  name: string;
  title: string;
  emoji: string;
  description: string;
  price: number;
  level: number;
  exp: number;
  maxExp: number;
  isUnlocked: boolean;
  perkText: string;
}

export interface WordItem {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: '명사' | '동사' | '형용사' | '부사' | '전치사' | '접속사';
  themeId: string;
  themeName: string;
  example: string;
  exampleKo: string;
  grammarTip?: string;
  difficulty: 'A1_EASY' | 'A1_MID' | 'A1_HIGH';
}

export type QuestionType =
  | 'meaning'
  | 'blank'
  | 'grammar'
  | 'dialogue'
  | 'boss_blank'
  | 'boss_grammar'
  | 'boss_dialogue'
  | 'boss_definition'
  | 'boss_transformation';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  wordItem: WordItem;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MapNode {
  id: string;
  floor: number; // 1 to 10
  colIndex: number; // For tree layout x position
  type: NodeType;
  title: string;
  monsterName?: string;
  monsterEmoji?: string;
  monsterHp?: number;
  question?: QuizQuestion;
  nextConnectedIds: string[]; // Connected forward nodes
  visited: boolean;
  isAvailable: boolean; // Can be chosen right now
}

export interface DungeonTheme {
  id: string;
  name: string;
  englishName: string;
  description: string;
  icon: string;
  bgGradient: string;
  accentColor: string;
  borderColor: string;
  bossName: string;
  bossEmoji: string;
  bossTitle: string;
  words: WordItem[];
}

export interface PlayerStats {
  hp: number;
  maxHp: number; // default 3
  gold: number;
  currentFloor: number;
  currentNodeId: string | null;
  consecutiveCorrect: number;
  discoveredWordIds: string[];
  masteredWordIds: string[];
  wrongWordIds: string[];
  totalGamesPlayed: number;
  totalCleared: number;
  unlockedAchievementIds: string[];
  equippedAvatarId: AvatarId;
  avatars: Record<AvatarId, { isUnlocked: boolean; level: number; exp: number }>;
  clearedThemes: Record<string, { easy: boolean; hard: boolean }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  progressType: 'games' | 'clears' | 'words' | 'streak' | 'flawless' | 'boss' | 'survivor';
  unlockedAt?: string;
}
