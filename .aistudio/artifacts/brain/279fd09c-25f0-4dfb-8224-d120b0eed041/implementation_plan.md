# 구글 스프레드시트 연동 UI 간소화 및 자동 백그라운드 기록 구현 계획

던전 클리어 및 게임오버 결과 화면에서 구글 시트 연동 버튼과 상태 UI를 완전히 감추고, 백그라운드에서 데이터를 자동으로 전송하도록 변경합니다. 또한, 연동 기록 모달에서 민감한 웹 앱 URL 입력창과 Apps Script 소스 코드 탭을 완전히 제거하여 학생 및 일반 플레이어가 시트 관리 설정에 관여하지 못하도록 보안과 UI 사용성을 간소화합니다.

> [!IMPORTANT]
> - **URL 은닉화**: 기존에 제공된 Google Apps Script Web App URL(`https://script.google.com/macros/s/AKfycbwBSo4RJk4zWA8dzcgqo6H-efeS8wF3syBfGF3J20lpgc_X9JmmQlKcO-HDLZZOv2w_3A/exec`)을 내부 기본 엔드포인트로 설정하여, 화면에 URL이 노출되지 않아도 데이터 기록이 문제없이 실행됩니다.
> - **자동 무간섭 동기화**: 던전 클리어 시 및 게임 오버 시 사용자에게 확인을 묻지 않고, 백그라운드에서 `Stats`(플레이 통계)와 `Sentence_Taps`(문장 탭 통계)가 자동으로 저장됩니다.
> - **모달 간소화**: 구글 시트 연동 기록 모달은 오직 [플레이 통계]와 [문장별 탭 통계] 2개 탭만 제공하며, Apps Script 코드 탭은 완전히 제거됩니다.

---

### 1. 개요 및 주요 목표 (Overview & Core Concept)

- **목표**: 
  1. 구글 시트 연동 기록 모달 내 '구글 Apps Script 웹 앱 URL' 입력 및 노출 영역 제거
  2. 모달 내 [Apps Script 코드] 탭, 복사 및 다운로드 UI 완전 삭제
  3. 던전 클리어 / 게임오버 결과 화면에서 연동 버튼 및 상태 UI를 제거하고, 클리어/실패 이벤트 발생 시 사용자 확인 없이 백그라운드에서 자동으로 데이터 기록

- **대상 사용자**: 중학교 1학년 학생 및 수업 진행 교사 (학생은 게임 플레이와 학습에만 집중하고 기술적 URL이나 코드를 만질 수 없도록 안전하게 캡슐화)

---

### 2. 사용자 경험 및 화면 구성 (User Experience)

1. **던전 클리어 / 게임오버 결과 화면 (`ResultScreen.tsx`)**
   - 구글 시트 연동 버튼(`구글 시트 연동 기록 확인 및 동기화`) 완전 제거.
   - 결과 화면은 획득 보상(골드, 경험치), 학습한 영단어 목록, [이어하기]/[종료하기] 액션 버튼에만 집중.
   - 연동 알림창이나 팝업 없이 백그라운드 비동기 요청(`fetch`)으로 구글 시트에 행이 추가됨.

2. **메인 화면 연동 기록 모달 (`GoogleSheetModal.tsx`)**
   - 탭 목록: `[플레이 통계]` / `[문장별 탭 통계]` (2개 탭만 제공, `Apps Script 코드` 탭 삭제).
   - `[플레이 통계]` 탭:
     - URL 입력 박스 및 URL 관련 안내문구 완전 제거.
     - 현재 플레이어 데이터 미리보기(Timestamp, Play_count, Character_level, Gold_count, Word_count, Clear_count) 및 전송 이력만 깔끔하게 표시.
     - 수동 전송 버튼 및 최근 전송 이력 유지.
   - `[문장별 탭 통계]` 탭:
     - 총 문장 탭 수, 학습한 문장 수, 평균 탭 수 지표 카드 제공.
     - 문장별 클릭 시 발음 재생 및 탭 빈도/평균 통계 확인.

---

### 3. 주요 설계 결정 및 기술 전략 (Technical Strategy)

```
┌─────────────────────────────────────────────────────────────┐
│                       ResultScreen                          │
│   - 던전 클리어 / 게임오버 화면 (결과 & 단어 복습만 노출)     │
│   - 구글 시트 관련 UI 요소 100% 제거                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ 게임 종료 이벤트 발생 (Clear / GameOver)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 App.tsx (Silent Auto-Sync)                  │
│   - 사용자 확인 모달/동의 절차 없이 자동 실행                 │
│   - syncStatsToGoogleSheet(updatedStats)                    │
│   - syncAllSentencesToGoogleSheet()                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ 내부 기본 Web App URL 사용
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Google Apps Script Web App (외부 시트)             │
│   - Stats 시트: Timestamp, Play_count, Lv, Gold, Words, Clear│
│   - Sentence_Taps 시트: Timestamp, Sentence, Taps, Avg, Word │
└─────────────────────────────────────────────────────────────┘
```

1. **기본 URL 캡슐화 (`googleSheetsSync.ts`)**:
   - `getSavedGoogleSheetUrl()`이 UI에 노출되지 않더라도 기본 배포 URL(`https://script.google.com/macros/s/AKfycbwBSo4RJk4zWA8dzcgqo6H-efeS8wF3syBfGF3J20lpgc_X9JmmQlKcO-HDLZZOv2w_3A/exec`)을 항상 반환하도록 보장.
2. **모달 UI 리팩토링 (`GoogleSheetModal.tsx`)**:
   - `activeTab` 상태 타입을 `'sync' | 'sentences'`로 축소.
   - `GOOGLE_APPS_SCRIPT_CODE` 참조 및 복사/다운로드 핸들러 삭제.
   - 상단 URL 설정 블록(`webAppUrl` input) 삭제.
3. **결과 화면 정리 (`ResultScreen.tsx` & `App.tsx`)**:
   - `ResultScreenProps`에서 `onOpenGoogleSheet` 제거.
   - 클리어/게임오버 시 `isAutoSyncEnabled()` 조건과 상관없이 무조건 백그라운드 자동 전송 실행.

---

### 4. 변경 단계 요약

1. **Step 1**: `src/utils/googleSheetsSync.ts`에서 기본 URL 상수 보장 및 불필요한 노출 함수 정리.
2. **Step 2**: `src/components/GoogleSheetModal.tsx`에서 URL 설정 섹션 및 `Apps Script 코드` 탭 UI 완전 제거.
3. **Step 3**: `src/components/ResultScreen.tsx`에서 구글 시트 연동 버튼/상태 확인 UI 제거.
4. **Step 4**: `src/App.tsx`에서 클리어 및 게임오버 시 무조건 백그라운드로 자동 동기화하도록 연동 로직 간소화.
5. **Step 5**: `compile_applet` 및 `lint_applet`을 통해 빌드 및 문법 검증 완료.
