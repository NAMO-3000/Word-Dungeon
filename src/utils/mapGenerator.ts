import { DungeonTheme, GameDifficulty, MapNode, QuizQuestion, WordItem } from '../types';

const MONSTER_NAMES = [
  { name: '슬라임 고블린', emoji: '🟢' },
  { name: '그림자 박쥐', emoji: '🦇' },
  { name: '스켈레톤 궁수', emoji: '💀' },
  { name: '도서관 미믹', emoji: '📦' },
  { name: '돌골렘 가디언', emoji: '🗿' },
  { name: '얼음 늑대', emoji: '🐺' },
  { name: '팬텀 고스트', emoji: '👻' },
  { name: '화염 도마뱀', emoji: '🦎' },
];

/**
 * 5 Types of Floor 10 Boss Questions (중학교 1학년 수준 완벽 조절)
 */
export function generateBossQuestion(
  word: WordItem,
  theme: DungeonTheme,
  bossTypeIndex: number // 0 to 4
): QuizQuestion {
  const otherWords = theme.words.filter((w) => w.id !== word.id).sort(() => 0.5 - Math.random());
  const distWords = otherWords.slice(0, 3);

  let prompt = '';
  let options: string[] = [];
  let correctIndex = 0;
  let explanation = '';

  switch (bossTypeIndex) {
    case 0: {
      // Type 1: boss_blank (문맥 속 빈칸 완성)
      const regex = new RegExp(`\\b${word.word}\\b`, 'i');
      const sentence = regex.test(word.example)
        ? word.example.replace(regex, '[ ______ ]')
        : `We should learn about [ ______ ] in class.`;

      prompt = `👑 [보스의 시련 1: 문맥 빈칸 완성]\n문맥상 빈칸에 들어갈 가장 알맞은 단어는?\n\n"${sentence}"\n(해석: ${word.exampleKo})`;
      const allOpts = [word.word, ...distWords.map((w) => w.word)].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(word.word);
      options = allOpts;
      explanation = `정답은 "${word.word}"입니다!\n뜻: '${word.meaning}'\n원문: ${word.example} (${word.exampleKo})`;
      break;
    }

    case 1: {
      // Type 2: boss_grammar (중1 핵심 어법 고르기)
      prompt = `👑 [보스의 시련 2: 핵심 어법 판별]\n다음 중 중학교 1학년 문법 규칙에 맞게 올바르게 쓰인 문장은?`;
      
      const correctSentence = word.example;
      // Generate 3 plausible middle school grammar distractor mistakes (e.g. 3rd person singular missing -s, modal verb with -s or -ing, wrong be verb)
      const dist1 = `She don't like to study English on weekends.`; // should be doesn't
      const dist2 = `My brother can plays the piano very well.`; // modal + root verb
      const dist3 = `They was very happy after finishing the homework.`; // they were

      const allOpts = [correctSentence, dist1, dist2, dist3].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(correctSentence);
      options = allOpts;
      explanation = `정답: "${correctSentence}" (${word.exampleKo})\n\n💡 오답 풀이:\n- She don't ➔ She doesn't (주어가 3인칭 단수일 땐 doesn't)\n- can plays ➔ can play (조동사 can 뒤에는 항상 동사원형)\n- They was ➔ They were (They는 복수이므로 과거형 were 사용)`;
      break;
    }

    case 2: {
      // Type 3: boss_dialogue (자연스러운 롤플레잉 영어 대화 완성)
      prompt = `👑 [보스의 시련 3: 일상 대화 완성]\n두 모험가의 대화에서 빈칸 (B)에 들어갈 가장 자연스러운 응답은?\n\nA: "What does the word '${word.word}' mean?"\nB: "[ ________________________________ ]"`;
      
      const correctResponse = `It means '${word.meaning}'.`;
      const wrong1 = `I am twelve years old.`;
      const wrong2 = `Yes, I do it every day.`;
      const wrong3 = `It is raining outside right now.`;

      const allOpts = [correctResponse, wrong1, wrong2, wrong3].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(correctResponse);
      options = allOpts;
      explanation = `정답: "${correctResponse}"\n'${word.word}'의 뜻을 물었으므로, '${word.meaning}'을 뜻한다고 설명하는 답변이 가장 자연스럽습니다.`;
      break;
    }

    case 3: {
      // Type 4: boss_definition (중1 수준의 쉬운 영영 풀이 매칭)
      prompt = `👑 [보스의 시련 4: 영영 풀이 매칭]\n다음 쉬운 영어 설명을 읽고, 설명하는 단어를 고르시오.\n\n"A word that means '${word.meaning}', used as a ${word.partOfSpeech}."`;
      
      const allOpts = [word.word, ...distWords.map((w) => w.word)].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(word.word);
      options = allOpts;
      explanation = `정답: "${word.word}" [${word.partOfSpeech}]\n한국어 뜻: '${word.meaning}'\n예문: ${word.example}`;
      break;
    }

    case 4:
    default: {
      // Type 5: boss_transformation (어형 및 품사 문법 팁 판별)
      prompt = `👑 [보스의 시련 5: 어형 및 문법 수수께끼]\n단어 "${word.word}"와 관련된 다음 설명 중 가장 정확한 것은?`;

      let correctTip = word.grammarTip || `품사는 '${word.partOfSpeech}'이며, 예문에서 "${word.example}"로 쓰입니다.`;
      const wrongTips = [
        `품사가 감탄사이며 오직 문장 맨 끝에만 쓰인다.`,
        `어떤 경우에도 과거형이나 복수형을 만들 수 없는 단어이다.`,
        `항상 부정문에서만 쓸 수 있으며 긍정문에서는 금지된다.`,
      ];

      const allOpts = [correctTip, ...wrongTips].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(correctTip);
      options = allOpts;
      explanation = `정답: ${correctTip}\n단어: "${word.word}" (뜻: ${word.meaning}, 품사: ${word.partOfSpeech})`;
      break;
    }
  }

  return {
    id: `boss_q_${word.id}_${Date.now()}_${Math.random()}`,
    type: `boss_${['blank', 'grammar', 'dialogue', 'definition', 'transformation'][bossTypeIndex]}` as any,
    prompt,
    wordItem: word,
    options,
    correctIndex,
    explanation,
  };
}

