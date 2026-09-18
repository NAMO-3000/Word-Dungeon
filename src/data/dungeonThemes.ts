import { DungeonTheme, Achievement } from '../types';
import { schoolTheme } from './themes/school';
import { forestTheme } from './themes/forest';
import { castleTheme } from './themes/castle';
import { villageTheme } from './themes/village';
import { cavernTheme } from './themes/cavern';
import { spaceTheme } from './themes/space';
import { oceanTheme } from './themes/ocean';
import { hospitalTheme } from './themes/hospital';
import { marketTheme } from './themes/market';
import { museumTheme } from './themes/museum';

export const DUNGEON_THEMES: DungeonTheme[] = [
  schoolTheme,
  forestTheme,
  castleTheme,
  villageTheme,
  cavernTheme,
  spaceTheme,
  oceanTheme,
  hospitalTheme,
  marketTheme,
  museumTheme,
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: '첫 번째 시련',
    description: '던전에서 첫 번째 단어 퀴즈를 정답으로 맞혔습니다.',
    icon: '⚔️',
    targetCount: 1,
    progressType: 'words',
  },
  {
    id: 'streak_5',
    title: '연속 정답 마스터',
    description: '실수 없이 연속으로 5개의 퀴즈를 맞혔습니다.',
    icon: '🔥',
    targetCount: 5,
    progressType: 'streak',
  },
  {
    id: 'dungeon_clear',
    title: '던전 정복자',
    description: '10층 보스를 쓰러뜨리고 던전을 최초로 클리어했습니다.',
    icon: '🏆',
    targetCount: 1,
    progressType: 'clears',
  },
  {
    id: 'flawless_victory',
    title: '완벽한 생존가',
    description: '목숨을 하나도 잃지 않고 던전을 클리어했습니다.',
    icon: '💖',
    targetCount: 1,
    progressType: 'flawless',
  },
  {
    id: 'survivor',
    title: '기적의 생존',
    description: '목숨이 단 1개 남은 절체절명의 위기에서 클리어했습니다.',
    icon: '⚡',
    targetCount: 1,
    progressType: 'survivor',
  },
  {
    id: 'scholar_10',
    title: '단어 수집가',
    description: '모험 중에 총 10개의 중1 필수 단어를 단어 노트에 기록했습니다.',
    icon: '📜',
    targetCount: 10,
    progressType: 'words',
  },
  {
    id: 'scholar_30',
    title: '대현자의 서재',
    description: '모험 중에 총 30개 이상의 단어를 단어 노트에 수집했습니다.',
    icon: '📚',
    targetCount: 30,
    progressType: 'words',
  },
  {
    id: 'boss_slayer',
    title: '마왕 격퇴자',
    description: '던전의 보스 몬스터를 3회 이상 쓰러뜨렸습니다.',
    icon: '👑',
    targetCount: 3,
    progressType: 'boss',
  },
];
