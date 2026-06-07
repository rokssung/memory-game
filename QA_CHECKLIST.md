# 패밀리 게임 허브 — QA 체크리스트

시니어 게임 개발자 관점에서 새 게임을 추가하거나 기존 게임을 수정할 때 반드시 통과해야 하는 항목입니다.

---

## 1. 스토리지 안전성 (Critical)

localStorage는 iOS Safari 사생활 모드 등에서 예외를 throw합니다.
**모든 localStorage 호출은 try-catch로 감싸야 합니다.**

```js
// ❌ 잘못된 패턴
const name = localStorage.getItem('gameName') || '';
localStorage.setItem('rank', JSON.stringify(data));

// ✅ 올바른 패턴
const name = (() => { try { return localStorage.getItem('gameName') || ''; } catch(e) { return ''; } })();
try { localStorage.setItem('rank', JSON.stringify(data)); } catch(e) {}
```

**체크 항목:**
- [ ] getItem 호출 전부 try-catch 확인
- [ ] setItem 호출 전부 try-catch 확인
- [ ] 초기 best/rank 로드 시 try-catch 확인

---

## 2. 게임 로직 (Critical)

### 속도 계산
- [ ] 이동 속도는 항상 `cells/frame × 60fps` 기준으로 계산
  - 예: `0.06 cells/frame` = 초당 3.6칸 이동 (적절)
  - 예: `0.7 cells/frame` = 초당 42칸 이동 (과속 — 이번 팩맨 버그)
- [ ] 레벨업 시 속도 증가폭 검증: `base + (level-1) * increment` 형태로 레벨 1에서 정확한 base speed 보장

### 충돌/수집 판정
- [ ] 이동 속도 × 2 이상의 감지 반경을 사용하거나, 정수 셀 좌표 일치 방식 사용
  - 거리 기반: `Math.abs(pos - target) < radius` → radius는 speed × 2 이상
  - 셀 기반: `Math.round(pos) === cellCoord` (더 안정적)
- [ ] 이동 방향 전환 시 수직 축 스냅 처리 (소수점 드리프트 방지)

### 게임 오버 조건
- [ ] 모든 게임 오버 분기 테스트 (miss, balance, 유령 충돌 등)
- [ ] 게임 오버 후 재시작 시 상태 완전 초기화 확인

---

## 3. 랭킹 시스템 (High)

- [ ] localStorage 키 이름이 기존 게임과 충돌하지 않는지 확인
  - 현재 사용 중인 키: `gameName`, `jumpHeroRank`, `memRank_easy/medium/hard`, `bstack_best`, `bstack_rank`, `pacman_best`, `pacman_rank`, `escape_best`, `escape_rank`
- [ ] 신규 게임 키를 index.html의 `ranks_reset_v1` 초기화 목록에 추가 (단, 플래그가 이미 세팅된 경우 다음 버전 reset_v2로 올려야 함)
- [ ] 랭킹 저장 시 플레이어 이름이 없는 경우 `'?'` fallback 처리
- [ ] 랭킹 최대 10개 유지 확인
- [ ] 정렬 기준 명확히: 점수 내림차순 or 시간 오름차순

---

## 4. 모바일/크로스 디바이스 (High)

- [ ] iOS Safari에서 터치 동작 확인 (`-webkit-tap-highlight-color: transparent`, `user-select: none`)
- [ ] 화면 크기 변화(resize) 시 레이아웃 깨짐 없는지 확인
- [ ] D-패드 or 스와이프 제어 구현 (모바일은 키보드 없음)
- [ ] `viewport` 메타 태그에 `user-scalable=no` 포함

---

## 5. 성능 (Medium)

- [ ] `requestAnimationFrame` 기반 루프 사용 (setInterval 금지)
- [ ] Canvas clearRect → 전체 재렌더 방식인지 확인
- [ ] 매 프레임 대량 DOM 조작 없는지 확인 (HUD 업데이트는 상태 변경 시만)
- [ ] 오브젝트 생성(new Array, new Object)을 루프 안에서 남용하지 않는지 확인

---

## 6. UI/UX (Medium)

- [ ] 게임 허브(`index.html`)로 돌아가는 버튼 존재 확인
- [ ] 게임 오버/클리어 화면에 점수 + 최고 점수 표시
- [ ] 한국어 텍스트 일관성 (다시하기, 게임 허브, 최고: 등)
- [ ] 로딩 없이 즉시 플레이 가능한지 확인 (외부 리소스 최소화)

---

## 7. 신규 게임 추가 시 체크리스트

1. [ ] 파일명: `{game_name}_game.html` 형식
2. [ ] `index.html`에 카드 추가 (아이콘, 설명, 배지, 인원 태그)
3. [ ] 카드 CSS 클래스 `.card-{name}` 추가 (색상 테마 설정)
4. [ ] localStorage 키 목록 이 문서 3번 항목에 추가
5. [ ] 위 체크리스트 1~6번 전부 통과

---

## 버그 이력 (Bug History)

| 날짜 | 게임 | 버그 | 원인 | 수정 |
|------|------|------|------|------|
| 2026-06-07 | pacman | 유령 속도 과속 | spd=0.7 (42칸/초) | spd=0.06으로 수정 |
| 2026-06-07 | pacman | 아이템 미수집 | 이동 중 소수점 드리프트로 감지 범위 이탈 | 정수 셀 좌표 일치 방식으로 변경 |
| 2026-06-07 | jump/memory/balance | iOS 사생활 모드 크래시 | localStorage 호출에 try-catch 없음 | 전부 try-catch 추가 |
