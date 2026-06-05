# Process Designer — 아키텍처 계획

## 핵심 설계 결정 2가지

### A. 캔버스 노드 배치 방식
**결정: 자유 배치 (x,y 좌표)**

이유:
- 반려 경로처럼 역방향 화살표가 생기면 자동 수평 레이아웃이 꼬임
- 업무 흐름이 항상 선형이 아님 (분기, 루프)
- 드래그로 위치 조정하는 UX가 직관적
- 단, "자동 정렬" 버튼으로 깔끔한 수평 배치를 제안하는 기능 추가

구현: 노드마다 `{ x, y }` 저장, SVG 절대좌표로 화살표 그리기

---

### B. 전이 연결 UX
**결정: 포트 드래그 방식 (노드 오른쪽 점 → 다른 노드로 드래그)**

이유:
- 클릭 2회 방식은 "어디서 어디로 연결하는지" 중간 상태가 불명확
- 포트 드래그는 Figma/draw.io와 동일한 멘탈 모델로 직관적
- 드래그 중 임시 화살표(점선)를 SVG로 보여주면 피드백 명확

구현:
- 각 노드 우측에 원형 포트(●) 표시
- 포트 mousedown → SVG에 임시 선 표시 → 다른 노드에서 mouseup → 전이 생성
- 취소: 빈 캔버스에서 mouseup

---

## 전체 컴포넌트 구조

```
App
├── Sidebar (좌측 — 프로세스 목록 + 팔레트)
│   ├── ProcessList (저장된 프로세스 목록)
│   └── ModulePalette (드래그 가능한 모듈 타입 카드)
│
├── DesignerCanvas (중앙 — SVG 오버레이 + 노드들)
│   ├── SVGLayer (화살표, 임시 드래그 선)
│   └── NodeLayer (드래그 가능한 노드 카드들)
│
└── PropertiesPanel (우측 — 선택 항목 편집)
    ├── ProcessMetaForm (프로세스 이름/아이콘/설명)
    ├── NodeConfigPanel (노드 선택 시)
    │   ├── FormModuleConfig
    │   ├── ApprovalModuleConfig
    │   ├── NotificationModuleConfig
    │   ├── DocumentGenModuleConfig
    │   └── DashboardModuleConfig
    ├── TransitionConfigPanel (화살표 선택 시)
    ├── ContextSchemaPanel (등록된 변수 목록)
    └── JsonPreviewPanel (실시간 JSON + 복사/내보내기)
```

---

## 상태(State) 설계

```js
// 디자이너 전체 상태
{
  // 저장된 프로세스 목록
  processes: [ProcessDesign],
  
  // 현재 편집중인 프로세스 ID
  activeProcessId: string | null,
  
  // 캔버스 선택 상태
  selectedNodeId: string | null,
  selectedTransitionId: string | null,
  
  // 포트 드래그 상태
  dragging: {
    type: 'new-node' | 'move-node' | 'connect-port' | null,
    nodeId?: string,           // move-node: 어떤 노드
    fromNodeId?: string,       // connect-port: 출발 노드
    currentX?: number,
    currentY?: number,
  },
  
  // 우측 패널 탭
  rightTab: 'config' | 'json' | 'context',
}

// 프로세스 설계 데이터 (= 엔진 JSON 형식 + 노드 위치)
ProcessDesign = {
  ...ProcessDefinition,  // 엔진 JSON 스키마 그대로
  _layout: {             // 캔버스 위치 (엔진에서는 무시)
    [stateId]: { x: number, y: number }
  },
  _savedAt: string,
}
```

---

## SVG 화살표 그리기 전략

```
노드 A (x1,y1,w,h) → 노드 B (x2,y2,w,h)

출발점: A의 오른쪽 중앙 (x1+w, y1+h/2)
도착점: B의 왼쪽 중앙 (x2, y2+h/2)
경로: cubic bezier (부드러운 곡선)
  C (x1+w+60, y1+h/2) (x2-60, y2+h/2) (x2, y2+h/2)

역방향(B→A)이면:
출발점: B의 아래 중앙 → 도착점: A의 아래 중앙
  (아래로 우회하는 경로)

레이블: 경로 중간점에 foreignObject로 텍스트 표시
화살표 머리: SVG marker (arrowhead)
```

---

## 모듈별 configSchema 폼 명세