/**
 * Generate Middle School Grade 1 regular quiz for a word
 */
export function generateQuestionForWord(
  word: WordItem,
  theme: DungeonTheme,
  questionType: 'meaning' | 'blank' | 'grammar' | 'dialogue',
  difficulty: GameDifficulty = 'easy'
): QuizQuestion {
  const otherWords = theme.words.filter((w) => w.id !== word.id).sort(() => 0.5 - Math.random());
  const distWords = otherWords.slice(0, 3);

  let prompt = '';
  let options: string[] = [];
  let correctIndex = 0;
  let explanation = '';

  // In Hard Mode, bias questions to grammar and grammatical blanks
  if (difficulty === 'hard' && questionType === 'meaning') {
    questionType = 'grammar';
  }

  switch (questionType) {
    case 'blank': {
      const regex = new RegExp(`\\b${word.word}\\b`, 'i');
      if (regex.test(word.example)) {
        prompt = `문장의 빈칸에 들어갈 알맞은 단어를 고르세요.\n"${word.example.replace(regex, '[ ____ ]')}"\n(해석: ${word.exampleKo})`;
      } else {
        prompt = `다음 빈칸에 들어갈 단어로 알맞은 것은?\n"[ ____ ] : ${word.meaning}"`;
      }
      const allOpts = [word.word, ...distWords.map((w) => w.word)].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(word.word);
      options = allOpts;
      explanation = `정답은 "${word.word}"입니다. 뜻: '${word.meaning}'\n예문: ${word.example} (${word.exampleKo})`;
      break;
    }

    case 'grammar': {
      if (word.grammarTip) {
        prompt = `[중1 필수 문법 팁] 단어 "${word.word}"에 대한 설명 중 알맞은 것은?`;
        const fakeGrammarTips = [
          '과거형을 만들 때 끝에 항상 -ing를 붙여야 한다.',
          '주어가 3인칭 단수여도 현재형 동사에 -s를 절대 붙이지 않는다.',
          '문장의 맨 앞에만 올 수 있고 주어 뒤에는 절대 올 수 없다.',
          '단수와 복수의 형태가 언제나 정반대 의미를 가진다.',
        ].sort(() => 0.5 - Math.random()).slice(0, 3);

        const allOpts = [word.grammarTip, ...fakeGrammarTips].sort(() => 0.5 - Math.random());
        correctIndex = allOpts.indexOf(word.grammarTip);
        options = allOpts;
        explanation = `💡 문법 핵심: ${word.grammarTip}\n예문: ${word.example} (${word.exampleKo})`;
      } else {
        prompt = `단어 "${word.word}"의 올바른 품사와 뜻은?`;
        const correct = `[${word.partOfSpeech}] ${word.meaning}`;
        const fakeOpts = distWords.map((w) => `[${w.partOfSpeech}] ${w.meaning}`);
        const allOpts = [correct, ...fakeOpts].sort(() => 0.5 - Math.random());
        correctIndex = allOpts.indexOf(correct);
        options = allOpts;
        explanation = `"${word.word}"는 ${word.partOfSpeech}이며 뜻은 '${word.meaning}'입니다.`;
      }
      break;
    }

    case 'dialogue': {
      prompt = `다음 대화의 빈칸에 알맞은 단어를 고르세요.\nA: "What word means '${word.meaning}' in Korean?"\nB: "It is [ ____ ]."`;
      const allOpts = [word.word, ...distWords.map((w) => w.word)].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(word.word);
      options = allOpts;
      explanation = `정답: "${word.word}"\n뜻: '${word.meaning}'\n예문: ${word.example} (${word.exampleKo})`;
      break;
    }

    case 'meaning':
    default: {
      prompt = `영단어 [ ${word.word} ] 의 올바른 뜻은 무엇일까요?`;
      const allOpts = [word.meaning, ...distWords.map((w) => w.meaning)].sort(() => 0.5 - Math.random());
      correctIndex = allOpts.indexOf(word.meaning);
      options = allOpts;
      explanation = `"${word.word}"의 정확한 뜻은 '${word.meaning}' (${word.partOfSpeech})입니다.\n예문: ${word.example}\n해석: ${word.exampleKo}`;
      break;
    }
  }

  return {
    id: `q_${word.id}_${Date.now()}_${Math.random()}`,
    type: questionType,
    prompt,
    wordItem: word,
    options,
    correctIndex,
    explanation,
  };
}

