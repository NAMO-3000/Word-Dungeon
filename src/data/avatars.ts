import { Avatar, AvatarId } from '../types';

export const INITIAL_AVATARS: Record<AvatarId, Omit<Avatar, 'level' | 'exp' | 'maxExp' | 'isUnlocked'>> = {
  adventurer: {
    id: 'adventurer',
    name: '모험가',
    title: '새싹 탐험가',
    emoji: '🧭',
    description: '배움을 두려워하지 않고 던전을 헤쳐나가는 호기심 많은 탐험가입니다.',
    price: 0,
    perkText: '균형 잡힌 기본 능력 (기본 지급)',
  },
  knight: {
    id: 'knight',
    name: '기사',
    title: '철벽의 수호자',
    emoji: '🛡️',
    description: '단단한 갑옷과 방패로 실수를 막아주는 듬직한 전사입니다.',
    price: 100,
    perkText: '최대 목숨 4개로 시작 (체력 +1)',
  },
  mage: {
    id: 'mage',
    name: '마법사',
    title: '지혜의 마도사',
    emoji: '🧙‍♂️',
    description: '고대 어휘의 힘을 다루어 빠른 지식 흡수를 자랑합니다.',
    price: 150,
    perkText: '클리어 시 획득 경험치 +50%',
  },
  rogue: {
    id: 'rogue',
    name: '도적',
    title: '그림자 추적자',
    emoji: '🗡️',
    description: '던전의 숨겨진 보물과 골드를 귀신같이 찾아냅니다.',
    price: 200,
    perkText: '모든 골드 획득량 +40%',
  },
  pirate: {
    id: 'pirate',
    name: '해적',
    title: '푸른 바다의 선장',
    emoji: '🏴‍☠️',
    description: '거친 바다를 누비며 엘리트 몬스터와 보스를 제압하는 호걸입니다.',
    price: 250,
    perkText: '엘리트 및 보스 처치 시 골드 2배',
  },
};

export function getMaxExp(level: number): number {
  return level * 100;
}