### form
```
title: 텍스트 입력
fields: 동적 리스트
  각 항목: key(영문) | label(한글) | type(select) | required(체크) | [options(태그 입력)]
submitLabel: 텍스트 입력
```

### approval
```
title: 텍스트 입력
description: 텍스트 입력
resultKey: 텍스트 입력 (영문, contextSchema에 boolean으로 자동 등록)
commentKey: 텍스트 입력 (영문, 선택적)
approveLabel / rejectLabel: 텍스트 입력
```

### notification
```
title: 텍스트 입력
messageTemplate: textarea ({{변수}} 클릭 삽입 버튼)
autoAdvance: 토글
```

### document-gen
```
title: 텍스트 입력
template: textarea ({{변수}} 클릭 삽입 버튼, 모노스페이스 폰트)
outputKey: 텍스트 입력 (영문)
```

### dashboard
```
title: 텍스트 입력
cardTitleKey: select (contextSchema 변수 목록)
cardSubtitleKey: select
columns: 동적 리스트 (value | label)
```

---

## condition UI → json-logic 변환

드롭다운 3개로 구성:
```
[변수 선택 ▼] [== ▼] [값 입력]
```

변환 규칙:
```
"변수 == 값"   → {"==": [{"var": "변수"}, "값"]}
"변수 != 값"   → {"!=": [{"var": "변수"}, "값"]}
"변수 > 값"    → {">": [{"var": "변수"}, 숫자]}
"변수 == true" → {"==": [{"var": "변수"}, true]}
조건 없음      → null
```

---

## JSON 출력 로직

```js
function buildProcessJSON(design) {
  // _layout, _savedAt 등 내부 필드 제거
  const { _layout, _savedAt, ...def } = design;
  // contextSchema 자동 수집
  def.contextSchema = collectContextSchema(design.states);
  return def;
}

function collectContextSchema(states) {
  const schema = {};
  for (const state of states) {
    if (state.module.type === 'form') {
      for (const field of state.module.config.fields || []) {
        schema[field.key] = { type: field.type, label: field.label, required: !!field.required };
      }
    }
    if (state.module.type === 'approval') {
      const cfg = state.module.config;
      if (cfg.resultKey) schema[cfg.resultKey] = { type: 'boolean', label: cfg.resultKey };
      if (cfg.commentKey) schema[cfg.commentKey] = { type: 'text', label: cfg.commentKey };
    }
    if (state.module.type === 'document-gen') {
      const cfg = state.module.config;
      if (cfg.outputKey) schema[cfg.outputKey] = { type: 'text', label: cfg.outputKey };
    }
  }
  return schema;
}
```

---

## 구현 단계별 체크리스트

### Step 1: 캔버스 + 노드 (확인 후 Step 2 진행)
- [ ] 3-panel 레이아웃 (좌/중/우)
- [ ] 팔레트에서 캔버스로 드래그 → 노드 생성
- [ ] 노드 드래그로 위치 이동
- [ ] 노드 타입별 색상/아이콘
- [ ] 노드 삭제 (× 버튼)
- [ ] SVG 화살표 (포트 드래그로 연결)
- [ ] 자동 정렬 버튼

### Step 2: 속성 패널 + JSON 미리보기
- [ ] 노드 클릭 → 우측 패널 전환
- [ ] form 모듈 필드 편집
- [ ] 나머지 모듈 설정 폼
- [ ] contextSchema 자동 수집 표시
- [ ] JSON 실시간 미리보기 + 복사 버튼

### Step 3: 전이 편집 + 조건 UI
- [ ] 화살표 클릭 → 전이 설정 패널
- [ ] 레이블/trigger 편집
- [ ] 조건 드롭다운 UI → json-logic 변환

### Step 4: 저장/불러오기
- [ ] localStorage 다중 프로세스
- [ ] 새 프로세스 / 복제 / 삭제
- [ ] JSON 내보내기(.json)
- [ ] JSON 가져오기

### Step 5: 테스트 실행
- [ ] "테스트 실행" 버튼 → 우측 패널이 실행 뷰로 전환
- [ ] process-platform.html의 ProcessRenderer 로직 인라인 임베드
- [ ] 초기화 버튼

---

## 파일 출력 위치
`/Users/rok/Documents/Claude/process-designer.html`