/**
 * Generates a 10-floor branching tree map for roguelike exploration
 * Dynamically shuffles the 30 words so each run has fresh questions!
 */
export function generateDungeonMap(
  theme: DungeonTheme,
  difficulty: GameDifficulty = 'easy'
): MapNode[] {
  const nodes: MapNode[] = [];
  // Shuffle all 30 words in this theme for dynamic run replayability (Requirement 2)
  const shuffledWords = [...theme.words].sort(() => 0.5 - Math.random());

  // 5 Boss Question types (Requirement 3)
  const randomBossTypeIndex = Math.floor(Math.random() * 5);

  const floorCounts = [2, 2, 2, 2, 1, 2, 2, 2, 2, 1];
  let wordIndex = 0;

  for (let f = 1; f <= 10; f++) {
    const count = floorCounts[f - 1];

    for (let c = 0; c < count; c++) {
      const id = `node_f${f}_c${c}`;
      let type: MapNode['type'] = 'battle';
      let title = `전투 (층 ${f})`;
      let monsterName = '';
      let monsterEmoji = '';
      let monsterHp = 1;
      let question: QuizQuestion | undefined = undefined;

      if (f === 10) {
        // Floor 10 Boss: Selects 1 of 5 boss question types randomly
        type = 'boss';
        title = `보스전: ${theme.bossName}`;
        monsterName = theme.bossName;
        monsterEmoji = theme.bossEmoji;
        monsterHp = 3;
        const bossWord = shuffledWords[wordIndex % shuffledWords.length];
        question = generateBossQuestion(bossWord, theme, randomBossTypeIndex);
      } else if (f === 5) {
        // Rest campfire at midpoint
        type = 'rest';
        title = '모닥불 휴식처';
        monsterEmoji = '🔥';
      } else if ((f === 3 || f === 8) && c === 1) {
        // Treasure chest
        type = 'treasure';
        title = '비밀 보물상자';
        monsterEmoji = '🎁';
      } else if ((f === 4 || f === 7) && c === 0) {
        // Elite Monster
        type = 'elite';
        title = '엘리트 수문장';
        const m = MONSTER_NAMES[(f + c) % MONSTER_NAMES.length];
        monsterName = `엘리트 ${m.name}`;
        monsterEmoji = '⚔️';
        monsterHp = 2;
        const targetWord = shuffledWords[wordIndex % shuffledWords.length];
        wordIndex++;
        // In hard mode, elite is strictly grammar; in easy mode, elite is grammar or contextual blank
        question = generateQuestionForWord(
          targetWord,
          theme,
          difficulty === 'hard' ? 'grammar' : 'blank',
          difficulty
        );
      } else {
        // Normal battle
        type = 'battle';
        const m = MONSTER_NAMES[(f * 2 + c) % MONSTER_NAMES.length];
        monsterName = m.name;
        monsterEmoji = m.emoji;
        monsterHp = 1;
        const targetWord = shuffledWords[wordIndex % shuffledWords.length];
        wordIndex++;

        // Easy Mode: mostly meaning and dialogue (뜻 위주)
        // Hard Mode: mostly grammar and tricky blanks (문법 위주)
        let qType: 'meaning' | 'blank' | 'grammar' | 'dialogue';
        if (difficulty === 'hard') {
          const hardTypes: Array<'grammar' | 'blank'> = ['grammar', 'blank', 'grammar'];
          qType = hardTypes[(f + c) % hardTypes.length];
        } else {
          const easyTypes: Array<'meaning' | 'dialogue' | 'blank'> = ['meaning', 'dialogue', 'meaning'];
          qType = easyTypes[(f + c) % easyTypes.length];
        }

        question = generateQuestionForWord(targetWord, theme, qType, difficulty);
      }

      nodes.push({
        id,
        floor: f,
        colIndex: c,
        type,
        title,
        monsterName,
        monsterEmoji,
        monsterHp,
        question,
        nextConnectedIds: [],
        visited: false,
        isAvailable: f === 1,
      });
    }
  }

  // Connect forward edges:
  for (let f = 1; f < 10; f++) {
    const currentFloorNodes = nodes.filter((n) => n.floor === f);
    const nextFloorNodes = nodes.filter((n) => n.floor === f + 1);

    if (nextFloorNodes.length === 1) {
      currentFloorNodes.forEach((curr) => {
        curr.nextConnectedIds.push(nextFloorNodes[0].id);
      });
    } else if (currentFloorNodes.length === 1) {
      nextFloorNodes.forEach((nxt) => {
        currentFloorNodes[0].nextConnectedIds.push(nxt.id);
      });
    } else {
      currentFloorNodes.forEach((curr, idx) => {
        if (nextFloorNodes[idx]) {
          curr.nextConnectedIds.push(nextFloorNodes[idx].id);
        }
        const crossIdx = idx === 0 ? 1 : 0;
        if (nextFloorNodes[crossIdx]) {
          curr.nextConnectedIds.push(nextFloorNodes[crossIdx].id);
        }
      });
    }
  }

  return nodes;
}
